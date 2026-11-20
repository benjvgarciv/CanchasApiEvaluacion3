# Plan de Despliegue en Producción
**Proyecto:** Plataforma de Gestión y Reservas de Complejos Deportivos (CanchasApi)  
**Asignatura:** Lenguaje de Programación Web II — Evaluación 3 (Hito 4)  
**Versión:** 1.0.0 (Producción)

---

## 1. Entornos del Sistema
El ciclo de vida del software contempla tres entornos estrictamente aislados:

| Entorno | Propósito | Base de Datos | Host / URL | Configuración y Secretos |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollo (DEV)** | Construcción local de características y depuración activa. | LocalDB o Docker SQL Server local. | `http://localhost:5098` (API)<br>`http://localhost:5173` (Vite) | `appsettings.Development.json` y `.env.local`. Errores detallados en pantalla (`UseDeveloperExceptionPage`). |
| **Pruebas (STAGING / QA)** | Validación de integración, auditoría de accesibilidad y pruebas de carga. | Contenedor SQL Server con datos sintéticos sembrados (500+ registros). | `https://staging-api.canchas.cl`<br>`https://staging.canchas.cl` | Pipeline de GitHub Actions ejecuta validaciones automáticas. Secretos inyectados vía GitHub Secrets. |
| **Producción (PROD)** | Operación real y concurrente de arriendos deportivos. | Azure SQL Database o Instancia Gestionada con redundancia de zona. | `https://api.canchas.cl`<br>`https://canchas.cl` | Variables de entorno del host o Azure Key Vault. Logs centralizados, HTTPS obligatorio y encabezados estrictos. |

---

## 2. Infraestructura Propuesta
Para una carga de operación verosímil de complejos deportivos (hasta 20 sedes y ~2.000 reservas mensuales):

* **Servidor de Aplicación (Contenedores):** 
  * Instancia Cloud en DigitalOcean Droplet o Azure App Service for Containers.
  * **Dimensionamiento:** 2 vCPU, 4 GB RAM, 60 GB SSD NVMe.
* **Red y Puertos:**
  * **Puerto 80 (HTTP):** Redirección 301 obligatoria a HTTPS.
  * **Puerto 443 (HTTPS):** Certificado SSL/TLS Let's Encrypt con renovación automática vía Certbot.
  * **Puerto 8080 (Interno):** API ASP.NET Core accesible únicamente dentro de la red privada `canchas-network`.
  * **Puerto 1433 (Interno):** SQL Server aislado; bloqueado para accesos externos.
* **Dominio y CDN:** Cloudflare como proxy DNS y protección WAF contra ataques de Denegación de Servicio (DDoS).

---

## 3. Pasos de Despliegue en Orden
El despliegue en un host virgen se realiza mediante los siguientes comandos ordenados:

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/usuario/CanchasApiEvaluacion3.git /opt/canchas-app
cd /opt/canchas-app
```

### Paso 2: Configurar las variables de entorno de producción
```bash
cp .env.example .env
nano .env # Establecer contraseñas seguras, JWT Key criptográfica y claves de IA
```

### Paso 3: Construcción e inicialización con Docker Compose
```bash
# Construir imágenes multi-stage y arrancar servicios en segundo plano
docker compose up --build -d
```

### Paso 4: Aplicar migraciones automáticas en la base de datos
```bash
# Ejecutar actualización de base de datos desde el contenedor de la API
docker compose exec backend dotnet ef database update
```

### Paso 5: Sembrar datos sintéticos de prueba (Opcional para verificación inicial)
```bash
curl -X POST http://localhost:5098/crear-usuarios-test
curl -X POST http://localhost:5098/crear-seed-500
```

### Paso 6: Verificación de Salud (*Health Check*)
```bash
curl -i http://localhost:5098/health
# Debe retornar HTTP 200 OK con { "database": "connected" }
```

---

## 4. Gestión de Secretos y Variables de Entorno
* **Prohibición de Secretos en Git:** Ningún valor sensible (`DB_PASSWORD`, `Jwt:Key`, `AI_API_KEY`) reside en el historial de Git. El archivo `.gitignore` excluye `.env`, `*.bak`, `appsettings.Production.json`.
* **Inyección en Servidor:** Las variables se administran en el archivo `.env` del servidor con permisos de archivo restringidos (`chmod 600 /opt/canchas-app/.env`).
* **CI/CD:** En GitHub Actions, se configuran como secretos del repositorio (`Settings > Secrets and variables > Actions`).

---

## 5. Estrategia de Actualización y Reversión (*Rollback*)
* **Actualización Sin Caída (*Zero-Downtime Rollout*):**
  1. El pipeline de CI/CD compila y prueba la nueva versión.
  2. En el servidor se ejecuta `docker compose pull` o se construyen las nuevas imágenes con etiqueta semántica de versión (ej: `v1.1.0`).
  3. Se inicia el nuevo contenedor y se espera el paso del `healthcheck` antes de apagar el anterior.
* **Estrategia de Rollback:**
  * **Código:** Si la versión presenta fallas, se revierte con:
    ```bash
    git checkout tags/v1.0.0
    docker compose up -d --build
    ```
  * **Base de Datos:** EF Core permite retroceder migraciones específicas sin pérdida de integridad:
    ```bash
    docker compose exec backend dotnet ef database update NombreMigracionAnterior
    ```

---

## 6. Respaldo y Recuperación ante Desastres (RTO y RPO)
* **Objetivos de Continuidad del Negocio:**
  * **RPO (*Recovery Point Objective*):** Máximo 1 hora de pérdida de datos.
  * **RTO (*Recovery Time Objective*):** Máximo 30 minutos para restaurar el servicio completo.
* **Estrategia de Backup Automatizado:**
  * **Copia Completa Semanal:** Domingo a las 02:00 AM (Retención: 4 semanas).
  * **Copia Diferencial Diaria:** Cada noche a las 03:00 AM.
  * **Copia de Logs de Transacciones:** Cada 60 minutos.
* **Script de Respaldo Automatizado (Cron Job):**
  ```bash
  0 3 * * * docker exec canchas-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -C -Q "BACKUP DATABASE [ReservasCanchasDB] TO DISK = '/var/opt/mssql/backup_daily.bak' WITH FORMAT;"
  ```
* **Prueba de Restauración Validada:**
  Ejecutada y comprobada con `RESTORE DATABASE ... WITH REPLACE` y validada con `DBCC CHECKDB` arrojando cero errores de consistencia.

---

## 7. Monitoreo y Registro de Logs
* **Métricas Clave Monitoreadas:**
  * Tasa de uso de CPU y memoria RAM de los contenedores (`docker stats`).
  * Latencia promedio de peticiones HTTP en `/api/v1/` (&lt; 200 ms).
  * Estado del endpoint de conectividad `/health`.
  * Intentos de inicio de sesión fallidos y bloqueos por Rate Limiting (código 429).
* **Visibilidad y Alertas:**
  * Middleware `RequestLoggingMiddleware.cs` registra cada petición con método, ruta, código de estado y tiempo de respuesta en milisegundos.
  * Alertas configuradas en Cloudflare y UptimeRobot para notificar por correo/webhook ante caídas del servicio (&gt; 1 minuto).

---

## 8. Seguridad en Producción (Hardening)
1. **Contenedores no privilegiados:** La API corre bajo el usuario no root `$APP_UID` en imagen Alpine.
2. **Cabeceras de Seguridad HTTP:**
   * `X-Content-Type-Options: nosniff` (previene MIME sniffing).
   * `X-Frame-Options: DENY` (mitiga Clickjacking).
   * `Referrer-Policy: strict-origin-when-cross-origin`.
3. **Control de CORS Estricto:** La política `FrontendPolicy` en producción admite únicamente el dominio autorizado (`https://canchas.cl`).
4. **Protección OWASP API4 (Rate Limiting):** Límite estricto de 5 peticiones por minuto en rutas de autenticación y servicios de IA para evitar abusos o ataques de fuerza bruta.

---

## 9. Estimación de Costos y Matriz de Riesgos

### 9.1. Estimación Presupuestaria Mensual
| Componente | Proveedor / Servicio | Especificación | Costo Mensual Estimado |
| :--- | :--- | :--- | :---: |
| Servidor de Aplicación | DigitalOcean Droplet | 2 vCPU, 4 GB RAM, 60 GB SSD | $24.00 USD |
| Base de Datos SQL | Azure SQL Database (Básico) | 5 DTUs, 2 GB Almacenamiento | $4.99 USD |
| Dominio + WAF + SSL | Cloudflare | Plan Gratuito (SSL + DDoS Shield) | $0.00 USD |
| API de Inteligencia Artificial | OpenAI GPT-4o-mini | ~500 consultas analíticas/mes | $1.50 USD |
| **TOTAL ESTIMADO** | | | **~$30.49 USD / mes** |

### 9.2. Matriz de Riesgos y Mitigación
| Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación |
| :--- | :---: | :---: | :--- |
| **Caída de la Base de Datos** | Baja | Crítico | Healthcheck en Docker con reinicio automático y backups horarios. |
| **Agotamiento de cuota de IA externa** | Media | Bajo | Motor heurístico de contingencia local que responde sin dependencias. |
| **Ataque de Fuerza Bruta en Login** | Alta | Medio | Rate Limiting con HTTP 429 y bloqueo temporal de IP. |
| **Corrupción en Migración de Datos** | Baja | Alto | Snapshot preventivo antes de cada `dotnet ef database update`. |

---

## 10. Lista de Verificación Previa a Producción (*Go-Live Checklist*)
Antes de abrir el sistema al público, el equipo debe verificar cada uno de los siguientes puntos:

- [x] Las pruebas automatizadas en CI pasan al 100% (Backend: 16/16, Frontend: 9/9).
- [x] Contenedores configurados con multi-stage builds en `compose.yaml`.
- [x] Archivo `.env` configurado con claves criptográficas robustas (sin valores por defecto).
- [x] Base de datos relacional creada y migrada con todas las restricciones `CHECK` y claves `UNIQUE`.
- [x] Endpoint de salud `/health` responde HTTP 200 OK.
- [x] Auditoría de accesibilidad WCAG 2.2 AA aprobada sin errores críticos.
- [x] Certificado SSL/HTTPS habilitado con redirección forzada.
- [x] Exportación de reportes a Excel, PDF y CSV verificada.
- [x] Copia de seguridad inicial generada y validada con comando de restauración.
- [x] Manual de usuario distribuido a los administradores y personal de turno.
