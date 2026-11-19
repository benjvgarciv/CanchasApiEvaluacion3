# Plan de Despliegue en Producción — CanchasApi

**Proyecto:** Plataforma de Gestión y Reserva de Canchas  
**Asignatura:** Lenguaje de Programación Web II — Evaluación 3  
**Integrantes:** Rodrigo Tapia, Gustavo Jaramillo, Benjamin Garcia  

---

## 1. Entornos de Ejecución
- **Desarrollo (Local):** `localhost:5173` (Frontend Vite) y `localhost:5000` / `localhost:8080` (Backend .NET), base de datos SQL Server LocalDB / Express o Docker. Modo `ASPNETCORE_ENVIRONMENT=Development`, Swagger/Scalar habilitado y CORS abierto para desarrollo local.
- **Pruebas (Staging / CI):** Ejecución automatizada en GitHub Actions con base de datos en memoria para pruebas de integración xUnit y validación de compilación de frontend con TypeScript estricto.
- **Producción:** Entorno de contenedores orquestados con Docker Compose o Kubernetes. Modo `ASPNETCORE_ENVIRONMENT=Production`, HTTPS forzado, Rate Limiting activo, logging centralizado y OpenAPI protegido/restringido.

## 2. Infraestructura Propuesta
- **Plataforma:** Servidor Cloud (AWS EC2 / DigitalOcean Droplet / Azure VM) con 2 vCPU, 4GB RAM y 50GB SSD NVMe.
- **Red y Puertos:** 
  - `80` (HTTP) y `443` (HTTPS) expuestos al exterior vía Proxy Inverso Caddy/Nginx con renovación automática de certificados SSL Let's Encrypt.
  - `8080` (Backend API) y `1433` (SQL Server) aislados en una red interna privada de Docker (`canchas-network`), no expuestos directamente a internet público.
- **Dominio:** `https://canchas.midominio.cl` apuntando a la IP pública elástica del servidor.

## 3. Pasos de Despliegue en Orden
1. **Aprovisionamiento del Servidor:** Instalar Docker Engine y el plugin Docker Compose.
2. **Clonado del Repositorio:**
   ```bash
   git clone https://github.com/usuario/CanchasApiEvaluacion3.git
   cd CanchasApiEvaluacion3
   ```
3. **Configuración de Variables de Entorno:**
   ```bash
   cp .env.example .env
   nano .env  # Asignar contraseñas seguras y API keys reales
   ```
4. **Construcción y Lanzamiento:**
   ```bash
   docker compose up -d --build
   ```
5. **Verificación de Salud:**
   ```bash
   docker compose ps
   curl -f http://localhost:8080/health
   ```
6. **Ejecución de Migraciones y Sembrado Inicial:**
   Las migraciones de Entity Framework Core se aplican automáticamente al iniciar la API o mediante:
   ```bash
   docker compose exec backend dotnet ef database update
   ```

## 4. Gestión de Secretos y Variables de Entorno
- Los secretos (`SA_PASSWORD`, `JWT_KEY`, `GEMINI_API_KEY`) residen exclusivamente en el archivo `.env` del servidor, el cual está explícitamente ignorado por `.gitignore`.
- En producción se recomienda la inyección mediante Azure Key Vault, AWS Secrets Manager o GitHub Secrets para despliegues CI/CD automatizados.
- Ninguna clave sensible queda registrada en texto plano dentro del repositorio ni en las imágenes Docker.

## 5. Estrategia de Actualización y Rollback
- **Estrategia Rolling Update / Blue-Green:**
  1. Descarga de la nueva versión con `git pull origin main`.
  2. Compilación de nuevas imágenes: `docker compose build`.
  3. Despliegue con tiempo de inactividad casi nulo: `docker compose up -d --no-deps backend`.
- **Estrategia de Rollback:**
  - Si la nueva versión falla los healthchecks, se revierte a la imagen previa etiquetada mediante:
    ```bash
    docker compose stop backend
    docker tag canchas-backend:previous canchas-backend:latest
    docker compose up -d backend
    ```
  - En migraciones de base de datos, EF Core permite retroceder a una migración específica:
    ```bash
    dotnet ef database update NombreMigracionAnterior
    ```

## 6. Respaldo y Recuperación ante Desastres (DRP)
- **Frecuencia:** Copias de seguridad completas automatizadas diariamente a las 03:00 hrs y respaldos diferenciales cada 6 horas vía cron job de SQL Server.
- **Script de Respaldo:**
  ```sql
  BACKUP DATABASE [ReservasCanchasDB] TO DISK = '/var/opt/mssql/backup/ReservasCanchasDB_Full.bak' WITH FORMAT, COMPRESSION;
  ```
- **RTO (Recovery Time Objective):** Menor a 30 minutos para restauración completa del servicio.
- **RPO (Recovery Point Objective):** Menor a 6 horas de pérdida máxima de datos transaccionales.

## 7. Monitoreo y Logs
- **Healthcheck:** Endpoint `/health` expuesto en la API, conectado al estado de la base de datos SQL Server.
- **Logging de Peticiones:** Middleware centralizado `RequestLoggingMiddleware` que registra método, ruta, código de estado y tiempo de respuesta en milisegundos.
- **Alertas y Visualización:** Registro unificado con Docker Logs (`docker compose logs -f backend`). Compatible con exportación a stack Grafana + Loki o Datadog.

## 8. Seguridad en Producción
- **Cabeceras HTTP de Seguridad:** Inyección en middleware de:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` estricto en el servidor Nginx.
- **Rate Limiting:** Protección de fuerza bruta en `/api/v1/usuarios/login` (5 peticiones por minuto con código HTTP 429).
- **Protección BOLA / RBAC:** Verificación de token JWT en cada solicitud y validación de propiedad de reserva por `UsuarioId`.
- **Contenedores no-root:** Backend configurado sobre usuario `appuser` con privilegios mínimos en Linux Alpine.

## 9. Estimación de Costos y Matriz de Riesgos
- **Costos Estimados Mensuales:**
  - Servidor Cloud VPS (2 vCPU / 4 GB RAM): ~$24 USD / mes.
  - Almacenamiento y Respaldos en Objeto (S3 / B2): ~$3 USD / mes.
  - Dominio y DNS: ~$1.2 USD / mes ($14 USD/año).
  - Costo Total Estimado: **~$28.2 USD / mes**.
- **Riesgos y Mitigaciones:**
  - *Saturación de Conexiones a BD:* Mitigado con pooling de conexiones Hikari/EF Core y Rate Limiting.
  - *Caída del Servidor:* Reinicio automático configurado con `restart: unless-stopped`.
  - *Solapamiento de Reservas Concurrente:* Transacciones ACID con nivel de aislamiento y validación doble antes del `INSERT`.

## 10. Lista de Verificación (Checklist) Previa a Salir a Producción
- [x] Contraseña de SA cambiada del valor por defecto a una clave criptográfica de 16+ caracteres.
- [x] Clave simétrica de JWT configurada con mínimo 256 bits y expiración de 60 minutos.
- [x] Base de datos migrada y datos sintéticos verificados (500 reservas).
- [x] Certificado SSL / HTTPS configurado y activo.
- [x] CORS configurado únicamente para el dominio oficial del frontend.
- [x] Pruebas automatizadas de integración ejecutadas con éxito (0 fallas).
- [x] Prueba de backup y restauración validada con `DBCC CHECKDB`.
- [x] Accesibilidad validada sin errores críticos en auditoría WCAG 2.2 AA.
