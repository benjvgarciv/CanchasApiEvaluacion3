import React, { useState } from 'react';
import { Calendar, Trophy, ArrowRight, ShieldCheck, Clock, MapPin, Sparkles, Bot, Loader2, RefreshCw } from 'lucide-react';
import type { Cancha, Sede, Reserva } from '../types/cancha';
import type { Usuario } from '../types/auth';
import { canchasService } from '../api/canchasService';

interface InicioSectionProps {
  usuario: Usuario | null;
  canchas: Cancha[];
  sedes: Sede[];
  reservas: Reserva[];
  onNavigateTab: (tab: 'canchas' | 'reservas' | 'sedes' | 'tipos') => void;
}

export const InicioSection: React.FC<InicioSectionProps> = ({
  usuario,
  canchas,
  sedes,
  reservas,
  onNavigateTab,
}) => {
  const isCliente = usuario?.rol === 'Cliente';
  const canManage = usuario?.rol === 'Administrador' || usuario?.rol === 'Trabajador';
  const canchasDisponibles = canchas.filter((c) => c.estado === 'Disponible').length;
  const misReservasCount = isCliente
    ? reservas.filter((r) => r.usuarioId === usuario?.id).length
    : reservas.length;

  // Estados para Asistente de IA
  const [loadingIa, setLoadingIa] = useState(false);
  const [errorIa, setErrorIa] = useState<string | null>(null);
  const [iaData, setIaData] = useState<{
    resumen: string;
    totalReservasAnalizadas: number;
    tasaOcupacion: number;
    totalRecaudado: number;
    proveedor: string;
    fechaGeneracion: string;
  } | null>(null);

  const handleConsultarIa = async () => {
    setLoadingIa(true);
    setErrorIa(null);
    try {
      const data = await canchasService.generarResumenIa();
      setIaData(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorIa(errorObj.response?.data?.error || errorObj.message || 'Error al conectar con el Asistente de IA.');
    } finally {
      setLoadingIa(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tarjeta de bienvenida personalizada */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1e293b 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          color: '#ffffff',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        >
          <Trophy size={200} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Sparkles size={16} />
            <span>Panel de Gestión y Reservas</span>
          </div>

          <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: '#ffffff', fontWeight: 800 }}>
            ¡Bienvenido, {usuario?.nombre}!
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
            {isCliente
              ? 'Explora las canchas disponibles de nuestro complejo deportivo, revisa horarios en tiempo real y agenda tu próximo partido en segundos.'
              : 'Administra integralmente el catálogo de canchas, tarifas, sedes operativas y supervisa la agenda global de reservas.'}
          </p>

          {/* Accesos rápidos según el rol */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigateTab('canchas')}
              style={{
                backgroundColor: '#ffffff',
                color: '#1e40af',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Trophy size={18} />
              {isCliente ? 'Reservar una Cancha' : 'Gestionar Canchas'}
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigateTab('reservas')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Calendar size={18} />
              {isCliente ? 'Ver mis Reservas' : 'Ver Todas las Reservas'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen Visual del Complejo */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
          Resumen del Complejo Deportivo
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Métrica 1: Canchas */}
          <div
            className="portal-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {canchasDisponibles} / {canchas.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Canchas Disponibles
              </div>
            </div>
          </div>

          {/* Métrica 2: Sedes */}
          <div
            className="portal-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {sedes.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Sedes Deportivas
              </div>
            </div>
          </div>

          {/* Métrica 3: Reservas */}
          <div
            className="portal-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {misReservasCount}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {isCliente ? 'Mis Reservas Agendadas' : 'Total de Reservas'}
              </div>
            </div>
          </div>

          {/* Métrica 4: Rol y Estado */}
          <div
            className="portal-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#faf5ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {usuario?.rol}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {usuario?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Información y Horarios */}
      <div
        className="portal-card"
        style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} style={{ color: 'var(--color-primary)' }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Horarios de Atención y Reservas</h4>
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Nuestras canchas atienden de <strong>Lunes a Domingo de 08:00 a 00:00 hrs.</strong> Puedes
          reservar bloques horarios de 1 o más horas para fútbol 5, fútbol 7 o pádel con iluminación LED
          y estacionamiento privado garantizado.
        </p>
      </div>

      {/* Módulo Asistente de IA para Resúmenes Ejecutivos */}
      {canManage && (
        <div
          className="portal-card"
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e0e7ff',
            background: 'linear-gradient(to right bottom, #ffffff, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e1b4b' }}>
                  Asistente de Inteligencia Artificial para Resúmenes
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Diagnóstico gerencial y análisis predictivo en tiempo real
                </span>
              </div>
            </div>

            <button
              onClick={handleConsultarIa}
              disabled={loadingIa}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#4f46e5',
                borderColor: '#4f46e5',
                padding: '0.65rem 1.25rem',
                fontSize: '0.92rem',
              }}
            >
              {loadingIa ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analizando datos...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generar Resumen con IA
                </>
              )}
            </button>
          </div>

          {errorIa && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            >
              {errorIa}
            </div>
          )}

          {iaData ? (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {iaData.proveedor}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Generado: {new Date(iaData.fechaGeneracion).toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {iaData.resumen}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span><strong>Reservas analizadas:</strong> {iaData.totalReservasAnalizadas}</span>
                <span><strong>Efectividad:</strong> {iaData.tasaOcupacion}%</span>
                <span><strong>Total Recaudado:</strong> ${iaData.totalRecaudado.toLocaleString()} CLP</span>
              </div>
            </div>
          ) : (
            !loadingIa && (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Haz clic en &quot;Generar Resumen con IA&quot; para que el asistente analice las reservas históricas, calcule tasas de efectividad y entregue recomendaciones comerciales para el recinto.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
};
