import React from 'react';
import styles from './ConfigDevice.module.scss';
import ScheduleManager from '../Schedule/ScheduleManager';

const CondifDevice = () => {
    return (
        <div className={styles.container}>
        <header className={styles.header}>
        <h1>Configuración del Dispositivo</h1>
        <p>Ajusta los horarios de alimentación, el nombre del equipo y más.</p>
        </header>

        <div className={styles.contentGrid}>

        {/* Tarjeta para otras configuraciones */}
        <div className={styles.card}>
            <h2>Opciones Generales</h2>
            <p>Aquí se añadirán las opciones de nombre del dispositivo, zona horaria y notificaciones.</p>
        </div>
        {/* Tarjeta de Horarios Programados */}
        <div className={styles.card}>
            <ScheduleManager />
        </div>
        </div>
    </div>
    );
};

export default CondifDevice;