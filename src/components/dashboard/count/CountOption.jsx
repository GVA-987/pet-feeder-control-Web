// src/components/configuration/GeneralOptions.jsx

import React, { useState, useEffect } from 'react';
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove } from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../..//../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import styles from './CountOption.module.scss';
import Form from '../../common/form/Form.jsx';

const GeneralOptions = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({ name: '', lastname: '', number: '', email: '', password: '' });
    const [petData, setPetData] = useState({ name: '', breed: '', age: '', weight: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [confirmPassword, setConfirmPassword] = useState('');
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
                        email: useDataDB.email || '',
                        // password: useDataDB.password || ''
                    });
                    setPetData(useDataDB.pets || { name: '', breed: '', age: '', weight: '' });
                }
            }catch (e) {
                console.error('Error al obtener los datos del usuario:', e);
            }finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, [currentUser]);

    // Actualizar datos de la mascota
    const handleAddDatePet = async (e) => {
        e.preventDefault();
        setIsLoading(true);

            try {
                const petRef = doc(db, 'users', currentUser.uid);
                await updateDoc(petRef, {
                    pets: {
                        name: petData.name,
                        breed: petData.breed,
                        age: petData.age,
                        weight: petData.weight
                    }
                });
                alert('Datos de la mascota actualizados con éxito.');
            }catch (error) {
                console.error('Error al guardar los datos de la mascota:', error);
                alert('Hubo un error al guardar los datos de la mascota.');
            }
            finally {
                setIsLoading(false);
        }
    }

    // Actualizar datos del usuario
    const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            nombre: userData.name,
            apellido: userData.lastname,
            celular: userData.number,
            email: userData.email,
            // password: userData.password,
        });

        alert("Datos de usuario actualizados con éxito!");

    } catch (error) {
        console.error('Error al actualizar los datos del usuario:', error);
        alert('Hubo un error al actualizar los datos del usuario.');

        if (error.code === 'permission-denied') {
            alert('Permiso denegado para actualizar. Contacta al administrador.');
        }
    } finally {
        setIsLoading(false);
    }
};

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
            type: 'number',
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
        },
        {
            label: 'Contraseña',
            type: 'password',
            placeholder: '',
            name: 'password',
            // value: userData.password,
            // onChange: (e) => setUserData({ ...userData, password: e.target.value }),
            // onChange: (e) => setPassword(e.target.value),
            required: false,
        },
        {
            type: 'password',
            placeholder: 'Confirma tu contraseña',
            // value: password,
            // onChange: (e) => setPassword(e.target.value),
            // value: confirmPassword,
            // onChange: (e) => setConfirmPassword(e.target.value),
            required: false,
            iconType: 'password',
        }
    ]
    const fieldsPet = [
        {
            label: 'Nombre',
            type: 'text',
            placeholder: '',
            value: petData.name,
            onChange: (e) => setPetData({ ...petData, name: e.target.value }),
            required: true,
        },
        {
            label: 'Raza',
            type: 'text',
            placeholder: '',
            value: petData.breed,
            onChange: (e) => setPetData({ ...petData, breed: e.target.value }),
            required: true,
        },
        {
            label: 'Edad',
            type: 'text',
            placeholder: '',
            value: petData.age,
            onChange: (e) => setPetData({ ...petData, age: e.target.value }),
            required: true,
        },
        {
            label: 'Peso',
            type: 'text',
            placeholder: '',
            value: petData.weight,
            onChange: (e) => setPetData({ ...petData, weight: e.target.value }),
            required: true,
        }
    ]
    return (
    <div className={styles.containerCount}>
        <h2>Opciones Generales</h2>
        <div className={styles.cardForm}>
            <h3>Datos del Usuario</h3>
            {loading ? (
            <p>Cargando datos del usuario...</p>
            ) : (
            <Form
                fields={fieldsUser}
                onSubmit={handleUpdateUser}
                submitButtonText={loading ? <div className={styles['circle-loader']}></div> : "Actualizar Datos del Usuario"}
                isLoading={isLoading}
            />
            )}
        </div>
        <div className={styles.cardForm}>
            <h3>Datos de la Mascota</h3>
            {loading ? (
            <p>Cargando datos de la mascota...</p>
            ) : (
            <Form
                fields={fieldsPet}
                // onSubmit={handleUpdateName}
                onSubmit={handleAddDatePet}
                submitButtonText={loading ? <div className={styles['circle-loader']}></div> : "Actualizar Datos de la Mascota"}
                isLoading={isLoading}
            />
            )}
        </div>
    </div>
    );
};

export default GeneralOptions;