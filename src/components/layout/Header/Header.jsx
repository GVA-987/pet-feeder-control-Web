import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.scss';
import { div } from 'framer-motion/client';
import {useAuth} from '../../../context/AuthContext'
import AvatarMenu from './AvatarMenu';

const getPageTitle = (pathname) => {
    switch (pathname) {
        case '/home':
            return 'home'; 
        case '/ConfDevice':
            return 'Programacion de Comidas';
        case '/history':
            return 'Historial de Dispensaciones';
        case '/count':
            return 'Ajustes del Dispositivo';
        case '/cuenta':
            return 'Mi Cuenta y Perfil de Mascota';
        default:
            return 'Pet Feeder Control';
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



function Header ()  { 
    const { currentUser } = useAuth();
    
    const location = useLocation();
    const pathname = location.pathname;
    
    const pageTitle = getPageTitle(pathname);
    const headerContent = (pageTitle === 'home') 
        ? getGreeting(currentUser.nombre) 
        : pageTitle;

    return (
        <div className={styles.contectHeader}>
            <header className={styles.appHeader}>
                <h1 className={styles.headerTitle}>
                    {headerContent}
                </h1>

                <div className={styles.contAvatarMenu}>
                    <AvatarMenu />
                {/* <img src={logo} alt="PetLog Logo" className={styles.logo} /> */}
                </div>
            </header>
        </div>
        
    );
};

export default Header;