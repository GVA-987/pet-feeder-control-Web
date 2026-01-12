import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/firebase-config';
import { RiDashboardLine, RiUserSettingsLine, RiShieldUserLine, RiShieldKeyholeLine } from "react-icons/ri";
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
        <aside className={styles.adminSidebar}>
            <div className={styles.brand}>
                <div className={styles.logoBox}>
                    <img src={petLogo} alt="Logo" />
                </div>
                <div className={styles.brandText}>
                    <span>PETLOG</span>
                    <small>SISTEMA CENTRAL</small>
                </div>
            </div>

            <nav className={styles.auditNav}>
                <div className={styles.navGroupLabel}>MONITOREO</div>
                <NavLink to="/admin" end className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                    <RiDashboardLine /> Resumen Operativo
                </NavLink>
                <NavLink to="/admin/logs" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                    <RiShieldKeyholeLine /> Logs de Auditoría
                </NavLink>

                <div className={styles.navGroupLabel}>GESTIÓN</div>
                <NavLink to="/admin/users" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                    <RiUserSettingsLine /> Base de Usuarios
                </NavLink>
                <NavLink to="/admin/devices" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
                    <MdOutlineDevicesOther /> Base de Dispositivos
                </NavLink>
            </nav>

            <div className={styles.sidebarFooter}>
                <button onClick={handleLogout} className={styles.logoutAction}>
                    <MdLogout /> 
                    <span>FINALIZAR SESIÓN</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminNavbar;