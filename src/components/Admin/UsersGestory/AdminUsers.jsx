import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, rtdb } from '../../../firebase/firebase-config';
import { ref, set } from 'firebase/database';
import styles from './AdminUsers.module.scss';
import { RiUserSettingsLine, RiDeleteBin6Line } from "react-icons/ri";

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleToggleRole = async (userId, userEmail, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const confirmacion = window.confirm(`¿Deseas cambiar el rol de ${userEmail} a "${newRole}"?`);
    if (!confirmacion) return;

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });

        const adminRTDBRef = ref(rtdb, `admins/${userId}`);
        await set(adminRTDBRef, newRole === 'admin' ? true : null);

        setUsers(prevUsers => 
            prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
        );

        alert(`Rol actualizado a ${newRole} correctamente.`);

    } catch (error) {
        console.error("Error al cambiar rol:", error);
        alert("Error de permisos o conexión. Revisa la consola.");
    }
};

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersList);
            } catch (error) {
                console.error("Error cargando usuarios:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div className={styles.loader}>Cargando usuarios...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Gestión de Usuarios</h2>
                <p>Administra los permisos y revisa los dispositivos vinculados.</p>
            </header>

            <div className={styles.tableWrapper}>
                <table className={styles.userTable}>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Dispositivo ID</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className={styles.userName}>
                                    {user.name || 'Sin nombre'}
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span 
                                        className={`${styles.badge} ${styles[user.role || 'user']}`}
                                        onClick={() => handleToggleRole(user.id, user.email, user.role || 'user')}
                                        title="Haz clic para cambiar el rol"
                                    >
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td><code>{user.deviceId || 'No vinculado'}</code></td>
                                <td className={styles.actions}>
                                    <button className={styles.editBtn} title="Editar"><RiUserSettingsLine /></button>
                                    <button className={styles.deleteBtn} title="Eliminar"><RiDeleteBin6Line /></button>
                                </td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;