import React, { useState, useEffect } from 'react';
import styles from './ConfigDevice.module.scss';
import ScheduleManager from './Schedule/ScheduleManager';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/firebase-config';
import { MdDelete, MdEdit } from 'react-icons/md';
import moment from 'moment';
import toast from 'react-hot-toast';
import Switch from '../../common/switch/Switch';

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
        if (!window.confirm("¿Estás seguro de eliminar este horario?")) return;
        try {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
        
            const updatedSchedules = schedules.filter(s => s.id !== scheduleToDelete.id);

            await updateDoc(deviceRef, { schedule: updatedSchedules });

            await addDoc(collection(db, "archived_schedules"), {
                ...scheduleToDelete,
                archivedAt: serverTimestamp(),
                deletedBy: currentUser.uid,
                deviceId: currentUser.deviceId
            });

        // 4. Log del sistema
            await addDoc(collection(db, "system_logs"), {
                action: "SCHEDULE_ARCHIVED",
                userId: currentUser.uid,
                deviceId: currentUser.deviceId,
                timestamp: serverTimestamp(),
                details: `Horario ${scheduleToDelete.time} movido al archivo.`,
                type: "info"
            });

            toast.success('Horario eliminado', { className: 'custom-toast-success' });

        } catch (error) {
            toast.error('Error al eliminar', { className: 'custom-toast-error' });
            console.error(error);
        }
    };

    const handleToggleStatus = async (schedule) => {
    try {
        const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
        const updatedSchedules = schedules.map(s => 
            s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
        );

        await updateDoc(deviceRef, { schedule: updatedSchedules });


        await addDoc(collection(db, "system_logs"), {
            action: schedule.enabled ? "SCHEDULE_DISABLED" : "SCHEDULE_ENABLED",
            userId: currentUser.uid,
            deviceId: currentUser.deviceId,
            timestamp: serverTimestamp(),
            details: `Horario ${schedule.time} cambiado a ${!schedule.enabled ? 'Habilitado' : 'Deshabilitado'}`
        });

        toast.success(schedule.enabled ? 'Horario desactivado' : 'Horario activado', { className: 'custom-toast-success' });
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleEditClick = (schedule) => {
        setEditingSchedule(schedule);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const activeSchedules = schedules.filter(s => !s.deleted);

    if (loading) return <div className={styles.loader}>Cargando configuración...</div>;

    return (
        <div className={styles.container}>
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
                        {schedules.filter(s => s.deleted !== true).length > 0 ? (
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
                                    {schedules
                                        .filter(schedule => schedule.delete !== true)
                                        .map((schedule, index) => (
                                        <tr key={schedule.id || index} className={`${styles.scheduleRow} ${!schedule.enabled ? styles.disabledRow : ''}`}>
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
                                                <Switch 
                                                    id={schedule.id}
                                                    isOn={schedule.enabled}
                                                    handleToggle={() => handleToggleStatus(schedule)}
                                                />
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