import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/firebase-config';
import { IoHomeOutline } from "react-icons/io5";
import { HiOutlineAdjustments } from "react-icons/hi";
import { GrHistory, GrConfigure } from "react-icons/gr";
import { NavLink, useNavigate } from 'react-router-dom';
import petLogo from '../../../assets/petlog.png';
import styles from './Navbar.module.scss';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
    try {
        await signOut(auth);
        navigate('/login');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
    };

    return (
    <aside className={styles.sidebar}>
        <div className={styles.logo}>
            <img src={petLogo} alt="Logo" />
            <span className={styles.logoText}>Dosificadora Pet-GVA</span>
        </div>
        <nav className={styles.navPet}>
            <ul>
                <li>
                    <NavLink to="/home" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><IoHomeOutline /> Inicio</NavLink>
                </li>
                <li>
                    <NavLink to="/ConfDevice" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><HiOutlineAdjustments /> Programación</NavLink>
                </li>
                <li>
                    <NavLink to="/history" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><GrHistory /> Historial</NavLink>
                </li>
                <li>
                    <NavLink to="/count" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><GrConfigure /> Ajustes</NavLink>
                </li>

            </ul>
        </nav>
    </aside>
    );
};

export default Navbar;