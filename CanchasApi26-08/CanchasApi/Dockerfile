# Multi-stage Dockerfile para CanchasApi (.NET 10 Minimal APIs)
# Etapa 1: Build y Restauración
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias
COPY ["CanchasApi/CanchasApi.csproj", "CanchasApi/"]
RUN dotnet restore "CanchasApi/CanchasApi.csproj"

# Copiar el código fuente completo y compilar
COPY . .
WORKDIR "/src/CanchasApi"
RUN dotnet build "CanchasApi.csproj" -c Release -o /app/build

# Etapa 2: Publish
FROM build AS publish
RUN dotnet publish "CanchasApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa 3: Runtime Ligero Final
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Instalar dependencias necesarias para Alpine y usuario no-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CanchasApi.dll"]
