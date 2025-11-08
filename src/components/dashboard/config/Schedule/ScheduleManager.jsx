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
    //Eliminar horarios
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

    if (loading) {
        return <div>Cargando horarios...</div>;
    }

    return (
        <div>
            <h2>Horarios de Alimentación</h2>

        <div className={styles.scheduleFormContainer}>
            <h3>Añadir Nuevo Horario</h3>
            <Form
                fields={scheduleFields}
                onSubmit={handleAddSchedule}
                submitButtonText="Guardar Horario"
            />
        </div>

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
    );
};

export default ScheduleManager;