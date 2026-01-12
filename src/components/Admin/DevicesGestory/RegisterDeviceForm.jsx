import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import styles from './AdminDevices.module.scss';
import toast from 'react-hot-toast';

const RegisterDeviceForm = ({ onSuccess }) => {
    const [deviceId, setDeviceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!deviceId.trim()) return toast.error("El ID es obligatorio");

        setIsSubmitting(true);
        try {
            // Documento profesional de hardware "virgen"
            await setDoc(doc(db, "devicesPet", deviceId.trim()), {
                deviceId: deviceId.trim(),
                status: "disconnected",      // Estado de red
                lifecycle: "factory",        // Estado de inventario
                linked_user_id: null,        // Sin dueño
                foodLevel: 0,
                rssi: 0,
                version: "1.0.0",
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });

            toast.success("Equipo provisionado en sistema");
            setDeviceId('');
            onSuccess(); // Cierra el modal
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar hardware");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.modalForm}>
            <div className={styles.inputGroup}>
                <label>ID del Dispositivo (MAC o Serial)</label>
                <input 
                    type="text" 
                    placeholder="Ej: ESP-PET-99B2..." 
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                />
                <small>Este ID debe coincidir con el programado en el código del ESP32.</small>
            </div>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Dar de Alta Equipo'}
            </button>
        </form>
    );
};

export default RegisterDeviceForm;