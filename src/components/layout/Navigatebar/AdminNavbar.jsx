import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/firebase-config';
import { RiDashboardLine, RiUserSettingsLine, RiShieldUserLine } from "react-icons/ri";
import { MdOutlineDevicesOther, MdLogout } from "react-icons/md";
import { NavLink, useNavigate } from 'react-router-dom';
import petLogo from '../../../assets/petlog.png';
import styles from './Navbar.module.scss'; 

const AdminNavbar = () => {
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
        <aside className={`${styles.sidebar} ${styles.adminSidebar}`}>
            <div className={styles.logo}>
                <img src={petLogo} alt="Logo" />
                <span className={styles.logoText}>PANEL ADMINISTRATIVO</span>
            </div>
            <nav className={styles.navPet}>
                <ul>
                    <li>
                        <NavLink to="/admin" end className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                            <RiDashboardLine /> Resumen General
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                            <RiUserSettingsLine /> Gestionar Usuarios
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/devices" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                            <MdOutlineDevicesOther /> Dispositivos Activos
                        </NavLink>
                    </li>
                </ul>
            </nav>
            <div className={styles.logoutContainer}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <MdLogout /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default AdminNavbar;