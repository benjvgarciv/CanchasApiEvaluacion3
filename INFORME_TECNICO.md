# Informe Técnico del Sistema de Gestión de Canchas

**Proyecto:** Plataforma de Gestión y Reservas de Complejos Deportivos  
**Stack Tecnológico:** ASP.NET Core Minimal APIs (.NET 10) + React 19 + TypeScript + Vite  
**Evaluación:** Evaluación 3 — Hito 2: Datos y Backend (Semana 12)  

---

## 1. Justificación de la Arquitectura y Patrones de Diseño

### 1.1. Arquitectura en Capas (Backend .NET 10)
- **Capa de Endpoints (Presentación / Minimal APIs):** Mapeo semántico de rutas bajo `/api/v1/`, validación de contratos mediante DTOs inmutables en C# (records) y respuestas HTTP estándar con códigos de estado normalizados (200, 201, 204, 400, 401, 403, 409, 429).
- **Capa de Servicios de Negocio:** Servicios especializados desacoplados del protocolo HTTP (`AuthService.cs`) encargados de la emisión criptográfica de tokens JWT HMAC-SHA256 y hashing de claves con sales criptográficos (`PasswordHasher<Usuario>`).
- **Capa de Repositorios y Acceso a Datos:** Abstracción mediante `IRepository<T>` y `IUsuarioRepository`, encapsulando las operaciones de persistencia y facilitando la inyección de dobles de prueba o bases de datos en memoria.
- **Capa de Persistencia y Dominio:** Modelado relacional con 12 entidades POCO (`ReservasCanchasDbContext.cs`), configuradas mediante Fluent API con restricciones `CHECK`, índices `UNIQUE` y carga explícita de relaciones (`Include` / `ThenInclude`).

### 1.2. Patrones de Diseño Justificados (ADR)
1. **Patrón Repository (`IRepository<T>`):** Centraliza y abstrae la interacción con Entity Framework Core. Evita la dispersión de consultas SQL o llamadas directas en los endpoints, reduciendo el acoplamiento y posibilitando el reemplazo de la fuente de datos en pruebas automatizadas.
2. **Patrón Data Transfer Object (DTOs Inmutables):** Implementado con records C# (`ReservaCreateRequest`, `ReservaResponse`, `CanchaResponse`, etc.). Protege a la API contra la vulnerabilidad de Mass Assignment (OWASP API3) y previene la exposición de campos sensibles o ciclos de serialización JSON.
3. **Patrón Middleware Pipeline:** Interceptores modulares en `Program.cs` para Rate Limiting con ventana fija, inyección de encabezados de seguridad HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) y autenticación centralizada `JwtBearer`.

---

## 2. Modelo de Datos, Persistencia y Diccionario de Entidades

### 2.1. Entidades del Sistema (Normalización 3FN)
El sistema cuenta con **12 entidades normalizadas en Tercera Forma Normal (3FN)**:
1. `Usuario`: Gestión de perfiles y credenciales de acceso (Cliente, Trabajador, Administrador).
2. `Trabajador`: Cargo, turno y asignación operativa de atención de arriendos.
3. `Sede`: Complejos deportivos con nombre, dirección y contacto.
4. `TipoCancha`: Clasificación por deporte/superficie y precio por hora oficial.
5. `Cancha`: Unidades físicas con número, sede, tipo y estado operativo.
6. `Horario`: Rangos de apertura y cierre por día de la semana (1 a 7).
7. `Reserva`: **Entidad Principal del Dominio**. Registra fecha/hora de arriendo, cliente titular, trabajador supervisor y estado de ciclo de vida.
8. `Pago`: Registro monetario, método de pago y estado de liquidación.
9. `Comprobante`: Documentos fiscales correlativos (Boleta o Factura).
10. `Resena`: Calificaciones de 1 a 5 estrellas y comentarios de jugadores.
11. `Mantenimiento`: Registro de bloqueos preventivos/correctivos por cancha.
12. `Notificacion`: Alertas automáticas para confirmación y recordatorio de reservas.

### 2.2. Restricciones de Integridad en Base de Datos (CHECK Constraints)
- `CK_Usuario_Rol`: `[Rol] IN ('Cliente', 'Trabajador', 'Administrador')`
- `CK_Cancha_Estado`: `[Estado] IN ('Disponible', 'Mantenimiento', 'Fuera de servicio')`
- `CK_Reserva_Fechas`: `[FechaFin] > [FechaInicio]`
- `CK_Reserva_Estado`: `[Estado] IN ('Pendiente', 'Confirmada', 'Cancelada', 'Completada')`
- `CK_Pago_Metodo`: `[MetodoPago] IN ('Efectivo', 'Tarjeta', 'Transferencia')`
- `CK_Pago_Estado`: `[Estado] IN ('Pendiente', 'Pagado', 'Reembolsado')`
- `CK_Comprobante_Tipo`: `[Tipo] IN ('Boleta', 'Factura')`
- `CK_Resena_Calificacion`: `[Calificacion] >= 1 AND [Calificacion] <= 5`
- Claves únicas: `UQ_Usuario_Email`, `UQ_Trabajador_UsuarioId`, `UQ_Comprobante_PagoId`, `UQ_Resena_ReservaId`.

### 2.3. Estrategia de Respaldo y Restauración Probada
- **Respaldo Completo (Backup):** `BACKUP DATABASE [ReservasCanchasDB] TO DISK = 'C:\Backups\ReservasCanchasDB_Hito2_Full.bak' WITH FORMAT;`
- **Restauración de Verificación:** `RESTORE DATABASE [ReservasCanchasDB_TestRestore] FROM DISK = 'C:\Backups\ReservasCanchasDB_Hito2_Full.bak' WITH MOVE ... REPLACE;`
- **Comprobación de Integridad:** `DBCC CHECKDB ('ReservasCanchasDB_TestRestore') WITH NO_INFOMSGS;` (Verificado con 0 errores de consistencia).

---

## 3. Matriz de Riesgos OWASP API Security Mitigados

| Vulnerabilidad OWASP | Riesgo Potencial | Mitigación Implementada | Evidencia en el Código |
| :--- | :--- | :--- | :--- |
| **API1:2023 — BOLA (Broken Object Level Authorization)** | Un usuario `Cliente` podría consultar o cancelar reservas ajenas cambiando el ID en la URL. | El backend verifica que el `UsuarioId` de la reserva coincida con el `NameIdentifier` del token JWT. Si no coincide ni es Administrador/Trabajador, responde `403 Forbidden`. | [ReservaApi.cs](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/CanchasApi26-08/CanchasApi/Endpoints/ReservaApi.cs) |
| **API2:2023 — Broken Authentication** | Suplantación de identidad mediante almacenamiento de contraseñas débiles o reutilización de tokens inválidos. | Las contraseñas se almacenan mediante hash criptográfico usando `PasswordHasher<Usuario>`. Tokens JWT con firma HMAC-SHA256 y expiración estricta (60 min). En logout y 401, el frontend purga credenciales locales. | [AuthService.cs](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/CanchasApi26-08/CanchasApi/Services/AuthService.cs) |
| **API3:2023 — Mass Assignment** | Un atacante podría autoasignarse el rol `Administrador` al registrarse o enviar cargas JSON adulteradas. | En el registro público, el rol asignado por defecto siempre es `Cliente` mediante DTOs tipados. El rol solo puede ser alterado administrativamente. | [UsuarioApi.cs](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/CanchasApi26-08/CanchasApi/Endpoints/UsuarioApi.cs) |
| **API4:2023 — Unrestricted Resource Consumption (Fuerza Bruta)** | Ataques de denegación de servicio o diccionario contra el formulario de inicio de sesión. | Implementación de Rate Limiting con política `AddFixedWindowLimiter` (máximo 5 intentos por minuto por IP/cliente). Respuestas `429 Too Many Requests`. | [Program.cs](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/CanchasApi26-08/CanchasApi/Program.cs) |
| **API5:2023 — Broken Function Level Authorization & Security Misconfiguration** | Clientes invocando endpoints administrativos de eliminación o inyección de scripts en cabeceras HTTP. | Políticas explícitas `.RequireRole("Administrador")` en endpoints destructivos. Headers HTTP de seguridad (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`). | [Program.cs](file:///c:/Users/usuario/Downloads/CanchasApi26-08%20(3)/CanchasApi26-08/CanchasApi26-08/CanchasApi/Program.cs) |

---

## 4. Validación en Tres Niveles y Flujo con Estados

### 4.1. Validación en Tres Niveles
1. **Front End:** Formularios reactivos en React 19 con comprobación inmediata de obligatoriedad, formatos y bloqueo preventivo de envíos dobles.
2. **API RESTful:** Reglas de negocio en C# que validan:
   - `FechaFin > FechaInicio`.
   - Estado de la cancha en "Disponible".
   - Detección de solapamiento horario en la misma cancha física (HTTP 409 Conflict).
   - Bloqueo de auto-asignación de roles privilegiados.
3. **Base de Datos:** Restricciones declarativas `CHECK`, `UNIQUE` y de clave foránea a nivel de motor SQL Server.

### 4.2. Máquina de Estados de la Reserva
- `Pendiente` $\rightarrow$ `Confirmada` o `Cancelada`.
- `Confirmada` $\rightarrow$ `Completada` o `Cancelada`.
- `Completada` $\rightarrow$ **Estado Terminal**. Bloqueo en API ante cualquier intento de alteración posterior.
- `Cancelada` $\rightarrow$ **Estado Terminal**. No admite reactivación ni cambios.

---

## 5. Datos de Prueba Sintéticos (Sembrado de 500 Reservas y 12 Meses)

Para cumplir con el requerimiento de la rúbrica (*"al menos 500 registros en la entidad principal y 12 meses de historia, generados de forma sintética y nunca con datos personales reales"*):
- Se implementó el endpoint idempotente `POST /crear-seed-500` en `Program.cs`.
- Se generó el script SQL transaccional `seed_500_reservas.sql`.
- **Estructura del sembrado:**
  - 500 reservas distribuidas a lo largo de los últimos 365 días móviles.
  - Franjas horarias realistas entre las 09:00 y las 22:00 hrs.
  - Ponderación histórica verosímil: 75% Completadas, 12% Confirmadas, 8% Canceladas, 5% Pendientes.
  - Transacciones financieras asociadas: 100% de arriendos completados/confirmados cuentan con registro de `Pago` y `Comprobante` correlativo (`BOL-YYYY-XXXXXX`).
  - 30% de los arriendos completados incluyen `Resena` con puntuación y comentarios realistas.

---

## 6. Consultas con Filtros y Paginación en Endpoints Masivos

En cumplimiento con el requisito de rendimiento y consultas preparadas:
- `GET /api/v1/reservas` y `GET /api/v1/canchas` aceptan parámetros opcionales `page` y `pageSize`.
- Implementan paginación a nivel de motor de datos mediante `.Skip((page - 1) * pageSize).Take(pageSize)`.
- Exponen encabezados HTTP estándar de paginación:
  - `X-Total-Count`: Conteo total de registros coincidentes.
  - `X-Page`: Página actual solicitada.
  - `X-Page-Size`: Cantidad de registros por página.
  - `X-Total-Pages`: Total de páginas calculadas.
- Mantienen 100% de compatibilidad hacia atrás con el frontend SPA cuando no se especifican los parámetros de paginación.

---

## 7. Ficha de Accesibilidad y Usabilidad Frontend (WCAG 2.2 AA)

- **Target Size (WCAG 2.5.8):** Controles interactivos con dimensión mínima de 44x44 px (`min-height: 44px` en CSS).
- **Contraste de Color (WCAG 1.4.3):** Ratio superior a 4.5:1 en textos principales y 3:1 en componentes y alertas.
- **Semántica ARIA:** Roles `dialog`, `alert`, `status` y atributos `aria-live="polite"` para lectores de pantalla.
- **Diseño Responsive:** Adaptabilidad completa de 320 px a 1440 px sin scroll horizontal y navegación colapsable.
