#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Runtime configuration for Approach C
#
# This script runs before nginx starts. It:
#   1. Generates /etc/nginx/nginx.conf from the template by substituting
#      ${BACKEND_HOST} with the actual upstream address.
#   2. Generates /usr/share/nginx/html/config.json from the template by
#      substituting ${API_BASE_URL} with the frontend API base URL.
#   3. Executes the CMD (nginx) via exec so that nginx becomes PID 1 and
#      receives Docker signals (SIGTERM → graceful shutdown) directly.
#
# Environment variables:
#
#   API_BASE_URL  Base URL for API requests written into config.json.
#                 Default: "" (empty string — the browser sends same-origin
#                 requests that nginx proxies to the backend transparently).
#
#   BACKEND_HOST  Upstream backend address for nginx proxy_pass.
#                 Must match the docker-compose service name and port.
#                 Default: "backend:8080"
#
# Advanced customization:
#   Mount a custom template at /etc/nginx/templates/config.json.template
#   to include additional fields or environment variables. The entrypoint
#   will run envsubst on it using ${API_BASE_URL} as the substitution target.
#   For multiple variables, extend the envsubst variable list below.
# =============================================================================
set -e

# --- Defaults ---------------------------------------------------------------
API_BASE_URL="${API_BASE_URL:-}"
BACKEND_HOST="${BACKEND_HOST:-backend:8080}"

export API_BASE_URL BACKEND_HOST

# --- Generate nginx.conf from template --------------------------------------
# envsubst is called with an EXPLICIT variable list ('${BACKEND_HOST}') so that
# only this placeholder is replaced. All other $variables in the template
# (nginx internals like $uri, $host, $remote_addr, etc.) are preserved as-is.
NGINX_TEMPLATE="/etc/nginx/templates/nginx.conf.template"

if [ -f "$NGINX_TEMPLATE" ]; then
    envsubst '${BACKEND_HOST}' < "$NGINX_TEMPLATE" > /etc/nginx/nginx.conf
    echo "entrypoint: nginx.conf generated (BACKEND_HOST=${BACKEND_HOST})"
else
    echo "entrypoint: ERROR — ${NGINX_TEMPLATE} not found" >&2
    exit 1
fi

# --- Generate config.json from template -------------------------------------
# If a custom template exists, use envsubst for full flexibility.
# Otherwise, fall back to a minimal inline generation.
CONFIG_TEMPLATE="/etc/nginx/templates/config.json.template"
CONFIG_OUTPUT="/usr/share/nginx/html/config.json"

if [ -f "$CONFIG_TEMPLATE" ]; then
    envsubst '${API_BASE_URL}' < "$CONFIG_TEMPLATE" > "$CONFIG_OUTPUT"
    echo "entrypoint: config.json generated from template (API_BASE_URL=${API_BASE_URL:-<empty>})"
else
    printf '{"apiBaseUrl":"%s"}\n' "${API_BASE_URL}" > "$CONFIG_OUTPUT"
    echo "entrypoint: config.json generated (API_BASE_URL=${API_BASE_URL:-<empty>})"
fi

# --- Execute CMD ------------------------------------------------------------
# exec replaces this shell process with the CMD (default: nginx -g "daemon off;").
# nginx becomes PID 1 and receives OS signals directly:
#   - SIGTERM from `docker stop` → nginx performs graceful shutdown
#     (stops accepting new connections, finishes in-flight requests, exits)
#   - SIGQUIT → graceful shutdown
#   - SIGUSR1 → reopen log files (for log rotation)
exec "$@"
