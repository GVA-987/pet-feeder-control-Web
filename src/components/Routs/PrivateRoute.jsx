import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

  // Si no hay un usuario autenticado, redirigimos a la página de login
    if (!currentUser) {
      return <Navigate to="/login" replace state={{ from:location }} />;
    }

    //Si hya un usuario con dispositvo enlazado
    if(!currentUser.deviceId) {
      if(location.pathname !== '/link-device'){
        return <Navigate to='/link-device' replace />
      }
    }
  // Si hay un usuario, mostramos el componente que se pasó como 'children'
    return children;
};

export default PrivateRoute;