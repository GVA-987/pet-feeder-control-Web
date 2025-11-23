import React, { useState, useEffect } from 'react';
import styles from './ConfigDevice.module.scss';
import ScheduleManager from './Schedule/ScheduleManager';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import DeviceLink from './deviceLink/DeviceLink';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/firebase-config';
import { MdDelete } from 'react-icons/md';
import moment from 'moment';


const ConfigDevice = () => {

    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);

    // Escuchar horarios en tiempo real
    useEffect(() => {
        if (currentUser && currentUser.deviceId) {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);

            const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
                if (docSnap.exists()) {
                    const deviceData = docSnap.data();
                    setSchedules(deviceData.schedule || []);
                    setLoading(false);
                } else {
                    console.log("No se encontró Datos de tu Dispositivo.");
                    setLoading(false);
                }
            });

            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleDeleteSchedule = async (scheduleToDelete) => {
        if (!currentUser || !currentUser.deviceId) return;  
        try {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
            await updateDoc(deviceRef, {
                schedule: arrayRemove(scheduleToDelete)
            });
            console.log("Horario eliminado con éxito.");
        } catch (error) {
            console.error('Error al eliminar el horario:', error);
            alert('Hubo un error al eliminar el horario.');
        }
    };

    const formatVigenciaRange = (startDate, endDate) => {
        const start = moment(startDate, "YYYY-MM-DD");
        const end = moment(endDate, "YYYY-MM-DD");

        if (start.format('MMM YYYY') === end.format('MMM YYYY')) {
            return `${start.format('D')} - ${end.format('D [de] MMM')}`;
        }

        return `${start.format('D [de] MMM')} - ${end.format('D [de] MMM')}`; 
    };

    if (loading) {
        return <div>Cargando horarios...</div>;
    }

    return (
        <div className={styles.container}>

        <div className={styles.contentGrid}>
        {/* Tarjeta de Horarios Programados */}
        <div className={styles.card}>
            <ScheduleManager />
        </div>
        <div className={styles.card}>
            <h2>Horarios Programados</h2>
            {/* Lista de Horarios */}
                    <div className={styles.scheduleTableContainer}>
                        {schedules.length > 0 ? (
                    <table className={styles.scheduleTable}>
                        <thead>
                            <tr>
                                <th className={styles.timeCell}>Hora</th> 
                                <th className={styles.portionCell}>Porción</th>
                                <th className={styles.dateCell}>Vigencia</th>
                                <th className={styles.actionCell}>Acción</th>
                            </tr>
                        </thead>
            
                        <tbody>
                            {schedules.map((schedule, index) => (
                                <tr key={index} className={styles.scheduleRow}>
                                    <td className={styles.timeCell}>
                                        <strong>{schedule.time}</strong>
                                    </td>
                                    <td className={styles.portionCell}>
                                        {schedule.portion}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatVigenciaRange(schedule.startDate, schedule.endDate)}
                                    </td>
                                    <td className={styles.actionCell}>
                                        <button
                                            onClick={() => handleDeleteSchedule(schedule)}
                                            className={styles.deleteButton}
                                            title="Eliminar Horario"
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.noScheduleMessage}>
                        No hay horarios programados.
                    </p>
                )}
                </div>
        </div>
        </div>
    </div>
    );
};

export default ConfigDevice;