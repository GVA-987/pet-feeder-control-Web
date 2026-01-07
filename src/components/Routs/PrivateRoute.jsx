import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
      return <Navigate to="/login" replace state={{ from:location }} />;
    }

    if (currentUser.role === 'admin' && !allowedRoles) {
        return <Navigate to="/admin" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/home" replace />
    }
    return children;
};

export default PrivateRoute;