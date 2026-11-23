import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si venimos redirigidos por sesión expirada
  const isExpired = new URLSearchParams(location.search).get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
        } else if (err.response?.status === 429) {
          setErrorMsg('Demasiados intentos fallidos. Por favor, espera un minuto antes de reintentar.');
        } else if (err.response?.data?.detail) {
          setErrorMsg(err.response.data.detail);
        } else if (err.response?.data?.error) {
          setErrorMsg(err.response.data.error);
        } else if (err.response?.status) {
          setErrorMsg(`Error del servidor (${err.response.status}): ${err.response.data?.detail || err.response.data?.message || err.response.statusText || 'Error interno'}`);
        } else {
          setErrorMsg(`Error de conexión (${err.message || 'Sin respuesta del servidor'}).`);
        }
      } else {
        setErrorMsg('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: '400px', margin: '4rem auto', padding: '1.5rem' }}>
      <h1>Iniciar Sesión</h1>

      {isExpired && (
        <div
          role="status"
          style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px' }}
        >
          Tu sesión ha expirado. Por favor, ingresa tus credenciales nuevamente.
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Correo Electrónico
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            aria-required="true"
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-required="true"
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '0.75rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', minHeight: '44px' }}
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a
            href="/scalar/v1"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.88rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
          >
            📘 Ver Menú y Documentación de la API (Scalar) ➔
          </a>
        </div>
      </form>
    </main>
  );
};
