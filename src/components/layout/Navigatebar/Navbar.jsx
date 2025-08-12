import React from 'react';
import { signOut } from 'firebase/auth'; // Importamos la función signOut
import { auth } from '../../../firebase/firebase-config'; // Tu objeto de autenticación
import { useAuth } from '../../../context/AuthContext'; // Para saber si hay un usuario
import { FaSignOutAlt } from 'react-icons/fa';
import { IoHomeOutline } from "react-icons/io5";
import { HiOutlineAdjustments } from "react-icons/hi";
import { GrHistory } from "react-icons/gr";
import { VscAccount } from "react-icons/vsc";
import { NavLink, useNavigate } from 'react-router-dom';
import petLogo from '../../../assets/petlog.png';
import styles from './Navbar.module.scss';

const Navbar = () => {

    const { currentUser } = useAuth();
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
                    <NavLink href="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><IoHomeOutline /> Inicio</NavLink>
                </li>
                <li>
                    <NavLink href="#" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><HiOutlineAdjustments /> Configuracion</NavLink>
                </li>
                <li>
                    <NavLink href="#" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><GrHistory /> Historial</NavLink>
                </li>
                <li>
                    <NavLink href="#" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}><VscAccount /> Cuenta</NavLink>
                </li>

            </ul>
        {currentUser && <button className={styles.logoutButton} onClick={handleLogout}><FaSignOutAlt /> Cerrar sesion</button>}
        </nav>
    </aside>
    );
};

export default Navbar;