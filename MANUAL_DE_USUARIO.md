# Manual de Usuario por Rol
**Plataforma de Gestión y Reservas de Complejos Deportivos (CanchasApi)**  
**Versión:** 1.0.0 — Documento de Operación y Manual de Usuario

---

## 📋 Introducción
El sistema CanchasApi permite administrar el arriendo y catálogo de canchas deportivas para tres perfiles de usuario diferenciados: **Cliente**, **Trabajador** y **Administrador**.

---

## 👤 1. Manual para el Rol: CLIENTE

### 1.1. Inicio de Sesión y Acceso
1. Ingresa a la plataforma web (`http://localhost:5173` o `http://localhost`).
2. En la pantalla de bienvenida, ingresa tus credenciales:
   * **Correo:** `cliente@canchas.com`
   * **Contraseña:** `123456`
3. Haz clic en **Entrar al Portal**. Accederás al panel personalizado del jugador.

### 1.2. Explorar Canchas y Horarios
1. En el menú lateral izquierdo, haz clic en **Explorar Canchas**.
2. Puedes filtrar por:
   * **Sede:** (Ej: Sede Central, Sede Oriente).
   * **Tipo de Cancha:** (Fútbol 7, Tenis, Pádel, Básquetbol).
3. Cada tarjeta muestra la tarifa por hora oficial y el estado operativo ("Disponible").

### 1.3. Realizar una Reserva
1. En la cancha deseada, haz clic en el botón **Agendar Reserva**.
2. En el formulario modal:
   * Selecciona la **Fecha y Hora de Inicio**.
   * Selecciona la **Fecha y Hora de Fin** (debe ser posterior al inicio).
   * El sistema calcula automáticamente el total a pagar según la tarifa.
3. Haz clic en **Confirmar y Reservar**.
4. El sistema valida inmediatamente que no exista solapamiento con otro arriendo. Recibirás una notificación en verde de reserva agendada.

### 1.4. Revisar Mis Reservas
1. Haz clic en la opción **Mis Reservas** en el menú.
2. Verás únicamente tus arriendos personales, con su estado dinámico en tiempo real (*Pendiente*, *Confirmada*, *En Juego*, *Finalizada* o *Cancelada*).

---

## 👷 2. Manual para el Rol: TRABAJADOR

### 2.1. Agenda Global de Reservas
1. Inicia sesión con: `trabajador@canchas.com` / `123456`.
2. Dirígete a **Reservas**.
3. A diferencia del cliente, verás la **agenda consolidada** de todos los jugadores del complejo.
4. En las reservas en estado *Pendiente*, pulsa el botón **Confirmar / Asignarme** (`UserCheck`). Tu ID de trabajador quedará asociado a la supervisión operativa del arriendo.

### 2.2. Gestión de Canchas y Mantenimiento
1. En **Canchas**, el trabajador puede:
   * Cambiar el estado de una cancha a **Mantenimiento** o **Fuera de servicio** si el césped o las redes requieren reparación.
   * Modificar el número de cancha o asignarle un tipo de deporte diferente.
   * Registrar nuevas canchas mediante el botón **+ Nueva Cancha**.

### 2.3. Emisión y Descarga de Reportes
1. Haz clic en la pestaña **Reportes**.
2. Selecciona entre:
   * **Reporte Operativo:** Filtra por fechas y estados para revisar los ingresos de la jornada.
   * **Reporte Parametrizable:** Exporta a **Excel (.xlsx)**, **PDF** o **CSV** para liquidación de caja.
   * Pulsa **Imprimir** para obtener la planilla física de la jornada en recepción.

---

## 👑 3. Manual para el Rol: ADMINISTRADOR

### 3.1. Control Total del Sistema
1. Inicia sesión con: `admin@admin.com` / `123456`.
2. El administrador cuenta con todos los privilegios del sistema, incluyendo borrado y configuración global.

### 3.2. Configuración de Sedes y Tipos de Cancha
1. **Sedes Deportivas:** Crear nuevos recintos, modificar direcciones y teléfonos de contacto.
2. **Tipos de Cancha y Tarifas:** Modificar el precio oficial por hora de cada deporte (Fútbol, Pádel, Tenis). Las nuevas reservas calcularán los cobros en base a esta tarifa.

### 3.3. Dashboard de Business Intelligence (BI)
1. En el menú, haz clic en **Dashboard BI**.
2. Revisa los **6 Indicadores Clave de Negocio (KPIs)** calculados en tiempo real:
   * Tasa de Ocupación Global.
   * Facturación Acumulada y Ticket Promedio.
   * Tasa de Cancelación.
   * Deporte con Mayor Demanda y Horarios Pico.
3. Examina las **4 Visualizaciones Gráficas**:
   * Gráfico de facturación mensual (12 meses móviles).
   * Barras de distribución porcentual por deporte.
   * Métricas de estados de reservas.
   * Actividad e ingresos comparativos por sede.
4. Para accesibilidad, pulsa **Ver Tabla (A11y)** en cualquier gráfico para inspeccionar los datos tabulares.

### 3.4. Diagnóstico Estratégico con Inteligencia Artificial
1. En el panel inferior del Dashboard BI, haz clic en **Ejecutar Diagnóstico IA**.
2. El sistema analizará las reseñas y opiniones de los jugadores y generará:
   * Sentimiento predominante y calificación media.
   * Resumen ejecutivo de satisfacción del cliente.
   * Listado de aspectos positivos destacados.
   * Oportunidades prioritarias de mejora operativa.

---

## ⌨️ 4. Guía de Accesibilidad (Navegación por Teclado)
* **Tabulador (`Tab`):** Avanza entre enlaces, botones y campos de formulario.
* **`Shift + Tab`:** Retrocede al control interactivo anterior.
* **`Enter` o `Espacio`:** Activa botones, despliega menús o confirma envíos.
* **`Escape` (`Esc`):** Cierra cualquier ventana modal o menú emergente.
* **Saltar al contenido principal:** Presiona `Tab` inmediatamente al cargar la página para enfocar el enlace accesible superior.
