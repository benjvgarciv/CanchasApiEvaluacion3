import React from 'react';

/**
 * Enlace de accesibilidad para saltar al contenido principal (WCAG 2.2 AA - Criterio 2.4.1 Bypass Blocks).
 * Es invisible visualmente hasta que un usuario que navega con el teclado pulsa Tab.
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: '-100px',
        left: '1rem',
        backgroundColor: '#1e40af',
        color: '#ffffff',
        padding: '0.75rem 1.25rem',
        borderRadius: '6px',
        fontWeight: 700,
        zIndex: 99999,
        textDecoration: 'none',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        transition: 'top 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '1rem';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
      }}
    >
      Saltar al contenido principal
    </a>
  );
};
