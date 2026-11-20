using CanchasApi.Models;
using CanchasApi.Services;
using Microsoft.EntityFrameworkCore;

namespace CanchasApi.Endpoints;

public static class IaApi
{
    public static void MapIaApi(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/ia")
                       .WithTags("Inteligencia Artificial")
                       .RequireRateLimiting("login-policy"); // Protección contra consumo desmedido (OWASP API4)

        // 1. Análisis de Sentimiento y Reseñas
        group.MapPost("/analisis-resenas", async (IaAnalisisRequest? request, ReservasCanchasDbContext db, IIaService iaService, CancellationToken ct) =>
        {
            List<string> resenas;
            if (request?.Resenas != null && request.Resenas.Count > 0)
            {
                resenas = request.Resenas;
            }
            else
            {
                // Si no se envían reseñas en el cuerpo, obtener las reseñas reales almacenadas en la base de datos
                resenas = await db.Resenas
                    .Where(r => !string.IsNullOrWhiteSpace(r.Comentario))
                    .OrderByDescending(r => r.Id)
                    .Take(30)
                    .Select(r => r.Comentario!)
                    .ToListAsync(ct);

                if (resenas.Count == 0)
                {
                    resenas = new List<string>
                    {
                        "Excelente cancha, pasto en muy buenas condiciones.",
                        "Todo impecable, pero faltó algo de iluminación en la noche.",
                        "Muy buena atención del personal en la entrada.",
                        "Fácil de reservar pero el estacionamiento estaba lleno."
                    };
                }
            }

            try
            {
                var resultado = await iaService.AnalizarResenasAsync(resenas, ct);
                return Results.Ok(resultado);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem(detail: ex.Message, title: "Error en el servicio de Inteligencia Artificial", statusCode: 500);
            }
        }).WithSummary("Analiza opiniones y reseñas de usuarios utilizando IA externa con fallback heurístico.");

        // 2. Asistente Inteligente de Reservas
        group.MapPost("/asistente-reserva", async (IaConsultaRequest request, IIaService iaService, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request?.Consulta))
            {
                return Results.BadRequest(new { error = "El campo 'consulta' es obligatorio." });
            }

            try
            {
                var respuesta = await iaService.AsistirReservaAsync(request.Consulta, ct);
                return Results.Ok(respuesta);
            }
            catch (Exception ex)
            {
                return Results.Problem(detail: ex.Message, title: "Error al procesar consulta de IA", statusCode: 500);
            }
        }).WithSummary("Asistente conversacional para orientar a los clientes en la selección de horarios y deportes.");

        // 3. Resumen Ejecutivo con Métricas del Sistema
        group.MapPost("/resumen-ejecutivo", async (ReservasCanchasDbContext db, IIaService iaService, CancellationToken ct) =>
        {
            var totalReservas = await db.Reservas.CountAsync(ct);
            var reservasCanceladas = await db.Reservas.CountAsync(r => r.Estado == "Cancelada", ct);
            var tasaCancelacion = totalReservas > 0 ? ((double)reservasCanceladas / totalReservas) * 100 : 0;

            var totalIngresos = await db.Pagos
                .Where(p => p.Estado == "Pagado")
                .SumAsync(p => (decimal?)p.Monto, ct) ?? 0;

            var resultado = await iaService.GenerarResumenEjecutivoAsync("Últimos 12 meses móviles", totalIngresos, totalReservas, tasaCancelacion, ct);
            return Results.Ok(resultado);
        }).WithSummary("Genera un diagnóstico estratégico automatizado mediante IA a partir de los datos reales del negocio.");
    }
}

public record IaAnalisisRequest(List<string>? Resenas);
public record IaConsultaRequest(string Consulta);
