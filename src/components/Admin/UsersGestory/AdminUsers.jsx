import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import styles from './AdminUsers.module.scss';
import { 
    RiUserSearchLine, RiShieldUserLine, RiSettings4Line, 
    RiDeviceLine, RiMailLine, RiTimeLine 
} from "react-icons/ri";
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('email', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleAdminRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            toast.success(`Rol actualizado a ${newRole.toUpperCase()}`);
        } catch (e) {
            toast.error("Error al cambiar privilegios");
        }
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className={styles.loader}>Cargando directorio...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h2><RiShieldUserLine /> Directorio de Usuarios</h2>
                    <p>Gestión de permisos y vinculación de hardware</p>
                </div>
                <div className={styles.searchBox}>
                    <RiUserSearchLine />
                    <input 
                        type="text" 
                        placeholder="Buscar por email o nombre..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.userGrid}>
                {filteredUsers.map(user => (
                    <div key={user.id} className={styles.userCard}>
                        <div className={styles.cardTop}>
                            <div className={styles.avatar}>
                                {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                            </div>
                            <div className={styles.basicInfo}>
                                <h4>{user.name || 'Sin nombre'}</h4>
                                <span><RiMailLine /> {user.email}</span>
                            </div>
                            <div className={`${styles.roleBadge} ${styles[user.role || 'user']}`}>
                                {user.role || 'user'}
                            </div>
                        </div>

                        <div className={styles.cardStats}>
                            <div className={styles.statItem}>
                                <RiDeviceLine />
                                <div>
                                    <small>Dispositivo</small>
                                    <p>{user.deviceId || 'No vinculado'}</p>
                                </div>
                            </div>
                            <div className={styles.statItem}>
                                <RiTimeLine />
                                <div>
                                    <small>Miembro desde</small>
                                    <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            <button 
                                className={styles.btnRole}
                                onClick={() => toggleAdminRole(user.id, user.role)}
                            >
                                <RiSettings4Line /> {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminUsersPage;