import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card, 0 10px 15px -3px rgba(0,0,0,0.1))',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <AlertOctagon size={32} />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155', margin: '0 0 1rem' }}>
          Página No Encontrada
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 2rem' }}>
          Lo sentimos, la ruta a la que intentas acceder no existe en la plataforma de reservas deportivas o ha sido reubicada.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1e40af',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          <Home size={18} />
          <span>Volver al Panel Principal</span>
        </button>
      </div>
    </main>
  );
};
