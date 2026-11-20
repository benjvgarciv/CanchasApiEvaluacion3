# Plataforma Integral de Gestión y Reservas de Complejos Deportivos (CanchasApi)

Sistema web completo de nivel de producción que integra front-end responsive y accesible, backend y API RESTful segura, base de datos relacional normalizada con migraciones, dashboard de análisis de datos e indicadores (Business Intelligence), centro de reportes exportables a Excel, PDF, CSV e impresión, integración con servicios de Inteligencia Artificial externa (OpenAI y Google Gemini), contenerización con Docker Compose y pipeline de Integración Continua (CI/CD).

**Asignatura:** Lenguaje de Programación Web II  
**Evaluación:** Evaluación 3 — Proyecto Integrador de Sistema Web, Análisis de Datos y Plan de Despliegue (40% de la nota final)  
**Integrantes:**
* Rodrigo Tapia
* Gustavo Jaramillo
* Benjamin Garcia

---

## ⚡ Inicio Rápido en un Solo Paso (Docker Compose)

El sistema completo se ejecuta con **un único comando estándar**, levantando la base de datos SQL Server, la API en .NET 10 y el Front-End en Nginx:

```bash
# 1. Configurar variables de entorno iniciales
cp .env.example .env

# 2. Levantar la infraestructura completa en contenedores
docker compose up --build -d
```

Una vez que los contenedores estén saludables:
* **Frontend Web SPA:** Abre [http://localhost](http://localhost) (o el puerto configurado en `.env`).
* **Backend API & Documentación:** Abre [http://localhost:5098/scalar/v1](http://localhost:5098/scalar/v1).
* **Verificación de Salud:** [http://localhost:5098/health](http://localhost:5098/health).

---

## 🚀 Arquitectura y Puertos del Sistema

| Servicio / Contenedor | Tecnología | Puerto Host | Descripción y Enlace |
| :--- | :--- | :---: | :--- |
| **canchas-frontend** | React 19, TypeScript, Nginx Alpine | `80` / `5173` | [Portal Web](http://localhost) (Acceso general, clientes y administración) |
| **canchas-backend** | ASP.NET Core 10 Minimal APIs, EF Core | `5098` / `8080` | [Scalar API Reference](http://localhost:5098/scalar/v1) \| Contrato: `openapi.json` |
| **canchas-sqlserver** | Microsoft SQL Server 2022 | `1433` | Motor de base de datos relacional con 12 entidades en 3FN |

---

## 👥 Cuentas de Acceso Preconfiguradas (Roles del Sistema)

Para evaluar la diferenciación de vistas, autorización y permisos por rol, puedes utilizar las siguientes credenciales:

| Rol | Correo Electrónico | Contraseña | Vistas y Permisos en el Sistema |
| :--- | :--- | :---: | :--- |
| **Cliente** | `cliente@canchas.com` | `123456` | • Menú exclusivo: *Inicio*, *Explorar Canchas*, *Mis Reservas*.<br>• Reserva canchas en tiempo real con cálculo de tarifas por hora.<br>• Vistas operativas y reportes administrativos ocultos. |
| **Trabajador** | `trabajador@canchas.com` | `123456` | • Supervisión de agenda consolidada de arriendos.<br>• Confirmación de reservas y asignación de turno (`UserCheck`).<br>• Gestión y bloqueo por mantenimiento de canchas y sedes.<br>• Acceso a *Reportes y Exportación*. |
| **Administrador** | `admin@admin.com` | `123456` | • **Control total del sistema**.<br>• Acceso a *Dashboard BI* con 6 KPIs y 4 visualizaciones interactivas.<br>• Ejecución del diagnóstico predictivo asistido por IA.<br>• Exportación y auditoría de reportes gerenciales. |

> **💡 Nota:** Si ejecutas la API localmente sin Docker, puedes inicializar usuarios y las 500 reservas con:
> ```powershell
> Invoke-RestMethod -Method Post -Uri "http://localhost:5098/crear-usuarios-test"
> Invoke-RestMethod -Method Post -Uri "http://localhost:5098/crear-seed-500"
> ```

---

## 🛠️ Ejecución Local en Modo Desarrollo (Sin Docker)

### 1. Backend (.NET 10)
```bash
cd CanchasApi26-08/CanchasApi
dotnet run --launch-profile http
```

### 2. Frontend (React 19 + TypeScript + Vite)
```bash
cd CanchasApi26-08/frontend
npm install
npm run dev
```

---

## 🧪 Pruebas Automatizadas (100% Aprobadas)

El proyecto incluye suites completas de pruebas unitarias, de integración y extremo a extremo (E2E):

```bash
# 1. Pruebas Backend (.NET 10 - XUnit + WebApplicationFactory) -> 16 pruebas superadas
dotnet test CanchasApi26-08/CanchasApi.slnx

# 2. Pruebas Frontend (Vitest + Testing Library + User Event) -> 9 pruebas superadas
cd CanchasApi26-08/frontend
npm test

# 3. Linter y Compilación de Producción
npm run lint
npm run build
```

---

## 🤖 Declaración de Uso de Herramientas de IA
En cumplimiento estricto con las condiciones de la rúbrica (*"Se permite el uso de herramientas de IA como apoyo, pero debe declararse en el README: herramienta y propósito"*):

* **Herramientas de IA Utilizadas:** GitHub Copilot y Claude/Gemini AI Assistant.
* **Propósito y Alcance:**
  1. Asistencia en la generación sintética de los 500 registros con 12 meses continuos de historial (`seed_500_reservas.sql`).
  2. Apoyo en la formulación de consultas de agregación temporal para el Dashboard de Business Intelligence.
  3. Sugerencia de diseño semántico para la hoja de estilos de impresión `@media print`.
  4. La arquitectura, reglas de negocio, lógica criptográfica JWT, validaciones de tres niveles y código de producción fueron implementados, verificados y testeados directamente por el equipo.

---

## 📚 Documentación Técnica Entregable

* [INFORME_TECNICO.md](file:///c:/Users/usuario/Desktop/CanchasApiEvaluacion3/INFORME_TECNICO.md): Informe técnico de 11 apartados con arquitectura, modelo de datos, WCAG 2.2 AA, KPIs de BI, IA y articulación del módulo.
* [PLAN_DE_DESPLIEGUE.md](file:///c:/Users/usuario/Desktop/CanchasApiEvaluacion3/PLAN_DE_DESPLIEGUE.md): Plan de despliegue en producción con los 10 apartados obligatorios (Entornos, infra, RTO/RPO, rollback, riesgos).
* [MANUAL_DE_USUARIO.md](file:///c:/Users/usuario/Desktop/CanchasApiEvaluacion3/MANUAL_DE_USUARIO.md): Manual operativo paso a paso por roles (Cliente, Trabajador, Administrador) y guía de navegación accesible.
* [openapi.json](file:///c:/Users/usuario/Desktop/CanchasApiEvaluacion3/openapi.json): Contrato OpenAPI 3.0 exportado con todos los endpoints y esquemas de seguridad.
