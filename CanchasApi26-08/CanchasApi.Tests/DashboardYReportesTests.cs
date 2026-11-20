using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace CanchasApi.Tests;

public class DashboardYReportesTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DashboardYReportesTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DashboardMetricas_Retorna200YFormatoCompleto()
    {
        var response = await _client.GetAsync("/api/v1/dashboard/metricas");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("kpis", content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("visualizaciones", content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("distribucionEstados", content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ingresosMensuales", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReporteOperativo_Retorna200YPaginacionValida()
    {
        var response = await _client.GetAsync("/api/v1/reportes/operativo?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("items", content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("totalPages", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExportarLog_Retorna200YRegistraAuditoria()
    {
        var payload = new
        {
            TipoReporte = "Operativo Reservas",
            Formato = "Excel",
            UsuarioSolicitante = "admin@admin.com"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/reportes/exportar-log", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("auditada", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task IaAnalisisResenas_Retorna200YDiagnostico()
    {
        var payload = new
        {
            Resenas = new List<string> { "Muy buen servicio y canchas impecables.", "Buena atencion en porteria." }
        };

        var response = await _client.PostAsJsonAsync("/api/v1/ia/analisis-resenas", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("sentimientoPredominante", content, StringComparison.OrdinalIgnoreCase);
    }
}
