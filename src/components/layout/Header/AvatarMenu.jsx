// src/layout/Header/AvatarMenu.jsx (Componente Único)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AvatarMenu.module.scss'; 
import { auth, db } from '../../../firebase/firebase-config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../common/modal/Modal';
import ConfigUser from '../../confGen/userProfile/configUser';
import ConfigPet from '../../confGen/petProfile/configPet';
import {serverTimestamp, collection, addDoc} from 'firebase/firestore';
import toast from 'react-hot-toast';
// import Config from '../../confGen/conf/conf';

const AvatarMenu = ({ user }) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const userName = user?.displayName || 'Usuario';
    const avatarUrl = user?.avatarUrl || '/avatars/default_1.png';

    const closeModal = () => setModalContent(null);
    const openModal = (type) => {
        setModalContent(type);
        setIsOpen(false); 
    };

    const handleLogout = async () => {
        try{
            if (currentUser){
                await addDoc(collection(db, "system_logs"), {
                    action: "USER_LOGOUT",
                    category: "AUTH",
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    timestamp: serverTimestamp(),
                    details: "Sesión cerrada voluntariamente",
                    metadata: {
                        platform: "Web-App",
                        userAgent: navigator.userAgent
                    }
                });
            }
            await signOut(auth);
            toast.success('Sesión cerrada', { className: 'custom-toast-success' });
            navigate('/login');
        } catch(e) {
            console.log('Error al cerrar sesión:', { className: 'custom-toast-error' }, e);
            toast.error('Error al salir');
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false); 
    };
    
    const confirmLogout = () => {
        setIsModalOpen(true);
        setIsOpen(false);
    };

    const renderModalContent = (type) => {
    switch (type) {
        case 'logout':
            return {
                title: 'Confirmación de Salida',
                size: 'small',
                body: (
                    <>
                        <p>¿Estás seguro de que quieres salir de tu cuenta? Se cerrará tu sesión en todos los dispositivos.</p>
                        <div className={styles.modalActions}>
                            <button onClick={closeModal} className={`${styles.modalActionButton} ${styles.secondaryButton}`}>Cancelar</button>
                            <button onClick={handleLogout} className={`${styles.modalActionButton} ${styles.primaryButton}`}>Sí, Cerrar Sesión</button>
                        </div>
                    </>
                )
            };
        case 'user':
            return {
                title: 'Editar Perfil de Usuario',
                size: 'medium',
                body: <ConfigUser user={user} onClose={closeModal} />
            };
        case 'mascota':
            return {
                title: 'Editar Perfil de Mascota',
                size: 'medium',
                // body: <p>Aquí va el formulario de Configuración de datos de la mascota.</p>
                body: <ConfigPet user={user} onClose={closeModal} />
            };
        case 'general':
            return {
                title: 'Configuración General de la Aplicación',
                size: 'medium',
                body: <p>formulario de Configuración General (Idioma, Notificaciones).</p>
            };
        default:
            return { title: '', size: 'medium', body: null };
    }
};

const content = renderModalContent(modalContent);

    return (
        <div className={styles.contentMenu}>
            <div style={{ position: 'relative' }}>
            
            <button 
                className={styles.avatarPill} 
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className={styles.avatarImg}>
                    <img src={avatarUrl} alt="." /> 
                </div>

                <p className={styles.userName}>{userName}</p>

                <span 
                    className={styles.dropdownIcon} 
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    ▼
                </span>
            </button>

            {/* 2. Menú Dropdown (Opciones) */}
            {isOpen && (
                <div className={styles.dropdownMenu}> 
                    <button onClick={() => openModal('user')}>Mi Perfil / Mi Cuenta</button>
                    <button onClick={() => openModal('mascota')}>Perfil de Mascota</button>
                    <button onClick={() => openModal('general')}>Configuración General</button>
                    
                    <div className={styles.divider}></div>
                    
                    <button onClick={() => openModal('logout')} className={styles.logoutButton}>
                        Cerrar Sesión
                    </button>
                </div>
            )}
            
            {/* 3. Modal Reutilizable */}
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
        </div>

        </div>
    );
};

export default AvatarMenu;