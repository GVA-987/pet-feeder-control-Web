import React, { useState, useEffect } from 'react';
import styles from './ScheduleManager.module.scss';
import { useAuth } from '../../../../context/AuthContext';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase-config';
import { MdDelete } from 'react-icons/md';
import Form from '../../../common/form/Form.jsx';
import moment from 'moment';





const ScheduleManager = () => {
    const [newSchedule, setNewSchedule] = useState({ startDate: '', endDate: '', time: '', portion: '' });
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    

    // Manejar cambios en el formulario
    const handleInputChange = (eOrName, maybeValue) => {

        if (typeof eOrName === 'string') {
            const name = eOrName;
            const value = maybeValue;
            setNewSchedule(prev => ({ ...prev, [name]: value }));
            return;
        }

        const e = eOrName;
        if (!e || !e.target) return;
        const { name, value } = e.target;
        setNewSchedule(prev => ({ ...prev, [name]: value }));
    };

    //Agregar horarios
    const handleAddSchedule = async (e) => {
    e.preventDefault();
        if (newSchedule.startDate && newSchedule.endDate && newSchedule.time && newSchedule.portion) {
            try {
                const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
                await updateDoc(deviceRef, {
                    schedule: arrayUnion(newSchedule)
                });
                setNewSchedule({ startDate: '', endDate: '', time: '', portion: '' });
            } catch (error) {
                console.error('Error al guardar el horario:', error);
                alert('Hubo un error al guardar el horario.');
            }
        }
    };

    const scheduleFields = [
        {
            label: 'Fecha de Inicio',
            type: 'date',
            name: 'startDate',
            value: newSchedule.startDate,
            onChange: handleInputChange,
            required: true,
            containerClassName: styles.contenerInput,
            unstyled: true,
        },
        {
            label: 'Hora',
            type: 'time',
            name: 'time',
            value: newSchedule.time,
            onChange: handleInputChange,
            required: true,
            unstyled: true,
        },
        {
            label: 'Fecha de Fin',
            type: 'date',
            name: 'endDate',
            value: newSchedule.endDate,
            onChange: handleInputChange,
            required: true,
            unstyled: true,
        },
        {
            label: 'Porción',
            type: 'numeric',
            name: 'portion',
            value: newSchedule.portion,
            onChange: handleInputChange,
            placeholder: 'Porción en gramos',
            required: true,
            unstyled: true,
        }
    ];

    // if (loading) {
    //     return <div>Cargando horarios...</div>;
    // }

    return (

        <div className={styles.scheduleFormContainer}>
            <h3>Añadir Nuevo Horario</h3>
            <Form
                fields={scheduleFields}
                onSubmit={handleAddSchedule}
                submitButtonText="Guardar Horario"
            />
        </div>
    );
};

export default ScheduleManager;