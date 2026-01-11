import react, { useState, useEffect } from 'react';
import Form from '../../common/form/Form';
import { getDoc, doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import styles from './configUser.module.scss';


const ConfigUser = () => {
    
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({ name: '', lastname:'', number:'', email:'', password:'' });
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if(userDocSnap.exists()) {
                    const useDataDB = userDocSnap.data();
                    setUserData({
                        name: useDataDB.nombre || '',
                        lastname: useDataDB.apellido || '',
                        number: useDataDB.celular || '',
                        email: useDataDB.email || currentUser.email,
                    });
                }
            }catch (e) {
                toast.error('Error al cargar datos', { className: 'custom-toast-error' });
            }finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, [currentUser])

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                nombre: userData.name,
                apellido: userData.lastname,
                celular: userData.number,
                email: userData.email,
                lastUpdate: serverTimestamp()
            });

            if (userData.password && userData.password.length >= 6) {
                await updatePassword(currentUser, userData.password);
                toast.success('Contraseña actualizada');
            } else if (userData.password && userData.password.length < 6) {
                toast.error('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            await addDoc(collection(db, "system_logs"), {
                action: "USER_PROFILE_UPDATED",
                userId: currentUser.uid,
                timestamp: serverTimestamp(),
                details: "Actualización de datos personales y/o contraseña",
                metadata: {
                    platform: 'Web App',
                    version: '1.0.2',
                    userAgent: navigator.userAgent
                },
            });

            toast.success('Perfil actualizado con éxito', { position: 'bottom-right', className: 'custom-toast-success' });
            setUserData(prev => ({ ...prev, password: '' })); 
            // onClose();
        }catch (error){
            console.error('Error al actualizar los datos del usuario', error);

            if (error.code === 'auth/requires-recent-login') {
                toast.error('Por seguridad, cierra sesión y vuelve a entrar para cambiar la contraseña',  { className: 'custom-toast-error' });
            } else {
                toast.error('Error al actualizar los datos',  { className: 'custom-toast-error' });
            }
        }finally{
            setIsLoading(false);
        }
    }

    const fieldsUser = [
        {
            label: 'Nombre',
            type: 'text',
            placeholder: '',
            name: 'name',
            value: userData.name,
            onChange: (e) => setUserData({ ...userData, name: e.target.value }),
            required: true,
        },
        {
            label: 'Apellido',
            type: 'text',
            placeholder: '',
            name: 'apellido',
            value: userData.lastname,
            onChange: (e) => setUserData({ ...userData, lastname: e.target.value }),
            required: true,
            
        },
        {
            label: 'Celular',
            type: 'tel',
            placeholder: '',
            name: 'number',
            value: userData.number,
            onChange: (e) => setUserData({ ...userData, number: e.target.value }),
            required: true,
        },
        {
            label: 'Correo Electronico',
            type: 'email',
            placeholder: '',
            name: 'email',
            value: userData.email,
            onChange: (e) => setUserData({ ...userData, email: e.target.value }),
            required: true,
            disabled:true,
        },
        {
            label: 'Nueva Contraseña',
            type: 'password',
            name: 'password',
            value: userData.password,
            onChange: (e) => setUserData({ ...userData, password: e.target.value }),
            placeholder: 'Mínimo 6 caracteres',
        },
    ];
    if (loading) return <div className={styles.loader}>Cargando...</div>;

    return (
        <div className={styles.configBox}>
            <div className={styles.header}>
                <h2>Mi Perfil</h2>
                <p>Gestiona tu información personal y seguridad.</p>
            </div>
            
            <Form
                fields={fieldsUser}
                onSubmit={handleUpdate}
                submitButtonText={isLoading ? "Guardando..." : "Guardar Cambios"}
                isLoading={isLoading}
            />
        </div>
    );

}
export default ConfigUser;