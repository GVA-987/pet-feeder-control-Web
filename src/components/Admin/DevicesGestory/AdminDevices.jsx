import React, { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, rtdb } from '../../../firebase/firebase-config';
import { collection, onSnapshot } from 'firebase/firestore';
import styles from './AdminDevices.module.scss';
import { 
    MdOutlineDevicesOther, MdScale, MdSignalWifiStatusbar4Bar, 
    MdWifiOff, MdRefresh, MdFastfood 
} from "react-icons/md";
import { RiBaseStationLine, RiFilter3Line } from "react-icons/ri";
import Modal from '../../common/modal/Modal';
import RegisterDeviceForm from './RegisterDeviceForm';
import toast from 'react-hot-toast';

const AdminDevicesPage = () => {
    const [devices, setDevices] = useState([]);
    const [filter, setFilter] = useState('all'); // all, online, offline, low-food
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    

    useEffect(() => {
        // 1. Escuchar Firestore (Inventario Maestro)
        const unsubFirestore = onSnapshot(collection(db, 'devicesPet'), (fsSnapshot) => {
            const fsDevices = fsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 2. Escuchar RTDB (Estado en Tiempo Real)
            const devicesRTDBRef = ref(rtdb, '/');
            onValue(devicesRTDBRef, (rtSnapshot) => {
                const rtData = rtSnapshot.val() || {};

                // 3. Cruzar datos: Prioridad Firestore + Datos dinámicos de RTDB
                const combinedList = fsDevices.map(fsDev => {
                    const rtDev = rtData[fsDev.id] || {};
                    return {
                        ...fsDev, // Datos base de Firestore (lifecycle, linked_user_id)
                        ...(rtDev.status || {}), // Sobrescribir con telemetría de RTDB si existe
                        ownerEmail: rtDev.ownerEmail || fsDev.ownerEmail || 'Sin dueño',
                        // Aseguramos que si no hay datos en RTDB, no rompa la UI
                        foodLevel: rtDev.status?.foodLevel ?? fsDev.foodLevel ?? 0,
                        online: rtDev.status?.online || 'desconectado'
                    };
                });

                setDevices(combinedList);
                setLoading(false);
            });
        });

        return () => unsubFirestore();
    }, []);

    const onSnapshotDevices = () => {
        return onValue(ref(rtdb, '/'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data)
                    .filter(key => key !== 'admins')
                    .map(id => ({
                        id,
                        ...data[id].status,
                        ownerEmail: data[id].ownerEmail || 'Sin dueño'
                    }));
                setDevices(list);
            }
            setLoading(false);
        });
    };

    const handleRemoteAction = async (deviceId, action) => {
        const actionRef = ref(rtdb, `${deviceId}/control`);
        try {
            await update(actionRef, { 
                command: action, 
                timestamp: Date.now(),
                executed: false 
            });
            toast.success(`Comando ${action} enviado a ${deviceId}`);
        } catch (error) {
            toast.error("Error al enviar comando");
        }
    };

    const filteredDevices = devices.filter(d => {
        if (filter === 'online') return d.online === "conectado";
        if (filter === 'stock') return d.foodLevel < 20;
        if (filter === 'new') return !d.linked_user_id || d.linked_user_id === "null";
        return true;
    });

    if (loading) return <div className={styles.loader}>Escaneando red IoT...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleInfo}>
                    <h2><RiBaseStationLine /> Administración de Dispositivos</h2>
                    <p>Total: {devices.length} equipos en sistema</p>
                    {/* <p>Control total sobre el hardware desplegado</p> */}
                    <button 
                        className={styles.btnAddDevice} 
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Nuevo Equipo
                    </button>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.filterTabs}>
                        <button className={filter === 'all' ? styles.active : ''} onClick={() => setFilter('all')}>Todos</button>
                        <button className={filter === 'new' ? styles.active : ''} onClick={() => setFilter('new')}>Disponibles</button>
                        <button className={filter === 'online' ? styles.active : ''} onClick={() => setFilter('online')}>Online</button>
                    </div>
                </div>
            </header>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provisionar Nuevo Hardware">
                <RegisterDeviceForm onSuccess={() => setIsModalOpen(false)} />
            </Modal>

            <div className={styles.deviceGrid}>
                {filteredDevices.map(device => (
                    <div key={device.id} className={`${styles.card} ${device.online !== 'conectado' ? styles.offlineCard : ''}`}>
                        <div className={styles.cardStatus}>
                            <span className={styles.onlineBadge}>
                                {device.online === 'conectado' ? '● ONLINE' : '● OFFLINE'}
                            </span>
                            <code>ID: {device.id}</code>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.mainMetric}>
                                <div className={styles.progressCircle}>
                                    <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                        <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className={styles.circle} 
                                            strokeDasharray={`${device.foodLevel}, 100`}
                                            stroke={device.foodLevel < 20 ? '#ff4757' : '#2ed573'}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className={styles.percentage}>{Math.round(device.foodLevel)}%</div>
                                </div>
                                <span className={styles.metricLabel}>Nivel de Comida</span>
                            </div>

                            <div className={styles.infoList}>
                                <div className={styles.infoItem}>
                                    <MdSignalWifiStatusbar4Bar /> 
                                    <span>Señal: {device.rssi} dBm</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <MdRefresh /> 
                                    <span>V: {device.version || '1.0.0'}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            <button title="Dispensar Prueba" onClick={() => handleRemoteAction(device.id, 'DISPENSE')}>
                                <MdFastfood />
                            </button>
                            <button title="Reiniciar Dispositivo" onClick={() => handleRemoteAction(device.id, 'REBOOT')}>
                                <MdRefresh />
                            </button>
                        </div>
                        
                        <div className={styles.cardFooter}>
                            <span>Dueño: {device.ownerEmail}</span>
                            <br />
                            <small>Estado: {device.lifecycle || 'Procesando'}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDevicesPage;