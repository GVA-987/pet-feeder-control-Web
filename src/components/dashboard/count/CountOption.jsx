// src/components/configuration/GeneralOptions.jsx

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../..//../context/AuthContext';
import styles from './CountOption.module.scss';

const GeneralOptions = () => {
    const { currentUser } = useAuth();
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(true);

  // Escuchar el nombre del dispositivo en tiempo real
    useEffect(() => {
    if (currentUser?.deviceId) {
        const deviceRef = doc(db, 'devices', currentUser.deviceId);
    
        const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
        if (docSnap.exists()) {
            setDeviceName(docSnap.data().name || '');
        }
        setLoading(false);
        });

        return () => unsubscribe();
    }
    }, [currentUser]);

    const handleNameChange = (e) => {
    setDeviceName(e.target.value);
    };

    const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!currentUser?.deviceId || !deviceName.trim()) return;

    try {
        const deviceRef = doc(db, 'devices', currentUser.deviceId);
        await updateDoc(deviceRef, {
        name: deviceName
        });
        alert('Nombre del dispositivo actualizado con éxito.');
    } catch (error) {
        console.error('Error al actualizar el nombre:', error);
        alert('Hubo un error al actualizar el nombre del dispositivo.');
    }
    };

    return (
    <div className={styles.containerCount}>
        <h2>Opciones Generales</h2>
        {loading ? (
        <p>Cargando opciones...</p>
        ) : (
        <form onSubmit={handleUpdateName} className={styles.formDevice}>
            <label htmlFor="deviceName">Nombre</label>
            <input
            id="deviceName"
            type="text"
            value={deviceName}
            onChange={handleNameChange}
            placeholder
            />
            <label htmlFor="deviceName">Apellido</label>
            <input
            id="deviceName"
            type="text"
            value={deviceName}
            onChange={handleNameChange}
            placeholder
            />
            <label htmlFor="deviceName">Email</label>
            <input
            id="deviceName"
            type="text"
            value={deviceName}
            onChange={handleNameChange}
            placeholder
            />
            <label htmlFor="deviceName">Contraseña</label>
            <input
            id="deviceName"
            type="text"
            value={deviceName}
            onChange={handleNameChange}
            placeholder
            />
            <button type="submit">Guardar</button>
        </form>
        )}
    </div>
    );
};

export default GeneralOptions;