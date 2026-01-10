// src/components/configuration/GeneralOptions.jsx

import React, { useState, useEffect } from 'react';
import styles from './CountOption.module.scss';
import Form from '../../common/form/Form.jsx';
import Button from '../../common/button/ButtonForm.jsx';
import DeviceLink from './deviceLink/DeviceLink';
import {db, rtdb} from '../../../firebase/firebase-config.js';
import {useAuth} from '../../../context/AuthContext'
import {doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, where, query, orderBy, arrayRemove} from 'firebase/firestore';
import { getDatabase, ref, onValue, off, update as updateRTDB } from "firebase/database";
import toast from 'react-hot-toast';

const GeneralOptions = () => {
    const { currentUser } = useAuth();
    const [calibratePortion, setCalibratePortion] = useState('');
    const [weightPortion, setWeightPortion] = useState('');
    const [rtdbData, setRtdbData] = useState(null);
    const [commands, setCommands] = useState(null);
    const [userDevices, setUserDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [status, setStatus] = useState(null);

    //RTDB
    useEffect (() => {
        if (!currentUser && !currentUser.deviceId) return;

        const q = query(
            collection(db, 'devicesPet'),
            where('linked_user_id', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const devices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserDevices(devices);
            setLoadingDevices(false);
        });

        const dbRT = getDatabase();
        const portionRef = ref(dbRT, `${currentUser.deviceId}/commands`);
        const wifiRef = ref(dbRT, `${currentUser.deviceId}/status`);

        const unsubscribePortion = onValue(portionRef, (snapshot) => {
            setCommands(snapshot.exists() ? snapshot.val() : null);
        });

        const unsubscribeWifi = onValue(wifiRef, (snapshot) => {
            setStatus(snapshot.exists() ? snapshot.val() : null);
        });
        return () => {
            unsubscribePortion();
            unsubscribe();
            unsubscribeWifi();
        };
    }, [currentUser]);

    const handleWeightCalibrate = async (e) => {
        e.preventDefault();

        if (!currentUser && !currentUser.deviceId) return;

        try {
            const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);
            await update(deviceRefRTDB, {
                weight_portion: String(calibratePortion),
            });

            setCalibratePortion('');
        } catch (error) {
            console.error('Error al calibrar porción:', error);
        }
    }

    const handleSwitchDevice = async (deviceId) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { deviceId: deviceId });
            
            // Registramos en auditoría el cambio de foco
            await addDoc(collection(db, 'system_logs'), {
                action: 'SWITCH_ACTIVE_DEVICE',
                userId: currentUser.uid,
                deviceId: deviceId,
                timestamp: serverTimestamp(),
                details: `Usuario cambió el control activo al equipo ${deviceId}`
            });

            toast.success(`Controlando: ${deviceId}`, { className: 'custom-toast' });
        } catch (error) {
            toast.error('Error al cambiar de equipo');
        }
    };

    const handleUnlinkDevice = async (deviceId) => {
        if (!window.confirm(`¿Estás seguro de desenlazar el equipo ${deviceId}?`)) return;

        try {
            const deviceRef = doc(db, 'devicesPet', deviceId);
            const userRef = doc(db, 'users', currentUser.uid);

            // Actualización en Firestore
            await updateDoc(deviceRef, {
                linked_user_id: "null",
                status_system: 'inactive'
            });

            // Si el equipo que quitamos era el activo, limpiamos el deviceId del usuario
            const updateData = { devices: arrayRemove(deviceId) };
            if (currentUser.deviceId === deviceId) {
                updateData.deviceId = null;
            }
            await updateDoc(userRef, updateData);

            // RTDB: Limpiar el dueño
            await updateRTDB(ref(rtdb, `${deviceId}`), { ownerUid: null });

            // Auditoría
            await addDoc(collection(db, 'system_logs'), {
                action: 'DEVICE_UNLINKED',
                category: 'SECURITY',
                userId: currentUser.uid,
                deviceId: deviceId,
                timestamp: serverTimestamp(),
                details: 'Usuario eliminó el equipo de su cuenta',
                metadata: {
                    previous_owner: currentUser.email
                },
                userAgent: navigator.userAgent
            });

            toast.success('Equipo desenlazado correctamente', { className: 'custom-toast' });
        } catch (error) {
            console.error(error);
            toast.error('Error al desenlazar el equipo');
        }
    };

    const calibratePortionFields = [
        {
            type: 'text',
            placeholder: 'Porcion a Calibrar (g)',
            value: calibratePortion,
            onChange: (e) => setCalibratePortion(e.target.value),
            required: true,
        }
    ]


    return (
    <div className={styles.containerConfig}>
        <div className={styles.contentGrid}>

            {/* Tarjeta de Dispositivos */}
            <div className={styles.card}>
                <h3>Dispositivos</h3>
                <div className={styles.containerDeviceList}>
                    <DeviceLink />
                    <div className={styles.deviceList}>
                        {userDevices.length === 0 ? (
                            <p>No tienes equipos vinculados.</p>
                        ) : (
                            userDevices.map((device) => (
                                <div 
                                    key={device.id} 
                                    className={`${styles.deviceItem} ${currentUser.deviceId === device.id ? styles.active : ''}`}
                                >
                                    <div className={styles.deviceInfoText}>
                                        <strong>{device.id}</strong>
                                        <span>{device.online === 'conectado' ? '🟢 Conectado' : '⚪ Desconectado'}</span>
                                    </div>
                                    <Button
                                    onClick={() => handleSwitchDevice(device.id)}
                                    disabled={currentUser.deviceId === device.id}
                                    >
                                        {currentUser.deviceId === device.id ? 'Activo' : 'Seleccionar'}
                                    </Button>
                                    <button 
                                        onClick={() => handleUnlinkDevice(device.id)}
                                        className={styles.btnUnlink}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Tarjeta 2 Calibracion */}
            <div className={styles.card}>
                <h3>Ajustar de porcion</h3>
                <p>Define cuántos gramos equivale a una unidad de Comida.</p>
                <p className={styles.deviceInfo}><label>Porción actual:</label><strong>1 porcion = {commands?.weight_portion || 'fija Una Medida'} g.</strong></p>
                <Form 
                    fields={calibratePortionFields}
                    onSubmit={handleWeightCalibrate}
                    submitButtonText= "Calibrar"
                />
            </div>

            {/* Tarjeta 3 Wi-Fi */}
            <div className={styles.card}>
                <h3>Conectividad</h3>
                <p>Revisa la conexión Wi-Fi de tu dispositivo.</p>
                <p className={styles.deviceInfo}><label>Nombre de Wi-Fi:</label><strong>{status?.ssid || 'No disponible'}</strong></p>
                <p className={styles.deviceInfo}><label>Señal:</label><strong>{status?.rssi || 'No disponible'} dBm</strong></p>
                <Button>
                    Restaurar Wi-Fi
                </Button>
            </div>
        </div>
    </div>
    );
};

export default GeneralOptions;