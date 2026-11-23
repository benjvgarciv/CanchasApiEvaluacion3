using CanchasApi.Endpoints;
using CanchasApi.Middleware;
using CanchasApi.Models;
using CanchasApi.Repositories;
using CanchasApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Configuración de CORS explícita para consumo desde el frontend
const string FrontEndCorsPolicy = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: FrontEndCorsPolicy, policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configuración de Rate Limiting (Mitigación OWASP API4: Unrestricted Resource Consumption / Fuerza bruta)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("login-policy", opt =>
    {
        opt.PermitLimit = 5; // 5 intentos permitidos
        opt.Window = TimeSpan.FromMinutes(1); // por ventana de 1 minuto
        opt.QueueLimit = 0;
    });
});

// Cargamos todo lo referente a JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Falta configurar 'Jwt:Key' en la configuración de la aplicación.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey))
            };
        });
builder.Services.AddAuthorization();

// Conexión a la base de datos (Soporta miconexion y DefaultConnection)
var connString = builder.Configuration.GetConnectionString("miconexion") 
              ?? builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ReservasCanchasDbContext>(options =>
    options.UseSqlServer(connString));

// OpenAPI / Scalar
builder.Services.AddOpenApi();

// Invocamos la clase de autenticación
builder.Services.AddScoped<AuthService>();

// Repositorios
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

// Servicios de Inteligencia Artificial
builder.Services.AddHttpClient<IIaService, IaService>();
builder.Services.AddHttpClient();

var app = builder.Build();

// Manejador centralizado de excepciones (Formato estándar RFC 7807 ProblemDetails)
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        var problem = new
        {
            Type = "https://tools.ietf.org/html/rfc7807",
            Title = "Ha ocurrido un error inesperado en el servidor.",
            Status = StatusCodes.Status500InternalServerError,
            Detail = "Consulte los registros del sistema para más detalles.",
            Instance = context.Request.Path.Value
        };
        await context.Response.WriteAsJsonAsync(problem);
    });
});

app.UseRequestLogging();

// Middleware de Cabeceras de Seguridad HTTP (Mitigación OWASP API8: Security Misconfiguration)
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

// Habilitar CORS y Rate Limiting antes de Auth y endpoints
app.UseCors(FrontEndCorsPolicy);
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Endpoint para comprobar conexión a la base de datos (HealthCheck)
app.MapGet("/health", async (ReservasCanchasDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (canConnect)
            return Results.Ok(new { database = "connected" });

        if (db.Database.IsRelational())
        {
            await db.Database.MigrateAsync();
            return Results.Ok(new { database = "migrated_and_connected" });
        }

        return Results.StatusCode(503);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 503);
    }
});

// Documentación interactiva de la API (OpenAPI y Scalar) disponible en todos los entornos
app.MapOpenApi();
app.MapScalarApiReference();
app.MapGet("/swagger", () => Results.Redirect("/scalar/v1"));
app.MapGet("/docs", () => Results.Redirect("/scalar/v1"));
app.MapGet("/api-docs", () => Results.Redirect("/scalar/v1"));

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

// Creación de EndPoints
app.MapUsuarioApi();
app.MapTrabajadorApi();
app.MapSedeApi();
app.MapTipoCanchaApi();
app.MapCanchaApi();
app.MapHorarioApi();
app.MapReservaApi();
app.MapPagoApi();
app.MapComprobanteApi();
app.MapResenaApi();
app.MapMantenimientoApi();
app.MapNotificacionApi();
app.MapIaApi();
app.MapAnalisisIaApi();
app.MapDashboardApi();
app.MapReporteApi();

app.MapPost("/crear-admin-test", async (ReservasCanchasDbContext db, AuthService auth) =>
{
    var existingAdmin = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == "admin@admin.com");
    if (existingAdmin != null)
    {
        existingAdmin.Rol = "Administrador";
        existingAdmin.PasswordHash = auth.HashPassword(existingAdmin, "123456");
        await db.SaveChangesAsync();
        return Results.Ok(new { mensaje = "Usuario admin@admin.com actualizado exitosamente", usuarioId = existingAdmin.Id });
    }

    var admin = new Usuario
    {
        Nombre = "Administrador del Sistema",
        Email = "admin@admin.com",
        Rol = "Administrador",
        FechaCreacion = DateTime.UtcNow
    };
    admin.PasswordHash = auth.HashPassword(admin, "123456");

    db.Usuarios.Add(admin);
    await db.SaveChangesAsync();

    return Results.Created($"/api/v1/usuarios/{admin.Id}", new { mensaje = "Usuario admin@admin.com creado exitosamente", usuarioId = admin.Id });
});

app.MapPost("/crear-usuarios-test", async (ReservasCanchasDbContext db, AuthService auth) =>
{
    var usuariosCreados = new List<object>();

    // 1. Cliente de Prueba
    var cliente = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == "cliente@canchas.com");
    if (cliente == null)
    {
        cliente = new Usuario
        {
            Nombre = "Juan Perez (Cliente)",
            Email = "cliente@canchas.com",
            Rol = "Cliente",
            FechaCreacion = DateTime.UtcNow
        };
        cliente.PasswordHash = auth.HashPassword(cliente, "123456");
        db.Usuarios.Add(cliente);
        await db.SaveChangesAsync();
        usuariosCreados.Add(new { rol = "Cliente", email = "cliente@canchas.com", id = cliente.Id });
    }

    // 2. Trabajador de Prueba
    var trabajadorUser = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == "trabajador@canchas.com");
    if (trabajadorUser == null)
    {
        trabajadorUser = new Usuario
        {
            Nombre = "Carlos Encargado (Trabajador)",
            Email = "trabajador@canchas.com",
            Rol = "Trabajador",
            FechaCreacion = DateTime.UtcNow
        };
        trabajadorUser.PasswordHash = auth.HashPassword(trabajadorUser, "123456");
        db.Usuarios.Add(trabajadorUser);
        await db.SaveChangesAsync();

        var trabajadorRegistro = new Trabajador
        {
            UsuarioId = trabajadorUser.Id,
            Cargo = "Encargado de Canchas y Turnos",
            Turno = "Vespertino"
        };
        db.Trabajadores.Add(trabajadorRegistro);
        await db.SaveChangesAsync();
        usuariosCreados.Add(new { rol = "Trabajador", email = "trabajador@canchas.com", id = trabajadorUser.Id });
    }

    // 3. Administrador de Prueba
    var admin = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == "admin@admin.com");
    if (admin == null)
    {
        admin = new Usuario
        {
            Nombre = "Administrador del Sistema",
            Email = "admin@admin.com",
            Rol = "Administrador",
            FechaCreacion = DateTime.UtcNow
        };
        admin.PasswordHash = auth.HashPassword(admin, "123456");
        db.Usuarios.Add(admin);
        await db.SaveChangesAsync();
        usuariosCreados.Add(new { rol = "Administrador", email = "admin@admin.com", id = admin.Id });
    }

    return Results.Ok(new
    {
        mensaje = "Cuentas de prueba verificadas / creadas exitosamente.",
        clave_comun = "123456",
        usuarios = usuariosCreados
    });
});

// Función para migrar y sembrar la base de datos con reintentos
static async Task InicializarBaseDeDatosAsync(WebApplication app)
{
    const int maxReintentos = 15;
    for (int intento = 1; intento <= maxReintentos; intento++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ReservasCanchasDbContext>();
            var auth = scope.ServiceProvider.GetRequiredService<AuthService>();

            if (db.Database.IsRelational())
            {
                app.Logger.LogInformation("Verificando y migrando base de datos (intento {Intento}/{Max})...", intento, maxReintentos);
                await db.Database.MigrateAsync();
                app.Logger.LogInformation("¡Base de datos migrada exitosamente!");

                // 1. Sedes y Canchas maestras
                if (!await db.Sedes.AnyAsync())
                {
                    var sede1 = new Sede { Nombre = "Sede Central Cordillera", Direccion = "Av. Las Condes 1234", Telefono = "+56911223344" };
                    var sede2 = new Sede { Nombre = "Sede Poniente Estadio", Direccion = "Av. Pajaritos 5678", Telefono = "+56955667788" };
                    db.Sedes.AddRange(sede1, sede2);
                    await db.SaveChangesAsync();

                    var tipoF7 = new TipoCancha { Nombre = "Fútbol 7 Techada", Descripcion = "Pasto sintético monofilamento", PrecioPorHora = 30000 };
                    var tipoPadel = new TipoCancha { Nombre = "Pádel Cristal Panorámico", Descripcion = "Cancha panorámica techada", PrecioPorHora = 18000 };
                    var tipoTenis = new TipoCancha { Nombre = "Tenis Arcilla", Descripcion = "Polvo de ladrillo reglamentario", PrecioPorHora = 20000 };
                    db.TiposCancha.AddRange(tipoF7, tipoPadel, tipoTenis);
                    await db.SaveChangesAsync();

                    db.Canchas.AddRange(
                        new Cancha { Numero = 1, SedeId = sede1.Id, TipoCanchaId = tipoF7.Id, Estado = "Disponible" },
                        new Cancha { Numero = 2, SedeId = sede1.Id, TipoCanchaId = tipoPadel.Id, Estado = "Disponible" },
                        new Cancha { Numero = 3, SedeId = sede2.Id, TipoCanchaId = tipoTenis.Id, Estado = "Disponible" }
                    );
                    await db.SaveChangesAsync();
                }

                // 2. Usuarios de Prueba
                if (!await db.Usuarios.AnyAsync(u => u.Email == "admin@admin.com"))
                {
                    var admin = new Usuario { Nombre = "Administrador General", Email = "admin@admin.com", Rol = "Administrador", FechaCreacion = DateTime.UtcNow };
                    admin.PasswordHash = auth.HashPassword(admin, "123456");
                    db.Usuarios.Add(admin);
                }
                if (!await db.Usuarios.AnyAsync(u => u.Email == "admin@canchas.com"))
                {
                    var adminCanchas = new Usuario { Nombre = "Administrador Canchas", Email = "admin@canchas.com", Rol = "Administrador", FechaCreacion = DateTime.UtcNow };
                    adminCanchas.PasswordHash = auth.HashPassword(adminCanchas, "123456");
                    db.Usuarios.Add(adminCanchas);
                }
                if (!await db.Usuarios.AnyAsync(u => u.Email == "trabajador@canchas.com"))
                {
                    var trab = new Usuario { Nombre = "Carlos Trabajador", Email = "trabajador@canchas.com", Rol = "Trabajador", FechaCreacion = DateTime.UtcNow };
                    trab.PasswordHash = auth.HashPassword(trab, "123456");
                    db.Usuarios.Add(trab);
                    await db.SaveChangesAsync();
                    db.Trabajadores.Add(new Trabajador { UsuarioId = trab.Id, Cargo = "Encargado de Turno", Turno = "Vespertino" });
                }
                if (!await db.Usuarios.AnyAsync(u => u.Email == "cliente@canchas.com"))
                {
                    var cli = new Usuario { Nombre = "Juan Cliente", Email = "cliente@canchas.com", Rol = "Cliente", FechaCreacion = DateTime.UtcNow };
                    cli.PasswordHash = auth.HashPassword(cli, "123456");
                    db.Usuarios.Add(cli);
                }
                await db.SaveChangesAsync();
                app.Logger.LogInformation("¡Cuentas maestras iniciales configuradas!");
            }
            return;
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning("SQL Server aún no está listo ({Intento}/{Max}): {Mensaje}. Reintentando en 3s...", intento, maxReintentos, ex.Message);
            await Task.Delay(3000);
        }
    }
}

// Endpoint de respaldo para forzar migración y sembrado manual si fuese necesario
app.MapGet("/migrar-db", async () =>
{
    await InicializarBaseDeDatosAsync(app);
    return Results.Ok(new { mensaje = "Base de datos migrada y sembrada con éxito." });
});

// Inicializar la base de datos antes de escuchar peticiones
await InicializarBaseDeDatosAsync(app);

app.Run();

public partial class Program { }
