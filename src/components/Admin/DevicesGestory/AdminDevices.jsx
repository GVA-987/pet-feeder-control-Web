import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database'; // Importar utilidades de RTDB
import { collection, getDocs } from 'firebase/firestore';
import { db, rtdb } from '../../../firebase/firebase-config';
import styles from './AdminDevices.module.scss';
import { MdOutlineDevicesOther, MdScale, MdSignalWifiStatusbar4Bar} from "react-icons/md";

const AdminDevicesPage = () => {
    const [devicesData, setDevicesData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const devicesRef = ref(rtdb, '/'); 
    
    const unsubscribeRTDB = onValue(devicesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convertimos el objeto en array aquí mismo para evitar errores de renderizado
            const formattedList = Object.keys(data).map(deviceId => ({
                id: deviceId,
                // Entramos a data[deviceId].status porque ahí están foodLevel, online, etc.
                ...data[deviceId].status, 
                ownerUid: data[deviceId].ownerUid
            }));
            
            setDevicesData(formattedList);
        } else {
            setDevicesData([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error de RTDB:", error);
        setLoading(false);
    });

    return () => unsubscribeRTDB();
}, []);

    // Convertimos el objeto de RTDB en una lista para el renderizado
    const devicesList = Object.keys(devicesData).map(deviceId => ({
        id: deviceId,
        ...devicesData[deviceId].status,
        ownerUid: devicesData[deviceId].ownerUid
    }));

    if (loading) return <div className={styles.loader}>Sincronizando con RTDB...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Monitor de Dispositivos IoT</h2>
                <p>Estado de telemetría en tiempo real desde Realtime Database.</p>
            </header>

            <div className={styles.deviceGrid}>
                {devicesList.map(device => (
                    <div key={device.id} className={styles.deviceCard}>
                        <div className={styles.cardHeader}>
                            <MdOutlineDevicesOther className={styles.deviceIcon} />
                            <div className={styles.titleArea}>
                                <h3>{device.id}</h3>
                                <span className={device.online === "conectado" ? styles.statusOnline : styles.statusOffline}>
                                    {device.online === "conectado" ? "● Online" : "● Offline"}
                                </span>
                            </div>
                        </div>

                        <div className={styles.telemetry}>
                            <div className={styles.dataPoint}>
                                <MdScale />
                                <span>Comida: {Math.round(device.foodLevel)}%</span>
                                <div className={styles.barContainer}>
                                    <div 
                                        className={styles.bar} 
                                        style={{ width: `${device.foodLevel}%`, backgroundColor: device.foodLevel < 20 ? '#e74c3c' : '#2ecc71' }}
                                    ></div>
                                </div>
                            </div>
                            <div className={styles.dataPoint}>
                                <MdSignalWifiStatusbar4Bar />
                                <span>Señal (RSSI): {device.rssi} dBm</span>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <small>Última actualización: {new Date(device.lastUpdate).toLocaleString()}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDevicesPage;