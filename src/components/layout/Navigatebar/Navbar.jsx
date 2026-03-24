import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoHomeOutline, IoLogOutOutline } from "react-icons/io5";
import { HiOutlineAdjustments } from "react-icons/hi";
import { GrHistory, GrConfigure } from "react-icons/gr";
import { auth, db } from "../../../firebase/firebase-config";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import Modal from "../../common/modal/Modal";
import toast from "react-hot-toast";
import petLogo from "../../../assets/petlog.png";
import styles from "./Navbar.module.scss";

const Navbar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState(null);

  const closeModal = () => setModalContent(null);

  const openModal = (type) => {
    setModalContent(type);
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await addDoc(collection(db, "system_logs"), {
          action: "USER_LOGOUT",
          category: "AUTH",
          userId: currentUser.uid,
          userEmail: currentUser.email,
          timestamp: serverTimestamp(),
          details: "Sesión cerrada voluntariamente",
          metadata: {
            platform: "Web-App",
            userAgent: navigator.userAgent,
          },
        });
      }
      await signOut(auth);
      toast.success("Sesión cerrada", { className: "custom-toast-success" });
      navigate("/login");
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      toast.error("Error al salir");
    }
  };

  const renderModalContent = (type) => {
    switch (type) {
      case "logout":
        return {
          title: "Confirmación de Salida",
          size: "small",
          body: (
            <div className={styles.logoutModalContainer}>
              <p style={{ opacity: 0.8, lineHeight: "1.5" }}>
                ¿Estás seguro de que quieres cerrar tu sesión?
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={closeModal}
                  className={`${styles.modalActionButton} ${styles.secondaryButton}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className={`${styles.modalActionButton} ${styles.primaryButton}`}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ),
        };
      default:
        return { title: "", size: "medium", body: null };
    }
  };

  const content = renderModalContent(modalContent);

  return (
    <>
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
                  isActive
                    ? `${styles.navLink} ${styles.active}`
                    : styles.navLink
                }
              >
                <IoHomeOutline /> <span>Inicio</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ConfDevice"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.active}`
                    : styles.navLink
                }
              >
                <HiOutlineAdjustments /> <span>Horarios</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.active}`
                    : styles.navLink
                }
              >
                <GrHistory /> <span>Actividad</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/count"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.active}`
                    : styles.navLink
                }
              >
                <GrConfigure /> <span>Ajustes</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={styles.footerNav}>
          {/* Aquí disparamos el modal */}
          <button
            onClick={() => openModal("logout")}
            className={styles.logoutBtn}
          >
            <IoLogOutOutline /> <span>Salir</span>
          </button>
        </div>
      </aside>

      {modalContent && (
        <Modal
          isOpen={!!modalContent}
          onClose={closeModal}
          title={content.title}
          size={content.size}
        >
          {content.body}
        </Modal>
      )}
    </>
  );
};

export default Navbar;
