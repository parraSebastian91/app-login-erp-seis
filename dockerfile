# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && \
    rm -rf node_modules/esbuild node_modules/@esbuild && \
    npm install esbuild --force --legacy-peer-deps

COPY . . 
RUN rm -rf node_modules/.cache && \
    rm -rf node_modules/.vite && \
    npm run build -- --configuration production

# 🔍 DEBUG: Ver qué se generó
RUN echo "=== Contenido de dist/ ===" && \
    ls -la /app/dist/ && \
    echo "=== Buscando index.html ===" && \
    find /app/dist -name "index.html" -type f

# Stage 2: Nginx
FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 🔧 AJUSTA ESTA RUTA según el output del comando find arriba
# Opción 1: Si el index.html está en dist/app-login-erp-seis/browser/
COPY --from=builder /app/dist/app-login-erp-seis/browser /usr/share/nginx/html

# Opción 2: Si está en dist/browser/
# COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Opción 3: Si está directamente en dist/
# COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar que se copió correctamente
RUN echo "=== Archivos en nginx html ===" && \
    ls -la /usr/share/nginx/html/ && \
    test -f /usr/share/nginx/html/index.html || \
    (echo "❌ ERROR: index.html NO ENCONTRADO" && exit 1)

# Asegurar permisos correctos
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]