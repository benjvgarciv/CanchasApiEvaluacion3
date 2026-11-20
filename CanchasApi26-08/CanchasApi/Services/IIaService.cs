namespace CanchasApi.Services;

public interface IIaService
{
    Task<IaAnalisisResponse> AnalizarResenasAsync(List<string> resenas, CancellationToken cancellationToken = default);
    Task<IaAsistenteResponse> AsistirReservaAsync(string consultaUsuario, CancellationToken cancellationToken = default);
    Task<IaResumenEjecutivoResponse> GenerarResumenEjecutivoAsync(string periodo, decimal totalIngresos, int totalReservas, double tasaCancelacion, CancellationToken cancellationToken = default);
}

public record IaAnalisisResponse(
    string SentimientoPredominante,
    double PuntuacionSentimiento,
    List<string> AspectosPositivos,
    List<string> OportunidadesMejora,
    string ResumenEjecutivo,
    string Proveedor
);

public record IaAsistenteResponse(
    string Sugerencia,
    string DeporteDetectado,
    string? HorarioRecomendado,
    List<string> Consejos
);

public record IaResumenEjecutivoResponse(
    string Periodo,
    string Diagnostico,
    List<string> RecomendacionesEstrategicas,
    string NivelRendimiento
);
