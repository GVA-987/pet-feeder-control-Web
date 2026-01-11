import react, { useState, useEffect } from 'react';
import Form from '../../common/form/Form';
import { getDoc, doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './configPet.module.scss';

const ConfigPet = () => {

    const { currentUser } = useAuth();
    const [petData, setPetData] = useState({ name: '', breed: '', age: '', weight: '' });
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPetData = async () => {
            if (!currentUser?.uid) return;
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const dbData = userDocSnap.data();
                    // Si ya existen datos de mascota, los cargamos; si no, dejamos el estado inicial
                    if (dbData.pets) {
                        setPetData(dbData.pets);
                    }
                }
            } catch (e) {
                console.error(e);
                toast.error('Error al cargar datos de la mascota');
            } finally {
                setLoading(false);
            }
        };
        fetchPetData();
    }, [currentUser]);

    const handleUpdatePet = async (e) => {
            e.preventDefault();
            setIsLoading(true);
            try {
                const petRef = doc(db, 'users', currentUser.uid);

                
                await updateDoc(petRef, {
                    pets: {
                        name: petData.name,
                        breed: petData.breed,
                        age: petData.age,
                        weight: petData.weight,
                        updateAt: serverTimestamp()
                    }
                });

                await addDoc(collection(db, "system_logs"), {
                    action: "PET_DATA_UPDATED",
                    userId: currentUser.uid,
                    timestamp: serverTimestamp(),
                    details: `Actualizados datos de: ${petData.name}`,
                    category: 'config',
                    metadata: {
                        platform: 'Web App',
                        version: '1.0.2',
                        userAgent: navigator.userAgent
                    }
                });
                toast.success('¡Datos de la mascota guardados!', {
                    icon: '🐶',
                    position: 'bottom-right',
                    className: 'custom-toast-success'
                });
            }catch (error) {
                console.error('Error:', error);
                toast.error('No se pudieron guardar los cambios', {className: 'custom-toast-error'});
            }
            finally {
                setIsLoading(false);
            }
        }

    const fieldsPet = [
        {
            label: 'Nombre',
            type: 'text',
            placeholder: 'Nombre de Mascota',
            value: petData.name,
            onChange: (e) => setPetData({ ...petData, name: e.target.value }),
            required: true,
        },
        {
            label: 'Raza',
            type: 'text',
            placeholder: 'Raza',
            value: petData.breed,
            onChange: (e) => setPetData({ ...petData, breed: e.target.value }),
            required: true,
        },
        {
            label: 'Edad',
            type: 'number',
            placeholder: 'Edad',
            value: petData.age,
            onChange: (e) => setPetData({ ...petData, age: e.target.value }),
            required: true,
        },
        {
            label: 'Peso (Kg)',
            type: 'number',
            placeholder: 'Peso de la Mascota',
            value: petData.weight,
            onChange: (e) => setPetData({ ...petData, weight:e.target.value }),
            required: true,
        }
    ]
    if (loading) return <div className={styles.loader}>Cargando...</div>;
    return (
        <div className={styles.configBox}>
            <div className={styles.header}>
                <p>Gestiona los datos de tu Mascota.</p>
            </div>
            
            <Form
                fields={fieldsPet}
                onSubmit={handleUpdatePet}
                submitButtonText={isLoading ? "Actualizando..." : "Actualizar Datos de la Mascota"}
                isLoading={isLoading}
            />
        </div>
    );
}
export default ConfigPet;