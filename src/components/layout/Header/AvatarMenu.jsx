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
import { IoPersonOutline, IoPawOutline, IoLogOutOutline, IoChevronDown } from "react-icons/io5";
import toast from 'react-hot-toast';
// import Config from '../../confGen/conf/conf';

const AvatarMenu = ({ user }) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

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
                    <div className={styles.logoutModalContainer}>
                        <p style={{ opacity: 0.8, lineHeight: '1.5' }}>
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
            <button className={styles.avatarPill} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.avatarImg}>
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="profile" />
                    ) : (
                        getInitial(currentUser?.nombre)
                    )}
                </div>
                <span className={styles.userName}>{currentUser?.nombre || 'Usuario'}</span>
                <IoChevronDown 
                    className={styles.dropdownIcon} 
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                />
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu}> 
                    <button onClick={() => openModal('user')}>
                        <IoPersonOutline /> Mi Cuenta
                    </button>
                    <button onClick={() => openModal('mascota')}>
                        <IoPawOutline /> Perfil Mascota
                    </button>

                    <div className={styles.divider}></div>

                    <button onClick={() => openModal('logout')} className={styles.logoutButton}>
                        <IoLogOutOutline /> Cerrar Sesión
                    </button>
                </div>
            )}
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
    );
};

export default AvatarMenu;