import React, { useState, useEffect } from 'react';
import { canchasService } from '../api/canchasService';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Table,
  Bot,
  HelpCircle,
} from 'lucide-react';

interface DashboardMetrics {
  kpis: {
    totalReservas: number;
    totalIngresos: number;
    ticketPromedio: number;
    tasaCancelacion: number;
    tasaOcupacion: number;
    deportePrincipal: string;
    horarioPico: string;
  };
  visualizaciones: {
    distribucionEstados: Array<{ estado: string; cantidad: number; porcentaje: number }>;
    ingresosMensuales: Array<{ periodo: string; reservas: number; ingresosEstimados: number }>;
    reservasPorDeporte: Array<{ deporte: string; totalReservas: number; porcentaje: number }>;
    actividadPorSede: Array<{ sede: string; totalReservas: number; ingresosSede: number }>;
  };
}

export const DashboardSection: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para alternar vista de tabla accesible en cada gráfico (Criterio WCAG 2.2 AA)
  const [showTable1, setShowTable1] = useState<boolean>(false);
  const [showTable2, setShowTable2] = useState<boolean>(false);
  const [showTable3, setShowTable3] = useState<boolean>(false);
  const [showTable4, setShowTable4] = useState<boolean>(false);

  // Estados de IA
  const [iaLoading, setIaLoading] = useState<boolean>(false);
  const [iaResult, setIaResult] = useState<any>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await canchasService.getMetricasDashboard();
      setData(res);
    } catch {
      setError('Error al cargar métricas del backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleEjecutarIa = async () => {
    setIaLoading(true);
    try {
      const res = await canchasService.analizarResenasConIa();
      setIaResult(res);
    } catch {
      setIaResult(null);
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#2563eb' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cargando analítica y visualizaciones de Business Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
        <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
        <p>{error || 'No se pudieron recuperar las métricas.'}</p>
        <button onClick={fetchMetrics} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, visualizaciones } = data;
  const maxIngreso = Math.max(...visualizaciones.ingresosMensuales.map((m) => m.ingresosEstimados), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
            Panel de Inteligencia de Negocios (BI)
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
            Indicadores de rendimiento, visualizaciones interactivas y diagnóstico predictivo con IA sobre 500+ reservas.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <RefreshCw size={16} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* SECCIÓN 1: Los 6 Indicadores Clave de Negocio (KPIs) */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="#2563eb" />
          <span>Indicadores de Desempeño Operativo y Financiero (6 KPIs)</span>
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* KPI 1: Tasa de Ocupación */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>1. Tasa de Ocupación</span>
              <span title="Fórmula: (Horas Reservadas / Horas Disponibles) × 100" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>
              {kpis.tasaOcupacion}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>
              ¿Capacidad instalada aprovechada? Alta rentabilidad
            </div>
          </div>

          {/* KPI 2: Ticket Promedio */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>2. Ticket Promedio</span>
              <span title="Fórmula: Total Recaudado / Reservas Completadas" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>
              ${kpis.ticketPromedio.toLocaleString('es-CL')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 500 }}>
              ¿Gasto medio por arriendo? Tarifa balanceada
            </div>
          </div>

          {/* KPI 3: Tasa de Cancelación */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>3. Tasa de Cancelación</span>
              <span title="Fórmula: (Reservas Canceladas / Total Solicitadas) × 100" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: kpis.tasaCancelacion <= 10 ? '#16a34a' : '#dc2626', margin: '0.5rem 0' }}>
              {kpis.tasaCancelacion}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              ¿Pérdida por inasistencia? Margen saludable (&lt;10%)
            </div>
          </div>

          {/* KPI 4: Ingreso Total */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>4. Facturación Acumulada</span>
              <span title="Fórmula: Sumatoria de todos los Pagos con estado 'Pagado'" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: '0.5rem 0' }}>
              ${kpis.totalIngresos.toLocaleString('es-CL')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>
              {kpis.totalReservas} reservas totales procesadas
            </div>
          </div>

          {/* KPI 5: Deporte Principal */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>5. Deporte Más Demandado</span>
              <span title="Fórmula: Modo estadístico por TipoCancha en Reservas" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: '0.65rem 0' }}>
              {kpis.deportePrincipal}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 500 }}>
              Mayor concentración de horas de arriendo
            </div>
          </div>

          {/* KPI 6: Horario Pico */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>6. Horario Pico</span>
              <span title="Fórmula: Franja horaria con mayor concurrencia" style={{ cursor: 'help' }}><HelpCircle size={15} /></span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: '0.65rem 0' }}>
              {kpis.horarioPico}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 500 }}>
              Ocupación máxima / Turnos nocturnos
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Las 4 Visualizaciones Adecuadas al Tipo de Dato */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        
        {/* Visualización 1: Ingresos Mensuales (Gráfico de Columnas Temporales) */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>1. Evolución Mensual de Facturación</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Serie histórica de 12 meses móviles</p>
            </div>
            <button
              onClick={() => setShowTable1(!showTable1)}
              aria-label="Alternar vista entre gráfico y tabla de datos para ingresos mensuales"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
            >
              <Table size={14} />
              <span>{showTable1 ? 'Ver Gráfico' : 'Ver Tabla (A11y)'}</span>
            </button>
          </div>

          {!showTable1 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '1rem 0', borderBottom: '1px solid #cbd5e1' }} role="img" aria-label="Gráfico de columnas con la facturación de los últimos 12 meses">
              {visualizaciones.ingresosMensuales.map((item, idx) => {
                const heightPercent = Math.max(15, Math.round((item.ingresosEstimados / maxIngreso) * 100));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{item.reservas}</div>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        backgroundColor: '#2563eb',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${item.periodo}: ${item.reservas} reservas, $${item.ingresosEstimados.toLocaleString('es-CL')} estimados`}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>{item.periodo.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '220px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Período</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Reservas</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ingresos Estimados</th>
                  </tr>
                </thead>
                <tbody>
                  {visualizaciones.ingresosMensuales.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{m.periodo}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{m.reservas}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${m.ingresosEstimados.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visualización 2: Distribución por Deporte / Tipo de Cancha */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>2. Participación por Deporte</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Proporción de demanda por disciplina</p>
            </div>
            <button
              onClick={() => setShowTable2(!showTable2)}
              aria-label="Alternar vista entre gráfico y tabla para participación por deporte"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
            >
              <Table size={14} />
              <span>{showTable2 ? 'Ver Gráfico' : 'Ver Tabla (A11y)'}</span>
            </button>
          </div>

          {!showTable2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }} role="img" aria-label="Barras de distribución porcentual por disciplina deportiva">
              {visualizaciones.reservasPorDeporte.map((d, idx) => {
                const colors = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#06b6d4'];
                const col = colors[idx % colors.length];
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{d.deporte}</span>
                      <span style={{ fontWeight: 700, color: col }}>{d.totalReservas} reservas ({d.porcentaje}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.porcentaje}%`, height: '100%', backgroundColor: col, borderRadius: '9999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Deporte</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Reservas</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {visualizaciones.reservasPorDeporte.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{d.deporte}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{d.totalReservas}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{d.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visualización 3: Ciclo de Vida y Estados de Reservas */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>3. Estado del Ciclo de Vida</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Efectividad de confirmación y cierre</p>
            </div>
            <button
              onClick={() => setShowTable3(!showTable3)}
              aria-label="Alternar vista entre gráfico y tabla para estados de reservas"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
            >
              <Table size={14} />
              <span>{showTable3 ? 'Ver Gráfico' : 'Ver Tabla (A11y)'}</span>
            </button>
          </div>

          {!showTable3 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {visualizaciones.distribucionEstados.map((e, idx) => {
                const bgMap: Record<string, { bg: string; text: string }> = {
                  Completada: { bg: '#ecfdf5', text: '#059669' },
                  Confirmada: { bg: '#eff6ff', text: '#2563eb' },
                  Cancelada: { bg: '#fef2f2', text: '#dc2626' },
                  Pendiente: { bg: '#fffbeb', text: '#d97706' },
                };
                const config = bgMap[e.estado] || { bg: '#f8fafc', text: '#475569' };
                return (
                  <div key={idx} style={{ backgroundColor: config.bg, padding: '1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${config.text}33` }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: config.text }}>{e.estado}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>{e.cantidad}</div>
                    <div style={{ fontSize: '0.8rem', color: config.text, fontWeight: 700 }}>{e.porcentaje}% del total</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {visualizaciones.distribucionEstados.map((e, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{e.estado}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{e.cantidad}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{e.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visualización 4: Actividad y Rendimiento por Sede */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>4. Comparativa por Sede</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Volumen de reservas y facturación por recinto</p>
            </div>
            <button
              onClick={() => setShowTable4(!showTable4)}
              aria-label="Alternar vista entre gráfico y tabla para actividad por sede"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
            >
              <Table size={14} />
              <span>{showTable4 ? 'Ver Gráfico' : 'Ver Tabla (A11y)'}</span>
            </button>
          </div>

          {!showTable4 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              {visualizaciones.actividadPorSede.map((s, idx) => (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.sede}</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>${s.ingresosSede.toLocaleString('es-CL')}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {s.totalReservas} reservas registradas ({Math.round((s.totalReservas / kpis.totalReservas) * 100)}% del total)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Sede</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Reservas</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ingresos Generados</th>
                  </tr>
                </thead>
                <tbody>
                  {visualizaciones.actividadPorSede.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{s.sede}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{s.totalReservas}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${s.ingresosSede.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: Panel de Inteligencia Artificial Externa */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Sparkles size={14} />
              <span>Servicio de IA Integrado (Criterio 9)</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Análisis Predictivo y Sentimiento de Reseñas
            </h3>
            <p style={{ margin: '0.25rem 0 0', color: '#c7d2fe', fontSize: '0.9rem' }}>
              Procesa las opiniones de los usuarios para extraer oportunidades de mejora operativa.
            </p>
          </div>

          <button
            onClick={handleEjecutarIa}
            disabled={iaLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              cursor: iaLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
            }}
          >
            {iaLoading ? <RefreshCw size={18} className="animate-spin" /> : <Bot size={18} />}
            <span>{iaLoading ? 'Analizando con IA...' : 'Ejecutar Diagnóstico IA'}</span>
          </button>
        </div>

        {iaResult && (
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: '#10b981', color: '#fff', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem' }}>
                Sentimiento: {iaResult.sentimientoPredominante} ({iaResult.puntuacionSentimiento} / 5.0)
              </div>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Proveedor: {iaResult.proveedor}</span>
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#f8fafc', marginBottom: '1.25rem' }}>
              {iaResult.resumenEjecutivo}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <h5 style={{ margin: '0 0 0.5rem', color: '#6ee7b7', fontWeight: 700 }}>Aspectos Positivos Destacados:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {iaResult.aspectosPositivos?.map((item: string, i: number) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <h5 style={{ margin: '0 0 0.5rem', color: '#fde68a', fontWeight: 700 }}>Oportunidades de Mejora:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {iaResult.oportunidadesMejora?.map((item: string, i: number) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
