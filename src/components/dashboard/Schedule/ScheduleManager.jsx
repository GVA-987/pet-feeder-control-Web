import React, { useState, useEffect } from 'react';
import styles from './ScheduleManager.module.scss';
import { useAuth } from '../../../context/AuthContext';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { MdDelete } from 'react-icons/md';


const ScheduleManager = () => {
    const allDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const [newSchedule, setNewSchedule] = useState({ time: '', days: [], portion: '' });
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

    const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({ ...prev, [name]: value }));
    };

    const handleDayChange = (day) => {
    setNewSchedule(prev => {
      // Si el día ya está seleccionado, lo quita. Si no, lo agrega.
        const newDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
        return { ...prev, days: newDays };
    });
    };



    const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (newSchedule.time && newSchedule.days.length > 0 && newSchedule.portion) {
        try {
            const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
            await updateDoc(deviceRef, {
                schedule: arrayUnion(newSchedule)
            });
            setNewSchedule({ time: '', days: [], portion: '' }); // Limpiar formulario
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

    if (loading) {
      return <div>Cargando horarios...</div>;
  }

    return (
    <div>
      <h2>Horarios de Alimentación</h2>
      
      {/* Lista de Horarios */}
      <div className={styles.scheduleList}>
        {schedules.length > 0 ? (
          schedules.map((schedule, index) => (
            <div key={index} className={styles.scheduleItem}>
              <span><strong>{schedule.time}</strong> - {schedule.portion} porción(es)</span>
              <p>{schedule.days.join(', ')}</p>
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

      {/* Formulario para agregar un nuevo horario */}
      <form onSubmit={handleAddSchedule} className={styles.scheduleForm}>
        <h3>Añadir Nuevo Horario</h3>
        <input
          type="time"
          name="time"
          value={newSchedule.time}
          onChange={handleInputChange}
          required
        />
        <div className={styles.daySelection}>
          {allDays.map(day => (
            <label key={day} className={styles.dayButton}>
              <input
                type="checkbox"
                checked={newSchedule.days.includes(day)}
                onChange={() => handleDayChange(day)}
              />
              {day.charAt(0)}
            </label>
          ))}
        </div>
        <input
          type="number"
          name="portion"
          placeholder="Porción"
          value={newSchedule.portion}
          onChange={handleInputChange}
          min="1"
          required
        />
        <button type="submit">Guardar Horario</button>
      </form>
    </div>
    );
};

export default ScheduleManager;