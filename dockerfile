# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de la aplicación Angular
RUN npm run build -- --configuration production

# Verificar que el build se completó
RUN ls -la /app/dist/app-login-erp-seis/ || echo "Build directory not found"

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar archivo de configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build desde el stage anterior
COPY --from=builder /app/dist/app-login-erp-seis/browser /usr/share/nginx/html

# Verificar archivos copiados
RUN ls -la /usr/share/nginx/html/

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]