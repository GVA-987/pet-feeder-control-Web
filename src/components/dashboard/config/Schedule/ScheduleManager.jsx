import React, { useState, useEffect } from 'react';
import styles from './ScheduleManager.module.scss';
import { useAuth } from '../../../../context/AuthContext';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase-config';
import { MdDelete } from 'react-icons/md';
import Form from '../../../common/form/Form.jsx';
import moment from 'moment';



const ScheduleManager = ({ editData, onClearEdit }) => {
    const [newSchedule, setNewSchedule] = useState({ time: '', portion: '' });
    const [selectedDays, setSelectedDays] = useState([]);
    const { currentUser } = useAuth();
    const daysOfWeek = [
    { label: 'D', value: 0 },
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'Mi', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
];
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    

    // Manejar cambios en el formulario
    const handleInputChange = (eOrName, maybeValue) => {

        if (typeof eOrName === 'string') {
            // const name = eOrName;
            // const value = maybeValue;
            setNewSchedule(prev => ({ ...prev, [eOrName]: maybeValue }));
            return;
        }

        // const e = eOrName;
        // if (!e || !e.target) return;
        // const { name, value } = e.target;
        // setNewSchedule(prev => ({ ...prev, [name]: value }));
        const { name, value } = eOrName.target;
        setNewSchedule(prev => ({ ...prev, [name]: value }));
    };

    // Manejar selección de días
    const toggleDay = (dayValue) => {
        setSelectedDays(prev => 
            prev.includes(dayValue) 
                ? prev.filter(d => d !== dayValue) 
                : [...prev, dayValue]
        );
    };

    //Agregar horarios
    // const handleAddSchedule = async (e) => {
    // e.preventDefault();
    //     if (newSchedule.startDate && newSchedule.endDate && newSchedule.time && newSchedule.portion) {
    //         try {
    //             const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
    //             await updateDoc(deviceRef, {
    //                 schedule: arrayUnion(newSchedule)
    //             });
    //             setNewSchedule({ startDate: '', endDate: '', time: '', portion: '' });
    //         } catch (error) {
    //             console.error('Error al guardar el horario:', error);
    //             alert('Hubo un error al guardar el horario.');
    //         }
    //     }
    // };

    useEffect(() => {
        if (editData) {
        setNewSchedule({ 
            time: editData.time || '', 
            portion: editData.portion || '' 
        });
        setSelectedDays(editData.days || []);
    }
    }, [editData]);

    const handleAddSchedule = async (e) => {
        e.preventDefault();

        // Validaciones básicas
        try {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
            
            const scheduleObject = {
                id: editData?.id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                days: [...selectedDays].sort(),
                time: newSchedule.time,
                portion: Number(newSchedule.portion),
                enabled: true,
            };

            if (editData) {
                // Lógica de Edición: 
                // 1. Obtenemos el documento actual
                // 2. Filtramos el array para quitar el viejo y poner el nuevo
                // (Esto es más seguro que arrayRemove si cambiaste algún campo)
                const docSnap = await getDoc(deviceRef);
                if (docSnap.exists()) {
                const currentSchedules = docSnap.data().schedule || [];
                
                // Buscamos por ID y reemplazamos solo ese
                const updatedSchedules = currentSchedules.map(item => {
                     // Si el item no tiene ID, lo ignoramos para no pisar datos por error
                    if (!item.id || !editData.id) return item; 

                     // Solo si los IDs coinciden, devolvemos el objeto editado
                    return item.id === editData.id ? scheduleObject : item;
                });
                
                await updateDoc(deviceRef, { schedule: updatedSchedules });
                handleCancel();
                
            }
            } else {
                // Lógica de Creación normal
                
                await updateDoc(deviceRef, { schedule: arrayUnion(scheduleObject) });
            }

            setNewSchedule({ time: '', portion: '' });
            setSelectedDays([]);
        } catch (error) {
            console.error(error);
        }
        
    };

    const handleCancel = () => {
    // 1. Limpiamos los inputs
    setNewSchedule({ time: '', portion: '' });
    // 2. Desmarcamos los días
    setSelectedDays([]);
    // 3. Le avisamos al padre que ya no estamos editando para que quite el objeto editData
    onClearEdit(); 
};
    

    const scheduleFields = [
        {
            label: 'Hora de comida',
            type: 'time',
            name: 'time',
            value: newSchedule.time,
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
            placeholder: 'Ej: 50',
            required: true,
            unstyled: true,
        }
        // {
        //     label: 'Fecha de Inicio',
        //     type: 'date',
        //     name: 'startDate',
        //     value: newSchedule.startDate,
        //     onChange: handleInputChange,
        //     required: true,
        //     containerClassName: styles.contenerInput,
        //     unstyled: true,
        // },
        // {
        //     label: 'Hora',
        //     type: 'time',
        //     name: 'time',
        //     value: newSchedule.time,
        //     onChange: handleInputChange,
        //     required: true,
        //     unstyled: true,
        // },
        // {
        //     label: 'Fecha de Fin',
        //     type: 'date',
        //     name: 'endDate',
        //     value: newSchedule.endDate,
        //     onChange: handleInputChange,
        //     required: true,
        //     unstyled: true,
        // },
        // {
        //     label: 'Porción',
        //     type: 'numeric',
        //     name: 'portion',
        //     value: newSchedule.portion,
        //     onChange: handleInputChange,
        //     placeholder: 'Porción en gramos',
        //     required: true,
        //     unstyled: true,
        // }
    ];

    // if (loading) {
    //     return <div>Cargando horarios...</div>;
    // }

    return (

        <div className={styles.scheduleFormContainer}>
        <h3>{editData ? 'Editar Horario' : 'Añadir Nuevo Horario'}</h3>
        
        {/* Este contenedor DEBE estar arriba para que ocupe todo el ancho */}
        <div className={styles.daysSelectorContainer}>
            <div className={styles.daysGrid}>
                {daysOfWeek.map((day) => (
                    <button
                        key={day.value}
                        type="button"
                        className={`${styles.dayButton} ${selectedDays.includes(day.value) ? styles.dayActive : ''}`}
                        onClick={() => toggleDay(day.value)}
                    >
                        {day.label}
                    </button>
                ))}
            </div>
        </div>

        {/* El formulario con los inputs de Hora y Porción */}
        <Form
            fields={scheduleFields}
            onSubmit={handleAddSchedule}
            submitButtonText={editData ? "Actualizar Horario" : "Agregar Horario"}
        />
        {editData && (
                <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                    Cancelar Edición
                </button>
            )}
    </div>
    );
};

export default ScheduleManager;