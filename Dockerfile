# syntax=docker/dockerfile:1.7

# =============================================================================
# Smart Wallet Web App — Approach C: Reverse Proxy Architecture
#
# nginx is the single entry point. It serves frontend static files AND proxies
# /api/* requests to the backend service, eliminating CORS issues and ensuring
# HTTP-only cookies work transparently (same origin).
#
#   Browser ──> nginx:8080
#                 ├── /api/*        → proxy_pass backend:8080
#                 ├── /assets/*     → static files (1yr immutable cache)
#                 ├── /config.json  → runtime-generated (no-cache)
#                 └── /*            → SPA fallback → index.html
#
# ENVIRONMENT VARIABLES:
#
#   API_BASE_URL  Base URL written into /config.json for the frontend.
#                 Default: "" (empty — browser sends same-origin requests
#                 that nginx proxies to the backend transparently).
#
#   BACKEND_HOST  Upstream address for nginx proxy_pass.
#                 Must match the docker-compose service name and port.
#                 Default: "backend:8080"
#
# SAMPLE docker-compose.yml (placed in the backend repository):
#
#   services:
#     backend:
#       image: smart-wallet-backend:latest
#       expose:
#         - "8080"
#
#     frontend:
#       image: smart-wallet-frontend:latest
#       ports:
#         - "3000:8080"
#       environment:
#         API_BASE_URL: ""
#         BACKEND_HOST: "backend:8080"
#       depends_on:
#         - backend
#
# BUILD:
#   docker build -t smart-wallet-frontend:latest .
#
# RUN:
#   docker run -d -p 3000:8080 \
#     -e BACKEND_HOST=backend:8080 \
#     -e API_BASE_URL="" \
#     --name smart-wallet-frontend \
#     smart-wallet-frontend:latest
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build — compile TypeScript + bundle with Vite
# -----------------------------------------------------------------------------
FROM node:20.18-alpine3.20 AS build

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching.
# This layer is only invalidated when package.json or package-lock.json change.
COPY package.json package-lock.json ./

# Install all dependencies (devDependencies are required for the build).
# --ignore-scripts skips postinstall hooks for speed and security.
RUN npm ci --ignore-scripts

# Copy application source code.
COPY . .

# Build: tsc -b (TypeScript project references) then vite build (bundle).
# Output goes to /app/dist/ (Vite default outDir).
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production — nginx reverse proxy + static files
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install gettext (provides envsubst for runtime template substitution).
# Create non-root user (UID 1001) and group.
# Create temp directories required by nginx when running without root.
RUN apk add --no-cache gettext && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    mkdir -p /tmp/nginx/client_body \
             /tmp/nginx/proxy \
             /tmp/nginx/fastcgi \
             /tmp/nginx/uwsgi \
             /tmp/nginx/scgi

# Copy nginx configuration template.
# The ${BACKEND_HOST} placeholder is substituted at container startup by the
# entrypoint script using envsubst with an explicit variable list, so nginx
# internal variables ($uri, $host, etc.) are preserved.
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Copy entrypoint script.
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Copy Vite build output from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Generate config.json template, set entrypoint permissions, and fix ownership
# so the non-root user (UID 1001) can read/write all required paths.
RUN printf '{"apiBaseUrl":"${API_BASE_URL}"}\n' \
        > /etc/nginx/templates/config.json.template && \
    chmod +x /docker-entrypoint.sh && \
    chown -R 1001:1001 /usr/share/nginx/html \
                        /etc/nginx/templates \
                        /var/cache/nginx \
                        /var/log/nginx \
                        /tmp/nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

USER 1001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
