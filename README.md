# Sistema de Gestión y Reserva de Canchas Deportivas (CanchasApi)

[![CI/CD Pipeline](https://github.com/usuario/CanchasApiEvaluacion3/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/usuario/CanchasApiEvaluacion3/actions/workflows/ci-cd.yml)
[![.NET Version](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![React Version](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20Compliant-green.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **Evaluación 3:** Proyecto Integrador de Sistema Web, Análisis de Datos y Plan de Despliegue  
> **Asignatura:** Lenguaje de Programación Web II  
> **Integrantes del Equipo:**
> - Rodrigo Tapia
> - Gustavo Jaramillo
> - Benjamin Garcia

---

## 📌 Descripción del Proyecto
Plataforma web integral para la administración, arriendo por bloques horarios y control operativo de complejos deportivos. Resuelve de forma automatizada la duplicidad de horarios, pérdidas por clientes que no asisten (no-show), descuadres de caja y demoras en atención.

Articula completamente las 4 asignaturas del módulo:
1. **Diseño de Software Orientado a Objetos II:** Arquitectura en capas, inyección de dependencias, principios SOLID, patrón Repository y DTOs inmutables.
2. **Modelado y Consulta de Bases de Datos:** Modelo relacional normalizado en 3FN (12 tablas), restricciones CHECK en BD, migraciones versionadas con EF Core y respaldos probados.
3. **Inteligencia de Negocios I y II:** 6 KPIs formulados con justificación comercial, Dashboard de 4 visualizaciones interactivas y reportes exportables a Excel, PDF, CSV e impresión limpia.
4. **Programación Web II:** Backend Minimal APIs (.NET 10), JWT con 3 roles, mitigación de 5 riesgos OWASP API Top 10, Frontend accesible (WCAG 2.2 AA) y responsive en React 19 + TypeScript, integración de servicio de IA externa, contenerización Docker multi-stage y pipeline CI/CD.

---

## 🚀 Despliegue Rápido con Docker Compose (Un Solo Comando)

El sistema completo (Base de datos SQL Server, Backend API .NET 10 y Frontend React Nginx) se ejecuta automáticamente:

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/CanchasApiEvaluacion3.git
cd CanchasApiEvaluacion3
```

### 2. Configurar variables de entorno
Copie el archivo de ejemplo y ajuste las contraseñas si lo desea:
```bash
cp .env.example .env
```

### 3. Levantar los contenedores
```bash
docker compose up -d --build
```

El comando compilará las imágenes en etapas múltiples (*multi-stage*), creará los volúmenes, aplicará migraciones y levantará:
- **Frontend Web:** [http://localhost](http://localhost) (Puerto 80)
- **Backend REST API:** [http://localhost:8080](http://localhost:8080)
- **Documentación Swagger / OpenAPI:** [http://localhost:8080/openapi/v1.json](http://localhost:8080/openapi/v1.json) o interfaz Scalar
- **Healthcheck:** [http://localhost:8080/health](http://localhost:8080/health)
- **SQL Server 2022:** `localhost:1433`

---

## 👥 Cuentas de Prueba Preconfiguradas (Por Rol)

El sistema incluye datos sintéticos de prueba (500 reservas a lo largo de 12 meses):

| Rol | Correo Electrónico | Contraseña | Alcance de Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@canchas.com` | `Admin123!` | Control total, catálogo de sedes/canchas, Dashboard BI, IA y reportes. |
| **Trabajador** | `trabajador@canchas.com` | `Trabajador123!` | Agenda global de reservas, recepción de partidos, asignación de atención. |
| **Cliente** | `cliente@canchas.com` | `Cliente123!` | Exploración de canchas, arriendo por bloques y mis reservas personales. |

---

## 🧪 Ejecución de Pruebas Automatizadas

Para validar las pruebas de integración en el entorno de desarrollo:
```bash
dotnet test CanchasApi26-08/CanchasApi.slnx
```

---

## 📚 Documentación Técnica Entregable

Todos los entregables exigidos por la rúbrica de evaluación se encuentran en la raíz del repositorio:
1. **[INFORME_TECNICO_INTEGRADOR_HITOS_1_AL_4.md](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/INFORME_TECNICO_INTEGRADOR_HITOS_1_AL_4.md):** Documento técnico exhaustivo que detalla la totalidad de los Hitos 1, 2, 3 y 4, arquitectura, base de datos, seguridad OWASP, KPIs, accesibilidad y articulación del módulo.
2. **[MANUAL_DE_USUARIO.md](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/MANUAL_DE_USUARIO.md):** Guía paso a paso ilustrada para el uso del sistema por cada uno de los tres roles.
3. **[deploy/PLAN_DE_DESPLIEGUE.md](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/deploy/PLAN_DE_DESPLIEGUE.md):** Plan de despliegue en producción con los 10 apartados obligatorios (entornos, infraestructura, rollback, DRP, monitoreo, costos y riesgos).
4. **[compose.yaml](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/compose.yaml) y [.env.example](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/.env.example):** Orquestación contenerizada y plantilla de configuración segura.
5. **[.github/workflows/ci-cd.yml](file:///c:/Users/Alumnos/Documents/CanchasApiEvaluacion3/.github/workflows/ci-cd.yml):** Pipeline de Integración y Entrega Continua automatizado.
