#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Runtime configuration for the frontend container
#
# This script runs before nginx starts. It:
#   1. Conditionally generates proxy configuration files when BACKEND_HOST
#      is set (proxy mode). When BACKEND_HOST is NOT set, nginx operates
#      in static-only mode — suitable for use behind an external reverse
#      proxy that handles API routing.
#   2. Generates /usr/share/nginx/html/config.json from the template by
#      substituting ${API_BASE_URL} with the frontend API base URL.
#   3. Executes the CMD (nginx) via exec so that nginx becomes PID 1 and
#      receives Docker signals (SIGTERM → graceful shutdown) directly.
#
# Operating modes:
#
#   Proxy mode (BACKEND_HOST is set):
#     - envsubst upstream.conf.template → /etc/nginx/conf.d/upstream-backend.conf
#     - envsubst proxy.conf.template    → /etc/nginx/conf.d/proxy-backend.conf
#     - nginx serves static files AND proxies /api/* to the backend
#
#   Static-only mode (BACKEND_HOST is NOT set or empty):
#     - No proxy files are generated
#     - nginx serves ONLY static files
#     - Use when an external reverse proxy handles API routing
#
# Environment variables:
#
#   API_BASE_URL  Base URL for API requests written into config.json.
#                 Default: "" (empty string — the browser sends same-origin
#                 requests that nginx proxies to the backend transparently).
#
#   BACKEND_HOST  (OPTIONAL) Upstream backend address for nginx proxy_pass.
#                 Must match the docker-compose service name and port.
#                 When NOT set, nginx runs in static-only mode.
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

export API_BASE_URL

# --- Conditional proxy configuration ----------------------------------------
# When BACKEND_HOST is set, generate upstream and proxy-location files from
# templates. These files are picked up by glob includes in nginx.conf:
#   include /etc/nginx/conf.d/upstream-*.conf;   (http context)
#   include /etc/nginx/conf.d/proxy-*.conf;       (server context)
#
# When BACKEND_HOST is NOT set or empty, skip generation entirely.
# nginx will start in static-only mode — the glob includes match zero files,
# which is valid and produces no errors.
CONF_DIR="/etc/nginx/conf.d"
TEMPLATE_DIR="/etc/nginx/templates"

if [ -n "${BACKEND_HOST:-}" ]; then
    export BACKEND_HOST

    # --- Generate upstream-backend.conf (http context) ----------------------
    # envsubst is called with an EXPLICIT variable list ('${BACKEND_HOST}') so
    # that only this placeholder is replaced. All other $variables in the
    # template (nginx internals like $uri, $host, etc.) are preserved as-is.
    envsubst '${BACKEND_HOST}' \
        < "${TEMPLATE_DIR}/upstream.conf.template" \
        > "${CONF_DIR}/upstream-backend.conf"
    echo "entrypoint: proxy mode ENABLED (BACKEND_HOST=${BACKEND_HOST})"
    echo "entrypoint: generated ${CONF_DIR}/upstream-backend.conf"

    # --- Generate proxy-backend.conf (server context) -----------------------
    # proxy.conf.template contains NO envsubst placeholders — only nginx
    # runtime $variables ($host, $remote_addr, etc.). Copy as-is to avoid
    # any risk of envsubst interpreting nginx variables as shell variables.
    cp "${TEMPLATE_DIR}/proxy.conf.template" "${CONF_DIR}/proxy-backend.conf"
    echo "entrypoint: generated ${CONF_DIR}/proxy-backend.conf"
else
    echo "entrypoint: proxy mode DISABLED (BACKEND_HOST not set) — static-only mode"
fi

# --- Generate config.json from template -------------------------------------
# If a custom template exists, use envsubst for full flexibility.
# Otherwise, fall back to a minimal inline generation.
CONFIG_TEMPLATE="${TEMPLATE_DIR}/config.json.template"
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
