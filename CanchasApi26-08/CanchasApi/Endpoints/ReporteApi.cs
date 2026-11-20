using CanchasApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CanchasApi.Endpoints;

public static class ReporteApi
{
    public static void MapReporteApi(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/reportes")
                       .WithTags("Reportes y Exportación");

        // 1. Reporte Operativo Detallado (Paginado y Filtrable)
        group.MapGet("/operativo", async (
            ReservasCanchasDbContext db,
            DateTime? fechaInicio,
            DateTime? fechaFin,
            string? estado,
            int? sedeId,
            int page = 1,
            int pageSize = 50,
            CancellationToken ct = default) =>
        {
            var query = db.Reservas
                .Include(r => r.Usuario)
                .Include(r => r.Cancha).ThenInclude(c => c.Sede)
                .Include(r => r.Cancha).ThenInclude(c => c.TipoCancha)
                .Include(r => r.Pagos)
                .AsQueryable();

            if (fechaInicio.HasValue)
                query = query.Where(r => r.FechaInicio >= fechaInicio.Value);

            if (fechaFin.HasValue)
                query = query.Where(r => r.FechaFin <= fechaFin.Value);

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(r => r.Estado == estado);

            if (sedeId.HasValue)
                query = query.Where(r => r.Cancha.SedeId == sedeId.Value);

            var totalCount = await query.CountAsync(ct);

            var data = await query
                .OrderByDescending(r => r.FechaInicio)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    Cliente = r.Usuario.Nombre,
                    ClienteEmail = r.Usuario.Email,
                    Cancha = $"Cancha {r.Cancha.Numero} - {r.Cancha.TipoCancha.Nombre}",
                    Sede = r.Cancha.Sede.Nombre,
                    r.FechaInicio,
                    r.FechaFin,
                    r.Estado,
                    MontoTotal = r.Pagos.Sum(p => (decimal?)p.Monto) ?? r.Cancha.TipoCancha.PrecioPorHora,
                    MetodoPago = r.Pagos.Select(p => p.MetodoPago).FirstOrDefault() ?? "Pendiente"
                })
                .ToListAsync(ct);

            return Results.Ok(new
            {
                Total = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = data
            });
        }).WithSummary("Reporte operativo detallado de arriendos con filtros por fecha, estado y sede.");

        // 2. Reporte Gerencial Consolidado
        group.MapGet("/gerencial", async (ReservasCanchasDbContext db, CancellationToken ct) =>
        {
            var consolidadoPorSede = await db.Reservas
                .Include(r => r.Cancha).ThenInclude(c => c.Sede)
                .Include(r => r.Pagos)
                .GroupBy(r => r.Cancha.Sede.Nombre)
                .Select(g => new
                {
                    Sede = g.Key,
                    TotalReservas = g.Count(),
                    Completadas = g.Count(r => r.Estado == "Completada"),
                    Canceladas = g.Count(r => r.Estado == "Cancelada"),
                    IngresosTotales = g.SelectMany(r => r.Pagos).Where(p => p.Estado == "Pagado").Sum(p => (decimal?)p.Monto) ?? 0
                })
                .ToListAsync(ct);

            var granTotalReservas = consolidadoPorSede.Sum(s => s.TotalReservas);
            var granTotalIngresos = consolidadoPorSede.Sum(s => s.IngresosTotales);

            return Results.Ok(new
            {
                Titulo = "Informe Gerencial de Rendimiento Operativo y Financiero",
                FechaEmision = DateTime.UtcNow,
                Sedes = consolidadoPorSede,
                TotalesGenerales = new
                {
                    TotalReservas = granTotalReservas,
                    TotalIngresos = granTotalIngresos,
                    TicketPromedio = granTotalReservas > 0 ? granTotalIngresos / granTotalReservas : 0
                }
            });
        }).WithSummary("Reporte gerencial consolidado con totales, subtotales y métricas de desempeño.");

        // 3. Auditoría de Exportación (Registra quién exportó el reporte)
        group.MapPost("/exportar-log", (ExportLogRequest request, HttpContext httpContext, ILogger<WebApplication> logger) =>
        {
            var userEmail = httpContext.User.FindFirst(ClaimTypes.Email)?.Value ?? request.UsuarioSolicitante ?? "admin@admin.com";
            logger.LogInformation("Auditoría de Exportación: Usuario {Email} exportó el reporte '{TipoReporte}' en formato '{Formato}' a las {Fecha}",
                userEmail, request.TipoReporte, request.Formato, DateTime.UtcNow);

            return Results.Ok(new
            {
                Mensaje = "Exportación auditada y registrada exitosamente",
                Usuario = userEmail,
                Formato = request.Formato,
                Timestamp = DateTime.UtcNow
            });
        }).WithSummary("Registra la trazabilidad y auditoría de descargas de reportes para cumplimiento normativo.");
    }
}

public record ExportLogRequest(string TipoReporte, string Formato, string? UsuarioSolicitante);
