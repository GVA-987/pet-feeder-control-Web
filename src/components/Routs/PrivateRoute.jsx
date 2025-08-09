import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();

  // Si no hay un usuario autenticado, redirigimos a la página de login
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
  // Si hay un usuario, mostramos el componente que se pasó como 'children'
    return children;
};

export default PrivateRoute;