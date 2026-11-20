# Stage 1: Compilación de la API ASP.NET Core 10 (Multi-stage build)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["CanchasApi.csproj", "./"]
RUN dotnet restore "./CanchasApi.csproj"

COPY . .
RUN dotnet publish "./CanchasApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Imagen base ligera y segura para producción (.NET Alpine)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Usuario no privilegiado para cumplimiento de seguridad (OWASP)
USER $APP_UID

ENTRYPOINT ["dotnet", "CanchasApi.dll"]
