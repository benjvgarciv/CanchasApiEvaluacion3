# Guía de Evidencias y Capturas para Evaluación del Hito 2: Datos y Backend
**Asignatura:** Lenguaje de Programación Web II (Integración con Base de Datos y Orientación a Objetos II)  
**Proyecto:** CanchasApi — Plataforma de Gestión y Reservas de Complejos Deportivos  
**Objetivo:** Proporcionar las rutas, comandos, pantallas y consultas exactas para tomar las capturas de pantalla requeridas por la pauta del **Hito 2 (Semana 12)**.

---

## 📸 Checklist Rápido de Capturas Requeridas

| N° | Evidencia / Captura | Herramienta | Qué debe verse en la imagen |
| :-: | :--- | :--- | :--- |
| **1** | Migraciones versionadas y tablas creadas | SSMS / Azure Data Studio | Lista de las 12 tablas en `ReservasCanchasDB` y tabla `__EFMigrationsHistory`. |
| **2** | Restricciones de Integridad (CHECK y UNIQUE) | SSMS (Object Explorer / Script) | Restricciones `CK_Usuario_Rol`, `CK_Cancha_Estado`, `CK_Reserva_Fechas`, `CK_Reserva_Estado`. |
| **3** | Sembrado de ≥ 500 reservas y 12 meses | SSMS / PowerShell / Scalar | Consulta `SELECT COUNT(*)` arrojando ≥ 500 registros y rango de 12 meses. |
| **4** | Estrategia de Backup y Restore probada | SSMS / SQL Script | Mensajes de éxito de `BACKUP DATABASE`, `RESTORE DATABASE` y `DBCC CHECKDB` (0 errores). |
| **5** | Documentación de la API en vivo (Scalar/OpenAPI) | Navegador (`/scalar/v1`) | Interfaz interactiva de endpoints (`/api/v1/reservas`, `/canchas`, etc.). |
| **6** | Autenticación JWT y Roles (RBAC) | Postman / Scalar / Thunder Client | Petición de login obteniendo Token JWT y decodificación con claims `role` e `id`. |
| **7** | Validación Nivel 2: Solapamiento Horario | Postman / Scalar | Petición POST que intenta reservar misma cancha a misma hora $\rightarrow$ `HTTP 409 Conflict`. |
| **8** | Máquina de Estados: Bloqueo de cambios terminales | Postman / Scalar | Petición PUT a reserva `Completada` o `Cancelada` $\rightarrow$ `HTTP 400 Bad Request`. |
| **9** | Mitigación OWASP API1 (BOLA / 403 Forbidden) | Postman / Scalar | Cliente intentando consultar reserva ajena $\rightarrow$ `HTTP 403 Forbidden`. |
| **10** | Mitigación OWASP API4 (Rate Limiting / 429) | Postman / PowerShell | Más de 5 intentos seguidos a `/login` $\rightarrow$ `HTTP 429 Too Many Requests`. |
| **11** | Paginación en Endpoints Masivos | Postman / DevTools | Petición con `?page=1&pageSize=10` mostrando headers `X-Total-Count`, `X-Total-Pages`. |
| **12** | Compilación Limpia del Backend | Consola / Terminal | Comando `dotnet build` finalizando con `0 Errores` y `0 Advertencias`. |

---

## 1. Evidencias de Base de Datos y Migraciones (Criterio Base de Datos)

### 1.1. Captura: Las 12 Tablas del Modelo Relacional
* **Dónde:** Abrir SQL Server Management Studio (SSMS) conectado a `DESKTOP-BTUPOMU\SQLEXPRESS` o LocalDB.
* **Acción:** Desplegar en el panel izquierdo: `Bases de datos` $\rightarrow$ `ReservasCanchasDB` $\rightarrow$ `Tablas`.
* **Qué capturar:** Que se vean las 12 entidades del sistema junto a `__EFMigrationsHistory`:
  1. `dbo.Usuario`
  2. `dbo.Trabajador`
  3. `dbo.Sede`
  4. `dbo.TipoCancha`
  5. `dbo.Cancha`
  6. `dbo.Horario`
  7. `dbo.Reserva` (Entidad principal)
  8. `dbo.Pago`
  9. `dbo.Comprobante`
  10. `dbo.Resena`
  11. `dbo.Mantenimiento`
  12. `dbo.Notificacion`
  13. `dbo.__EFMigrationsHistory`

### 1.2. Captura: Restricciones de Integridad (CHECK y UNIQUE)
* **Dónde:** SSMS $\rightarrow$ Nueva Consulta.
* **Consulta a ejecutar:**
```sql
USE [ReservasCanchasDB];

-- Ver Restricciones CHECK
SELECT 
    TABLE_NAME AS Tabla,
    CONSTRAINT_NAME AS NombreRestriccion,
    CHECK_CLAUSE AS DefinicionCheck
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
    ON cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
ORDER BY TABLE_NAME;
```
* **Qué capturar:** La cuadrícula con `CK_Usuario_Rol`, `CK_Cancha_Estado`, `CK_Reserva_Fechas`, `CK_Reserva_Estado`, `CK_Pago_Metodo`, etc.

### 1.3. Captura: Sembrado de 500+ Registros y 12 Meses de Historia
* **Consulta a ejecutar en SSMS:**
```sql
USE [ReservasCanchasDB];

-- 1. Totales de la entidad principal y módulos asociados
SELECT 
    (SELECT COUNT(*) FROM [Reserva]) AS TotalReservas_Principal,
    (SELECT COUNT(*) FROM [Pago]) AS TotalPagos,
    (SELECT COUNT(*) FROM [Comprobante]) AS TotalComprobantes,
    (SELECT COUNT(*) FROM [Usuario]) AS TotalUsuarios,
    (SELECT COUNT(*) FROM [Cancha]) AS TotalCanchas;

-- 2. Evidencia de 12 meses de historia y distribución de estados
SELECT 
    YEAR(FechaInicio) AS Anio,
    MONTH(FechaInicio) AS Mes,
    COUNT(*) AS CantidadReservas,
    SUM(CASE WHEN Estado = 'Completada' THEN 1 ELSE 0 END) AS Completadas,
    SUM(CASE WHEN Estado = 'Confirmada' THEN 1 ELSE 0 END) AS Confirmadas,
    SUM(CASE WHEN Estado = 'Cancelada' THEN 1 ELSE 0 END) AS Canceladas,
    SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) AS Pendientes
FROM [Reserva]
GROUP BY YEAR(FechaInicio), MONTH(FechaInicio)
ORDER BY Anio, Mes;
```
* **Qué capturar:** El resultado que muestra el conteo total $\ge 500$ y la tabla con los 12 meses continuos de historia con sus estados.

> **💡 Nota:** Si aún no has ejecutado el sembrado en tu base de datos local, puedes correr en PowerShell:
> ```powershell
> Invoke-RestMethod -Method Post -Uri "http://localhost:5098/crear-seed-500"
> ```
> O abrir y ejecutar el script [`seed_500_reservas.sql`](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/seed_500_reservas.sql) en SSMS.

### 1.4. Captura: Estrategia de Respaldo y Restauración Probada
* **Consulta a ejecutar en SSMS:**
```sql
-- 1. Respaldo Completo
BACKUP DATABASE [ReservasCanchasDB]
TO DISK = 'C:\Backups\ReservasCanchasDB_Hito2_Full.bak'
WITH FORMAT, MEDIANAME = 'ReservasCanchas_Backup',
     NAME = 'Respaldo Completo Hito 2 - CanchasApi';

-- 2. Prueba de Restauración
RESTORE DATABASE [ReservasCanchasDB_TestRestore]
FROM DISK = 'C:\Backups\ReservasCanchasDB_Hito2_Full.bak'
WITH MOVE 'ReservasCanchasDB' TO 'C:\Backups\ReservasCanchasDB_Test.mdf',
     MOVE 'ReservasCanchasDB_log' TO 'C:\Backups\ReservasCanchasDB_Test_log.ldf',
     REPLACE;

-- 3. Verificación de Integridad Lógica y Física
DBCC CHECKDB ('ReservasCanchasDB_TestRestore') WITH NO_INFOMSGS;
```
* **Qué capturar:** La pestaña de **Mensajes** de SSMS con el mensaje *"Procesadas X páginas..."* y la confirmación final sin errores.

---

## 2. Evidencias de Backend, API y Seguridad (Criterio Web II)

> **Paso previo para pruebas de API:** Inicia la API desde la terminal:
> ```powershell
> cd CanchasApi26-08/CanchasApi
> dotnet run --launch-profile http
> ```
> *(Estará corriendo en `http://localhost:5098`)*.

### 2.1. Captura: Documentación OpenAPI / Scalar Interactiva
* **URL:** Abre en el navegador `http://localhost:5098/scalar/v1`
* **Qué capturar:** La interfaz web de Scalar mostrando las etiquetas de endpoints: `Usuarios`, `Canchas`, `Reservas`, `Pagos`, `Comprobantes`, `Health`.

### 2.2. Captura: Autenticación JWT y Roles (RBAC)
* **Dónde:** Postman / Thunder Client / Scalar.
* **Petición:** `POST http://localhost:5098/api/v1/usuarios/login`
* **Headers:** `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "email": "admin@admin.com",
  "password": "123456"
}
```
* **Qué capturar:** La respuesta con código `200 OK` devolviendo el objeto con `"token": "ey..."` y los datos del usuario con `"rol": "Administrador"`.
* **Captura complementaria:** Pegar el token en [jwt.io](https://jwt.io) mostrando en el Payload los claims decodificados:
  - `nameid`: ID del usuario
  - `role`: `Administrador`
  - `iss`: `CanchasApi`

---

## 3. Evidencias de Validaciones y Flujo con Estados

### 3.1. Captura: Validación de Conflicto Horario (HTTP 409 Conflict)
* **Petición:** `POST http://localhost:5098/api/v1/reservas`
* **Headers:** `Authorization: Bearer <TOKEN_ADMIN_O_CLIENTE>`
* **Body (JSON):** Enviar un rango horario que ya esté ocupado por otra reserva activa en la misma cancha (ej. Cancha 1 de 18:00 a 19:00):
```json
{
  "canchaId": 1,
  "fechaInicio": "2026-11-20T18:00:00Z",
  "fechaFin": "2026-11-20T19:00:00Z"
}
```
*(Al enviar por segunda vez el mismo horario o sobreponerse)*
* **Qué capturar:** Código de respuesta `409 Conflict` con el cuerpo:
```json
{
  "error": "La cancha ya se encuentra reservada en el rango horario solicitado."
}
```

### 3.2. Captura: Validación de Fecha Inválida (HTTP 400 Bad Request)
* **Petición:** `POST http://localhost:5098/api/v1/reservas`
* **Body:** Enviar `fechaInicio` mayor o igual a `fechaFin`:
```json
{
  "canchaId": 1,
  "fechaInicio": "2026-11-20T20:00:00Z",
  "fechaFin": "2026-11-20T19:00:00Z"
}
```
* **Qué capturar:** Respuesta `400 Bad Request`:
```json
{
  "error": "La fecha y hora de inicio debe ser anterior a la de fin."
}
```

### 3.3. Captura: Máquina de Estados Estricta (Bloqueo de Modificación a Terminales)
* **Petición:** `PUT http://localhost:5098/api/v1/reservas/{id_de_reserva_completada}`
* **Headers:** `Authorization: Bearer <TOKEN_ADMIN>`
* **Body:**
```json
{
  "estado": "Pendiente"
}
```
* **Qué capturar:** Código `400 Bad Request` demostrando la regla de negocio:
```json
{
  "error": "No se puede modificar una reserva que ya ha sido completada."
}
```

---

## 4. Evidencias de Defensas OWASP API Top 10

### 4.1. Captura: Mitigación OWASP API1 - BOLA (HTTP 403 Forbidden)
* **Petición:** `GET http://localhost:5098/api/v1/reservas/{id_de_reserva_de_otro_usuario}`
* **Headers:** Iniciar sesión con `cliente@canchas.com` e incluir su token en `Authorization: Bearer <TOKEN_CLIENTE>`.
* **Qué capturar:** El servidor rechaza la solicitud de lectura con código `403 Forbidden`, demostrando que el cliente no puede vulnerar identificadores en URL.

### 4.2. Captura: Mitigación OWASP API4 - Rate Limiting (HTTP 429 Too Many Requests)
* **Acción:** Ejecutar en PowerShell un bucle rápido de 7 peticiones seguidas al endpoint de login:
```powershell
1..7 | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost:5098/api/v1/usuarios/login" -Method Post -ContentType "application/json" -Body '{"email":"test@test.com","password":"123"}' -SkipHttpErrorCheck | Select-Object StatusCode
}
```
* **Qué capturar:** En pantalla se ven códigos `401 Unauthorized` en los primeros intentos y `429 Too Many Requests` a partir del 6to intento consecutivo.

### 4.3. Captura: Cabeceras de Seguridad HTTP (OWASP API5/API8)
* **Petición:** `GET http://localhost:5098/health` (o cualquier endpoint).
* **Qué capturar:** La pestaña de **Headers de Respuesta** mostrando:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 5. Evidencias de Paginación y Rendimiento

### 5.1. Captura: Paginación en Listados con Metadatos
* **Petición:** `GET http://localhost:5098/api/v1/reservas?page=1&pageSize=10`
* **Headers de Respuesta a capturar:**
  - `X-Total-Count`: `500` (o total en BD)
  - `X-Page`: `1`
  - `X-Page-Size`: `10`
  - `X-Total-Pages`: `50`
* **Cuerpo JSON:** Array acotado exactamente a 10 objetos `ReservaResponse`.

---

## 6. Evidencia de Calidad y Compilación Limpia

### 6.1. Captura: Compilación del Proyecto
* **Comando en Terminal:**
```powershell
dotnet build .\CanchasApi26-08\CanchasApi\CanchasApi.csproj
```
* **Qué capturar:** La salida de la terminal indicando:
  - `Compilación correcta.`
  - `0 Advertencia(s)`
  - `0 Errores`

