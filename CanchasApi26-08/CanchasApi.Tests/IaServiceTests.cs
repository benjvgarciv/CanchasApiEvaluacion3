using CanchasApi.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CanchasApi.Tests;

public class IaServiceTests
{
    [Fact]
    public async Task AnalizarResenas_ListaVacia_LanzaArgumentException()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new IaService(new HttpClient(), config, NullLogger<IaService>.Instance);

        await Assert.ThrowsAsync<ArgumentException>(() => service.AnalizarResenasAsync(new List<string>()));
    }

    [Fact]
    public async Task AnalizarResenas_ConComentariosPositivos_RetornaSentimientoFavorable()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new IaService(new HttpClient(), config, NullLogger<IaService>.Instance);

        var resenas = new List<string>
        {
            "Excelente cancha sintética, iluminacion perfecta y muy buen ambiente.",
            "Todo impecable, limpio y puntual.",
            "Genial atención de los administradores."
        };

        var resultado = await service.AnalizarResenasAsync(resenas);

        Assert.NotNull(resultado);
        Assert.Equal("Altamente Positivo", resultado.SentimientoPredominante);
        Assert.True(resultado.PuntuacionSentimiento >= 4.0);
        Assert.NotEmpty(resultado.AspectosPositivos);
        Assert.NotEmpty(resultado.OportunidadesMejora);
    }

    [Fact]
    public async Task AsistirReserva_ConsultaVacia_LanzaArgumentException()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new IaService(new HttpClient(), config, NullLogger<IaService>.Instance);

        await Assert.ThrowsAsync<ArgumentException>(() => service.AsistirReservaAsync(""));
    }

    [Fact]
    public async Task AsistirReserva_ConsultaTenis_DetectaDeporteCorrecto()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new IaService(new HttpClient(), config, NullLogger<IaService>.Instance);

        var respuesta = await service.AsistirReservaAsync("Quiero jugar tenis en cancha de arcilla");

        Assert.NotNull(respuesta);
        Assert.Equal("Tenis", respuesta.DeporteDetectado);
        Assert.Contains("Tenis", respuesta.Sugerencia);
    }

    [Fact]
    public async Task GenerarResumenEjecutivo_CalculaDiagnosticoCorrectamente()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new IaService(new HttpClient(), config, NullLogger<IaService>.Instance);

        var resumen = await service.GenerarResumenEjecutivoAsync("Noviembre 2026", 1500000m, 60, 5.0);

        Assert.NotNull(resumen);
        Assert.Equal("Sobresaliente", resumen.NivelRendimiento);
        Assert.Contains("Noviembre 2026", resumen.Diagnostico);
        Assert.NotEmpty(resumen.RecomendacionesEstrategicas);
    }
}
