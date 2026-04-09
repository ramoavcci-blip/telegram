import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
    const { user, loading } = useAuth();
  
    if (loading) {
      return <div className="flex h-screen items-center justify-center text-white">Yükleniyor...</div>;
    }
  
    if (!user || user.role !== 'SUPERADMIN') {
      return <Navigate to="/" replace />;
    }
  
    return <Outlet />;
};
