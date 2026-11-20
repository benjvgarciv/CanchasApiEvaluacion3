import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Raíz Redirige al Panel de Control */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas Protegidas para usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Ruta 404 para vistas no encontradas (Criterio 4 Rúbrica) */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
