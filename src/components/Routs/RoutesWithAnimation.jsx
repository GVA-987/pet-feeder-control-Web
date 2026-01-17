import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import MainLayout from '../layout/MainLayout';
import HomePage from '../../pages/HomePage';
import ConfigDevicePage from '../../pages/ConfigDevicePage';
import CountOptionPage from '../../pages/CountOptionPage';
import HistoryDevicePage from '../../pages/HistoryDevicePage';
import configUser from '../confGen/userProfile/configUser';
import AdminPage from '../../pages/AdminPage';
import AdminUsersPage from '../../pages/AdminUsersPage';
import AdminDevicesPage from '../../pages/AdminDevicesPage';
import AdminLogsPage from '../../pages/AdminsLogsPages';
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';

// import NotFound from '../pages/NotFound'; // Opcional:  404

function RoutesWithAnimation() {
    useInactivityTimeout(60);
    const location = useLocation();

    return (
    <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />

        <Route 
            path="/admin" 
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <MainLayout>
                        <AdminPage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

        <Route 
            path="/admin/users" 
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <MainLayout>
                        <AdminUsersPage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

        <Route 
            path="/admin/devices" 
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <MainLayout>
                        <AdminDevicesPage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

        <Route 
            path="/admin/logs" 
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <MainLayout>
                        <AdminLogsPage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

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

        <Route 
            path="/ConfDevice" 
            element={
                <PrivateRoute>
                    <MainLayout>
                        <ConfigDevicePage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

        <Route 
            path="/history" 
            element={
                <PrivateRoute>
                    <MainLayout>
                        <HistoryDevicePage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />

        <Route 
            path="/count" 
            element={
                <PrivateRoute>
                    <MainLayout>
                        <CountOptionPage />
                    </MainLayout>
                </PrivateRoute>
            } 
        />
        </Routes>
    </AnimatePresence>
    );
}

export default RoutesWithAnimation;