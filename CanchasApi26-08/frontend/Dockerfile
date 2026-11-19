# Multi-stage Dockerfile para Frontend React 19 + Vite + TypeScript
# Etapa 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar estáticos de producción
COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx Ligero para Producción
FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración Nginx para soporte SPA (react-router)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8080/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
