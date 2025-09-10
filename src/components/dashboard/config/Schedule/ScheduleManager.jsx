import React, { useState, useEffect } from 'react';
import styles from './ScheduleManager.module.scss';
import { useAuth } from '../../../../context/AuthContext';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase-config';
import { MdDelete } from 'react-icons/md';
import Form from '../../../common/form/Form.jsx';





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

  const scheduleFields = [
        {
            label: 'Fecha de Inicio',
            type: 'date',
            name: 'startDate',
            value: newSchedule.startDate,
            onChange: handleInputChange,
            required: true,
        },
        {
            label: 'Fecha de Fin',
            type: 'date',
            name: 'endDate',
            value: newSchedule.endDate,
            onChange: handleInputChange,
            required: true,
        },
        {
            label: 'Hora',
            type: 'time',
            name: 'time',
            value: newSchedule.time,
            onChange: handleInputChange,
            required: true,
        },
        {
            label: 'Porción',
            type: 'number',
            name: 'portion',
            value: newSchedule.portion,
            onChange: handleInputChange,
            placeholder: 'Porción en gramos',
            min: '1',
            required: true,
        },
        {
            label: 'Medida de la Porción',
            type: 'number',
            name: 'portion',
            value: newSchedule.portion,
            onChange: handleInputChange,
            placeholder: 'Medida en gramos',
            min: '1',
            required: true,
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
      <div className={styles.scheduleList}>
        {schedules.length > 0 ? (
          schedules.map((schedule, index) => (
            <div key={index} className={styles.scheduleItem}>
              <span>
                <strong>{schedule.time}</strong> - {schedule.portion} porción(es)
              </span>
              <p>
                Desde {schedule.startDate} hasta {schedule.endDate}
              </p>
              <button
                onClick={() => handleDeleteSchedule(schedule)}
                className={styles.deleteButton}
              >
                <MdDelete />
              </button>
            </div>
          ))
        ) : (
          <p>No hay horarios programados.</p>
        )}
      </div>      
    </div>
    );
};

export default ScheduleManager;