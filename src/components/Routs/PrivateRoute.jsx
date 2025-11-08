import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
      return <Navigate to="/login" replace state={{ from:location }} />;
    }
    return children;
};

export default PrivateRoute;