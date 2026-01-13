import React, { useState, useEffect } from 'react';
import styles from './CountOption.module.scss';
import Form from '../../common/form/Form.jsx';
import Button from '../../common/button/ButtonForm.jsx';
import DeviceLink from './deviceLink/DeviceLink';
import { db, rtdb } from '../../../firebase/firebase-config.js';
import { useAuth } from '../../../context/AuthContext';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, where, query, arrayRemove } from 'firebase/firestore';
import { getDatabase, ref, onValue, update } from "firebase/database";
import { MdSettingsInputAntenna, MdScale, MdDevices, MdDeleteSweep, MdWifiTethering } from 'react-icons/md';
import toast, { Toaster } from 'react-hot-toast';

const GeneralOptions = () => {
    const { currentUser } = useAuth();
    const [calibratePortion, setCalibratePortion] = useState('');
    const [userDevices, setUserDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [commands, setCommands] = useState(null);
    const [status, setStatus] = useState(null);

    //RTDB
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'devicesPet'),
            where('linked_user_id', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserDevices(devices);
            setLoadingDevices(false);
        });

        if (currentUser.deviceId) {
            const dbRT = getDatabase();
            const portionRef = ref(dbRT, `${currentUser.deviceId}/commands`);
            const wifiRef = ref(dbRT, `${currentUser.deviceId}/status`);

            const unsubscribePortion = onValue(portionRef, (snapshot) => setCommands(snapshot.val()));
            const unsubscribeWifi = onValue(wifiRef, (snapshot) => setStatus(snapshot.val()));

            return () => {
                unsubscribe();
                unsubscribePortion();
                unsubscribeWifi();
            };
        }
        return () => unsubscribe();
    }, [currentUser]);

    const handleWeightCalibrate = async (e) => {
        e.preventDefault();

        const activeDeviceId = currentUser?.deviceId;
        if (!activeDeviceId) {
            toast.error("Selecciona un equipo activo primero",  {className: 'custom-toast-error'});
            return;
        }
        
        const portionValue = parseFloat(calibratePortion);

        if (!calibratePortion || isNaN(portionValue) || portionValue <= 0 || portionValue > 500) {
            toast.error("Ingresa un peso válido (1g - 500g)",  {className: 'custom-toast-error'});
            return;
        }

        try {
            const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);
            await update(deviceRefRTDB, {
                weight_portion: String(calibratePortion),
            });

            const logData = {
            action: 'CALIBRATE_FOOD',
            userId: currentUser.uid,
            deviceId: activeDeviceId,
            timestamp: serverTimestamp(),
            details: `Calibración ajustada a ${calibratePortion}g`,
            type: 'info',
            category: 'CONFIG'
        };

        await addDoc(collection(db, 'system_logs'), logData);

            toast.success("Calibración ajustada exitosamente", {className: 'custom-toast-success'});
            setCalibratePortion('');
        } catch (error) {
            console.error('Error al calibrar porción:', error);
            toast.error("Fallo al comunicar con el equipo", {className: 'custom-toast-error'});
        }
    }

    const handleSwitchDevice = async (deviceId) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { deviceId: deviceId });

            await addDoc(collection(db, 'system_logs'), {
                action: 'SWITCH_ACTIVE_DEVICE',
                userId: currentUser.uid,
                deviceId: deviceId,
                timestamp: serverTimestamp(),
                details: `Usuario cambió el control activo al equipo ${deviceId}`,
                type: 'info'
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

            await update(ref(rtdb, `${deviceId}`), { 
                ownerUid: null,
                "commands/dispense_manual": "desactivado" 
            });

            // Actualización en Firestore
            await updateDoc(deviceRef, {
                linked_user_id: "null",
                status_system: 'inactive'
            });

            const updateData = { devices: arrayRemove(deviceId) };
            if (currentUser.deviceId === deviceId) {
                updateData.deviceId = null;
            }
            await updateDoc(userRef, updateData);

            // Auditoría
            await addDoc(collection(db, 'system_logs'), {
                type: "info",
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

    const calibratePortionFields = [{
        type: 'number', 
        placeholder: 'Ej: 10',
        value: calibratePortion,
        onChange: (e) => setCalibratePortion(e.target.value),
        required: true,
    }];


    return (
    <div className={styles.containerConfig}>
        <div className={styles.contentGrid}>

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
        <Toaster position="bottom-right" />
    </div>
    );
};

export default GeneralOptions;