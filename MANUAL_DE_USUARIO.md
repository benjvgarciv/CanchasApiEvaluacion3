# Manual de Usuario del Sistema de Gestión de Canchas

**Proyecto:** Plataforma de Gestión y Reserva de Canchas Deportivas  
**Versión:** 1.0.0 (Evaluación 3 Integrador)  

---

## 1. Perfil: Cliente (Jugador)
El perfil **Cliente** está diseñado para deportistas que buscan consultar disponibilidad de canchas y agendar sus partidos rápidamente.

### Pasos para Usar el Sistema:
1. **Inicio de Sesión y Registro:**
   - Ingrese a la plataforma e inicie sesión con su correo y contraseña.
   - Si no posee cuenta, complete el formulario de registro (recibirá automáticamente el rol `Cliente`).
2. **Exploración de Canchas:**
   - En la pestaña **Inicio** o **Canchas**, filtre por sede deportiva o tipo de deporte (Fútbol 5, Fútbol 7, Pádel).
   - Revise las tarifas por hora de cada cancha.
3. **Agendar Reserva:**
   - Seleccione el botón verde **Reservar**.
   - Escoja la fecha del partido, duración del bloque (1, 2 o 3 horas) y la hora de inicio (entre 08:00 y 23:00 hrs).
   - El sistema calculará automáticamente la hora de fin y el total a pagar.
   - Presione **Confirmar Reserva**. Si el horario ya estuviese ocupado, el sistema le avisará inmediatamente para elegir otro bloque.
4. **Mis Reservas:**
   - En la sección **Reservas**, el cliente puede revisar el historial de sus solicitudes, consultar el estado actual (*Pendiente*, *Confirmada*, *Completada*) y cancelar reservas pendientes si no podrá asistir.

---

## 2. Perfil: Trabajador (Personal de Terreno)
El perfil **Trabajador** está diseñado para los recepcionistas y coordinadores de turno en las instalaciones deportivas.

### Pasos para Usar el Sistema:
1. **Supervisión de Agenda Global:**
   - Al iniciar sesión con credenciales de Trabajador, diríjase a la sección **Reservas**.
   - Podrá ver la lista de todos los arriendos agendados en el día por cualquier cliente.
2. **Asignación de Atención y Aprobación:**
   - Para tomar la recepción de un grupo que llega a jugar, haga clic en el botón **Asignarme**. Su nombre quedará registrado como el supervisor del arriendo.
   - Cambie el estado de la reserva de *Pendiente* a *Confirmada* o *Completada* según el avance del partido.
3. **Control Operativo de Canchas:**
   - En la pestaña **Canchas**, puede cambiar el estado de un campo a *Mantenimiento* si requiere reparaciones urgentes o mantención de césped sintético.
   - El trabajador tiene restringida la eliminación definitiva de reservas o la creación de usuarios.

---

## 3. Perfil: Administrador (Gerente de Complejo)
El perfil **Administrador** posee el control y gobierno completo de la plataforma.

### Pasos para Usar el Sistema:
1. **Gestión de Infraestructura (Sedes y Canchas):**
   - Agregue nuevas sedes con su dirección y contacto telefónico.
   - Cree y configure canchas asignando la sede respectiva, tipo de deporte y tarifa oficial por hora.
   - Modifique o elimine canchas según la disponibilidad de espacio.
2. **Dashboard de Análisis de Negocio:**
   - En la sección principal, revise los 6 indicadores clave en tiempo real (Tasa de ocupación, Ingresos totales por sede, Franja horaria más demandada, Ticket promedio, Tasa de cancelación y Deporte preferido).
   - Analice los gráficos de distribución y barras comparativas.
3. **Diagnóstico con Asistente de IA:**
   - Presione el botón **Generar Resumen con IA** en el dashboard. El sistema consultará el motor de IA analizando los datos históricos de los últimos 12 meses y desplegará un diagnóstico ejecutivo con recomendaciones para maximizar ingresos.
4. **Reportes Financieros y Exportación:**
   - Ingrese al módulo de **Reportes**.
   - Seleccione el tipo de reporte: *Operativo de Canchas*, *Gerencial Financiero* o *Historial por Rango de Fechas*.
   - Exporte los datos aplicando filtros a **Excel (.xlsx)**, **PDF** o **CSV**.
   - Active la **Vista de Impresión Limpia** (`Ctrl + P`) para imprimir el informe sin barras laterales ni botones.
