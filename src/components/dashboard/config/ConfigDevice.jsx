import React, { useState, useEffect } from 'react';
import styles from './ConfigDevice.module.scss';
import ScheduleManager from './Schedule/ScheduleManager';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/firebase-config';
import { MdDelete, MdEdit } from 'react-icons/md';
import moment from 'moment';


const ConfigDevice = () => {

    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Escuchar horarios en tiempo real
    useEffect(() => {
        if (currentUser && currentUser.deviceId) {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);

            const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
                if (docSnap.exists()) {
                    const deviceData = docSnap.data();
                    const sortedSchedules = (deviceData.schedule || []).sort((a, b) => a.time.localeCompare(b.time));
                    setSchedules(sortedSchedules);
                    
                } else {
                    console.log("No se encontró Datos de tu Dispositivo.");
                    setLoading(false);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleDeleteSchedule = async (scheduleToDelete) => {
        // if (!window.confirm("¿Estás seguro de eliminar este horario?")) return;
        try {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
            await updateDoc(deviceRef, {
                schedule: arrayRemove(scheduleToDelete)
            });
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleEditClick = (schedule) => {
        setEditingSchedule(schedule);
        // Opcional: Hacer scroll hacia el formulario para que el usuario sepa que cargó
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div className={styles.loader}>Cargando configuración...</div>;

    return (
        <div className={styles.container}>
            <h3>Programacion de Horarios</h3>
        <div className={styles.contentGrid}>
        {/* Tarjeta de Horarios Programados */}
        <div className={styles.card}>
            <ScheduleManager 
                editData = {editingSchedule}
                onClearEdit = {() => setEditingSchedule(null)}
            />
        </div>
        <div className={styles.card}>
                    <h2 className={styles.title}>Horarios Programados</h2>
                    <div className={styles.scheduleTableContainer}>
                        {schedules.length > 0 ? (
                            <table className={styles.scheduleTable}>
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Días</th>
                                        <th>Porción</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map((schedule, index) => (
                                        <tr key={index} className={styles.scheduleRow}>
                                            <td className={styles.timeCell}>
                                                <strong>{schedule.time}</strong>
                                            </td>
                                            <td className={styles.daysCell}>
                                                <div className={styles.daysList}>
                                                    {schedule.days?.map(d => (
                                                        <span key={d} className={styles.dayBadge}>
                                                            {dayNames[d]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className={styles.portionCell}>
                                                {schedule.portion}
                                            </td>
                                            <td className={styles.actionCell}>
                                                <button 
                                                    onClick={() => handleEditClick(schedule)}
                                                    className={styles.editButton}
                                                    title="Editar"
                                                >
                                                    <MdEdit /> {/* Importa MdEdit de react-icons/md */}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchedule(schedule)}
                                                    className={styles.deleteButton}
                                                >
                                                    <MdDelete />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.noScheduleMessage}>No hay rutinas activas.</p>
                        )}
                    </div>
                </div>
        </div>
    </div>
    );
};

export default ConfigDevice;