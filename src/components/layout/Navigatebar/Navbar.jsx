import React from "react";
import { NavLink } from "react-router-dom";
import { IoHomeOutline, IoLogOutOutline } from "react-icons/io5";
import { HiOutlineAdjustments } from "react-icons/hi";
import { GrHistory, GrConfigure } from "react-icons/gr";
import { auth } from "../../../firebase/firebase-config";
import { signOut } from "firebase/auth";
import petLogo from "../../../assets/petlog.png";
import styles from "./Navbar.module.scss";

const Navbar = () => {
  const handleLogout = () => signOut(auth);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src={petLogo} alt="Logo" />
        <div className={styles.logoText}>
          <span>Pet-GVA</span>
          <small>Smart Feeder</small>
        </div>
      </div>

      <nav className={styles.navPet}>
        <ul>
          <li>
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <IoHomeOutline /> <span>Inicio</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ConfDevice"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <HiOutlineAdjustments /> <span>Horarios</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <GrHistory /> <span>Actividad</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/count"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              <GrConfigure /> <span>Ajustes</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className={styles.footerNav}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <IoLogOutOutline /> <span>Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
