// src/components/PublicRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // Si ya hay un usuario logueado, lo redirigimos a la página de inicio
  if (currentUser) {
    return <Navigate to="/home" replace />;
  }

  // Si no hay usuario, permitimos que se muestre el componente de login/registro
  return children;
};

export default PublicRoute;