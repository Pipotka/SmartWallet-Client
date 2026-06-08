# =============================================================================
# Smart Wallet Web App — Frontend Container
#
# nginx is the single entry point. It serves frontend static files and
# optionally proxies /api/* requests to the backend service.
#
# Operating modes:
#
#   Proxy mode (BACKEND_HOST is set):
#     Browser ──> nginx:8080
#                   ├── /api/*        → proxy_pass <BACKEND_HOST>
#                   ├── /assets/*     → static files (1yr immutable cache)
#                   ├── /config.json  → runtime-generated (no-cache)
#                   └── /*            → SPA fallback → index.html
#
#   Static-only mode (BACKEND_HOST is NOT set):
#     Browser ──> nginx:8080
#                   ├── /assets/*     → static files (1yr immutable cache)
#                   ├── /config.json  → runtime-generated (no-cache)
#                   └── /*            → SPA fallback → index.html
#     Use this mode when an external reverse proxy handles API routing.
#
# ENVIRONMENT VARIABLES:
#
#   API_BASE_URL  Base URL written into /config.json for the frontend.
#                 Default: "" (empty — browser sends same-origin requests
#                 that nginx proxies to the backend transparently).
#
#   BACKEND_HOST  (OPTIONAL) Upstream address for nginx proxy_pass.
#                 Must match the docker-compose service name and port.
#                 When NOT set, nginx runs in static-only mode.
#
# SAMPLE docker-compose.yml (proxy mode):
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
# SAMPLE docker-compose.yml (static-only mode, behind external reverse proxy):
#
#   services:
#     frontend:
#       image: smart-wallet-frontend:latest
#       expose:
#         - "8080"
#       environment:
#         API_BASE_URL: ""
#         # BACKEND_HOST is intentionally NOT set
#
# BUILD:
#   docker build -t smart-wallet-frontend:latest .
#
# RUN (proxy mode):
#   docker run -d -p 3000:8080 \
#     -e BACKEND_HOST=backend:8080 \
#     -e API_BASE_URL="" \
#     --name smart-wallet-frontend \
#     smart-wallet-frontend:latest
#
# RUN (static-only mode):
#   docker run -d -p 3000:8080 \
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

# Remove the default nginx site configuration to avoid conflicts.
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx configuration as a STATIC file (no envsubst needed).
# This file contains glob include directives that pull in proxy configuration
# at runtime when BACKEND_HOST is set.
COPY nginx.conf /etc/nginx/nginx.conf

# Copy proxy configuration templates.
# These are processed by envsubst at container startup ONLY when BACKEND_HOST
# is set. The generated files are written to /etc/nginx/conf.d/ and picked up
# by the glob includes in nginx.conf.
COPY upstream.conf.template /etc/nginx/templates/upstream.conf.template
COPY proxy.conf.template    /etc/nginx/templates/proxy.conf.template

# Copy entrypoint script.
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Copy Vite build output from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Generate config.json template, set entrypoint permissions, and fix ownership
# so the non-root user (UID 1001) can read/write all required paths.
#
# Key permission changes:
#   - /etc/nginx/conf.d/       → writable by appuser (entrypoint writes proxy
#                                 config files here at runtime)
#   - /etc/nginx/templates/    → readable by appuser (entrypoint reads templates)
#   - /usr/share/nginx/html    → writable by appuser (entrypoint writes config.json)
#   - /var/cache/nginx         → writable by appuser (nginx runtime cache)
#   - /var/log/nginx           → writable by appuser (nginx runtime logs)
#   - /tmp/nginx               → writable by appuser (nginx temp files)
RUN printf '{"apiBaseUrl":"${API_BASE_URL}"}\n' \
        > /etc/nginx/templates/config.json.template && \
    chmod +x /docker-entrypoint.sh && \
    chown -R 1001:1001 /etc/nginx/conf.d \
                        /etc/nginx/templates \
                        /usr/share/nginx/html \
                        /var/cache/nginx \
                        /var/log/nginx \
                        /tmp/nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz || exit 1

USER 1001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
