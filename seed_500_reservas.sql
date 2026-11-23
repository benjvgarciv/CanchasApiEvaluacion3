-- ==============================================================================
-- Script: seed_500_reservas.sql
-- Descripción: Generación Sintética de 500 Reservas con 12 Meses de Historia
-- Proyecto: CanchasApi - Evaluación 3 (Hito 2: Datos y Backend)
-- Motor: Microsoft SQL Server (100% Compatible con todas las versiones)
-- ==============================================================================

USE [ReservasCanchasDB];
GO

SET NOCOUNT ON;

PRINT '>> Iniciando verificación de datos maestros y sembrado sintético...';

-- 1. Sedes maestras
IF NOT EXISTS (SELECT 1 FROM [Sede])
BEGIN
    INSERT INTO [Sede] ([Nombre], [Direccion], [Telefono])
    VALUES 
    (N'Sede Central Cordillera', N'Av. Las Condes 1234', N'+56911223344'),
    (N'Sede Poniente Estadio', N'Av. Pajaritos 5678', N'+56955667788'),
    (N'Sede Norte El Roble', N'Av. Recoleta 9101', N'+56999887766');
    PRINT '>> Sedes insertadas.';
END

-- 2. Tipos de Cancha
IF NOT EXISTS (SELECT 1 FROM [TipoCancha])
BEGIN
    INSERT INTO [TipoCancha] ([Nombre], [Descripcion], [PrecioPorHora])
    VALUES 
    (N'Fútbol 7 Sintético', N'Pasto sintético monofilamento con iluminación LED', 35000.00),
    (N'Pádel Panorámico', N'Cancha de cristal panorámico techada', 22000.00),
    (N'Tenis Arcilla', N'Superficie de polvo de ladrillo reglamentaria', 20000.00);
    PRINT '>> Tipos de Cancha insertados.';
END

-- 3. Canchas (al menos 6)
DECLARE @Sede1Id INT = COALESCE((SELECT TOP 1 [Id] FROM [Sede] ORDER BY [Id]), 1);
DECLARE @Sede2Id INT = COALESCE((SELECT TOP 1 [Id] FROM [Sede] WHERE [Id] <> @Sede1Id ORDER BY [Id]), @Sede1Id);
DECLARE @TipoF7 INT = COALESCE((SELECT TOP 1 [Id] FROM [TipoCancha] WHERE [Nombre] LIKE N'%F%tbol%'), 1);
DECLARE @TipoPadel INT = COALESCE((SELECT TOP 1 [Id] FROM [TipoCancha] WHERE [Nombre] LIKE N'%del%'), 2);
DECLARE @TipoTenis INT = COALESCE((SELECT TOP 1 [Id] FROM [TipoCancha] WHERE [Nombre] LIKE N'%Tenis%'), 3);

IF (SELECT COUNT(*) FROM [Cancha]) < 6
BEGIN
    INSERT INTO [Cancha] ([Numero], [SedeId], [TipoCanchaId], [Estado])
    VALUES 
    (1, @Sede1Id, @TipoF7, N'Disponible'),
    (2, @Sede1Id, @TipoPadel, N'Disponible'),
    (3, @Sede1Id, @TipoTenis, N'Disponible'),
    (4, @Sede2Id, @TipoF7, N'Disponible'),
    (5, @Sede2Id, @TipoPadel, N'Disponible'),
    (6, @Sede2Id, @TipoTenis, N'Disponible');
    PRINT '>> Canchas insertadas.';
END

-- 4. Usuarios Clientes Sintéticos
DECLARE @u INT = 1;
WHILE @u <= 15
BEGIN
    DECLARE @EmailUser NVARCHAR(150) = N'jugador' + RIGHT('00' + CAST(@u AS NVARCHAR(2)), 2) + N'@complejosport.cl';
    IF NOT EXISTS (SELECT 1 FROM [Usuario] WHERE [Email] = @EmailUser)
    BEGIN
        INSERT INTO [Usuario] ([Nombre], [Email], [PasswordHash], [Rol], [FechaCreacion])
        VALUES (
            N'Jugador Sintético ' + CAST(@u AS NVARCHAR(2)),
            @EmailUser,
            N'AQAAAAIAAYagAAAAEOc9xQ2n7...', -- Hash PBKDF2 representativo
            N'Cliente',
            DATEADD(MONTH, -12, GETUTCDATE())
        );
    END
    SET @u = @u + 1;
END
PRINT '>> Usuarios clientes sintéticos verificados.';

-- 5. Asegurar Trabajador
DECLARE @AdminUserId INT = (SELECT TOP 1 [Id] FROM [Usuario] WHERE [Rol] IN ('Trabajador', 'Administrador'));
IF @AdminUserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM [Trabajador] WHERE [UsuarioId] = @AdminUserId)
BEGIN
    INSERT INTO [Trabajador] ([UsuarioId], [Cargo], [Turno])
    VALUES (@AdminUserId, N'Coordinador Operativo', N'Tarde/Noche');
    PRINT '>> Trabajador asignado.';
END

DECLARE @TrabajadorId INT = (SELECT TOP 1 [Id] FROM [Trabajador]);

-- 6. Generación de 500 Reservas con 12 Meses de Historia y Pagos/Comprobantes
DECLARE @TotalActual INT = (SELECT COUNT(*) FROM [Reserva]);
DECLARE @Faltantes INT = 500 - @TotalActual;

IF @Faltantes > 0
BEGIN
    PRINT '>> Generando ' + CAST(@Faltantes AS NVARCHAR(10)) + ' reservas históricas sintéticas...';

    DECLARE @idx INT = 1;
    DECLARE @CanchasCount INT = (SELECT COUNT(*) FROM [Cancha]);
    DECLARE @SelectedCanchaId INT;
    DECLARE @SelectedUserId INT;
    DECLARE @DayOffset INT;
    DECLARE @BaseDate DATETIME2;
    DECLARE @StartHour INT;
    DECLARE @FechaInicio DATETIME2;
    DECLARE @FechaFin DATETIME2;
    DECLARE @Estado NVARCHAR(20);
    DECLARE @NewReservaId INT;
    DECLARE @Metodo NVARCHAR(20);
    DECLARE @Precio DECIMAL(18,2);
    DECLARE @NewPagoId INT;
    DECLARE @TipoDoc NVARCHAR(20);

    WHILE @idx <= @Faltantes
    BEGIN
        -- Selección rotativa determinista de cancha
        SET @SelectedCanchaId = (
            SELECT [Id] FROM (
                SELECT [Id], ROW_NUMBER() OVER (ORDER BY [Id]) AS rn FROM [Cancha]
            ) t WHERE rn = ((@idx % @CanchasCount) + 1)
        );

        -- Selección de usuario cliente
        SET @SelectedUserId = (
            SELECT TOP 1 [Id] FROM [Usuario] WHERE [Rol] = 'Cliente' ORDER BY [Id] ASC
        );
        -- Rotar usuarios
        SET @SelectedUserId = @SelectedUserId + (@idx % 15);
        IF NOT EXISTS (SELECT 1 FROM [Usuario] WHERE [Id] = @SelectedUserId)
            SET @SelectedUserId = (SELECT TOP 1 [Id] FROM [Usuario] WHERE [Rol] = 'Cliente');

        -- Distribución temporal en los últimos 365 días
        SET @DayOffset = CAST((CAST(@idx AS FLOAT) / CAST(@Faltantes AS FLOAT)) * 365.0 AS INT);
        SET @BaseDate = DATEADD(DAY, -@DayOffset, GETUTCDATE());
        
        -- Franjas horarias entre las 09:00 y las 21:00
        SET @StartHour = 9 + (@idx % 13);
        
        -- Construcción limpia y compatible de fecha inicio y fin
        SET @FechaInicio = DATEADD(HOUR, @StartHour, CAST(CAST(@BaseDate AS DATE) AS DATETIME2));
        SET @FechaFin = DATEADD(HOUR, 1, @FechaInicio);

        -- Ponderación de estados según antigüedad
        IF @FechaInicio < DATEADD(DAY, -2, GETUTCDATE())
        BEGIN
            IF (@idx % 10 = 0)
                SET @Estado = N'Cancelada';
            ELSE
                SET @Estado = N'Completada';
        END
        ELSE
        BEGIN
            IF (@idx % 2 = 0)
                SET @Estado = N'Confirmada';
            ELSE
                SET @Estado = N'Pendiente';
        END

        -- Insertar Reserva
        INSERT INTO [Reserva] ([UsuarioId], [CanchaId], [TrabajadorId], [FechaInicio], [FechaFin], [Estado])
        VALUES (@SelectedUserId, @SelectedCanchaId, @TrabajadorId, @FechaInicio, @FechaFin, @Estado);

        SET @NewReservaId = SCOPE_IDENTITY();

        -- Si es completada o confirmada, emitir pago y comprobante
        IF @Estado IN (N'Completada', N'Confirmada')
        BEGIN
            IF (@idx % 3 = 0)
                SET @Metodo = N'Tarjeta';
            ELSE IF (@idx % 3 = 1)
                SET @Metodo = N'Transferencia';
            ELSE
                SET @Metodo = N'Efectivo';

            SET @Precio = ISNULL((
                SELECT tc.[PrecioPorHora] 
                FROM [Cancha] c 
                INNER JOIN [TipoCancha] tc ON c.[TipoCanchaId] = tc.[Id] 
                WHERE c.[Id] = @SelectedCanchaId
            ), 30000.00);

            INSERT INTO [Pago] ([ReservaId], [Monto], [FechaPago], [MetodoPago], [Estado])
            VALUES (@NewReservaId, @Precio, DATEADD(MINUTE, -30, @FechaInicio), @Metodo, N'Pagado');

            SET @NewPagoId = SCOPE_IDENTITY();

            IF (@idx % 7 = 0)
                SET @TipoDoc = N'Factura';
            ELSE
                SET @TipoDoc = N'Boleta';

            INSERT INTO [Comprobante] ([PagoId], [NumeroComprobante], [Tipo], [FechaEmision])
            VALUES (
                @NewPagoId,
                N'BOL-' + CAST(YEAR(@FechaInicio) AS NVARCHAR(4)) + N'-' + RIGHT('000000' + CAST(@NewReservaId AS NVARCHAR(10)), 6),
                @TipoDoc,
                DATEADD(MINUTE, -25, @FechaInicio)
            );

            -- 30% con Reseñas
            IF @Estado = N'Completada' AND (@idx % 3 = 0)
            BEGIN
                INSERT INTO [Resena] ([ReservaId], [UsuarioId], [Calificacion], [Comentario], [Fecha])
                VALUES (
                    @NewReservaId,
                    @SelectedUserId,
                    CAST(4 + (@idx % 2) AS TINYINT),
                    N'Excelente infraestructura deportiva e iluminación.',
                    DATEADD(HOUR, 2, @FechaFin)
                );
            END
        END

        SET @idx = @idx + 1;
    END
    PRINT '>> Sembrado de 500 reservas culminado con éxito.';
END
ELSE
BEGIN
    PRINT '>> La base de datos ya cuenta con ' + CAST(@TotalActual AS NVARCHAR(10)) + ' reservas (>= 500).';
END

PRINT '>> RESUMEN DE TOTALES EN BASE DE DATOS:';
SELECT 
    (SELECT COUNT(*) FROM [Usuario]) AS TotalUsuarios,
    (SELECT COUNT(*) FROM [Cancha]) AS TotalCanchas,
    (SELECT COUNT(*) FROM [Reserva]) AS TotalReservas,
    (SELECT COUNT(*) FROM [Pago]) AS TotalPagos,
    (SELECT COUNT(*) FROM [Comprobante]) AS TotalComprobantes,
    (SELECT COUNT(*) FROM [Resena]) AS TotalResenas;
GO
