// src/components/RoutesWithAnimation.jsx

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import HomePage from '../../pages/HomePage';
import MainLayout from '../layout/MainLayout';
import DeviceLink from '../dashboard/deviceLink/DeviceLink';
// import NotFound from '../pages/NotFound'; // Opcional: una página 404

function RoutesWithAnimation() {
    const location = useLocation();

    return (
    <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Rutas Públicas (no protegidas) */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Ruta protegida para enlazar el dispositivo */}
        <Route 
            path='/link-device'
            element={
                <PrivateRoute>
                    <DeviceLink />
                </PrivateRoute>
            }
        />

        {/* Rutas Protegidas (solo accesibles si el usuario está autenticado) */}
        <Route 
            path="/home" 
            element={
                <PrivateRoute>
                    <MainLayout>
                        <HomePage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />
        
        {/* Ruta para capturar cualquier URL no definida */}
        {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
    </AnimatePresence>
    );
}

export default RoutesWithAnimation;