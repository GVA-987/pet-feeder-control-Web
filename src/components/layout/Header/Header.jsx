import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.scss';
import { div } from 'framer-motion/client';
import {useAuth} from '../../../context/AuthContext'
import AvatarMenu from './AvatarMenu';

const getPageTitle = (pathname, isAdmin) => {
    if (isAdmin) {
        if (pathname === '/admin') return 'Panel de Control';
        if (pathname.includes('/admin/users')) return 'Gestión de Usuarios';
        if (pathname.includes('/admin/devices')) return 'Inventario de Hardware';
        if (pathname.includes('/admin/logs')) return 'Consola de Auditoría';
        return 'Administración';
    }

    switch (pathname) {
        case '/home': return 'home'; 
        case '/ConfDevice': return 'Programación de Comidas';
        case '/history': return 'Historial de Dispensaciones';
        case '/count': return 'Ajustes del Dispositivo';
        case '/cuenta': return 'Mi Cuenta';
        default: return 'Pet Feeder Control';
    }
};

const getGreeting = (name) => {
    const hour = new Date().getHours();
    let greeting = 'Bienvenido(a)';
    if (hour < 12) greeting = 'Buenos Días';
    else if (hour < 18) greeting = 'Buenas Tardes';
    else greeting = 'Buenas Noches';
    return `${greeting}, ${name}! 👋`;
};



function Header() { 
    const { currentUser } = useAuth();
    const location = useLocation();
    const isAdmin = currentUser?.role === 'admin';
    const pageTitle = getPageTitle(location.pathname, isAdmin);
    
    const headerContent = (pageTitle === 'home') 
        ? getGreeting(currentUser.nombre) 
        : pageTitle;

    const SystemClock = () => {
        const [time, setTime] = useState(new Date());

        useEffect(() => {
            const timer = setInterval(() => setTime(new Date()), 1000);
            return () => clearInterval(timer);
        }, []);

        return (
            <div className={styles.systemClock}>
                <span>{time.toLocaleDateString()}</span>
                <span className={styles.divider}>|</span>
                <span>{time.toLocaleTimeString()}</span>
            </div>
        );
    };

    return (
        <div className={`${styles.contectHeader} ${isAdmin ? styles.adminHeader : ''}`}>
            <header className={styles.appHeader}>
                <div className={styles.titleSection}>
                    {isAdmin && <span className={styles.auditIndicator}>AUDIT_MODE</span>}
                    <h1 className={styles.headerTitle}>{pageTitle}</h1>
                    
                    
                </div>
{isAdmin && (
    <div className={styles.adminMeta}>
        <SystemClock />
    </div>
)}
                <div className={styles.adminStatus}>
                    {isAdmin ? (
                        
                        <div className={styles.adminProfile}>
                            <div className={styles.adminInfo}>
                                
                                <span className={styles.adminName}>{currentUser.nombre}</span>
                                <span className={styles.adminRole}>Administrator</span>
                            </div>
                            <div className={styles.statusDot}></div>
                        </div>
                    ) : (
                        <AvatarMenu />
                    )}
                </div>
            </header>
        </div>
    );
};

export default Header;