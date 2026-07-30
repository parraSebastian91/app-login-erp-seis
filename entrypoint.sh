#!/bin/sh
# Genera env.js en runtime para inyectar variables de entorno al browser
cat <<EOF > /usr/share/nginx/html/env.js
window.__env = {
  PORTAL_URL: "${PORTAL_URL:-}",
  API_BASE_URL: "${API_BASE_URL:-}",
  HOST_PROTOCOL: "${HOST_PROTOCOL:-}",
  HOST_LAN_IP: "${HOST_LAN_IP:-}",
  PROXY_PORT: "${PROXY_PORT:-}"
};
EOF

exec nginx -g "daemon off;"
