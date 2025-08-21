import React from 'react';
import styles from './ConfigDevice.module.scss';
import ScheduleManager from './Schedule/ScheduleManager';
import DeviceLink from './deviceLink/DeviceLink';
import { useAuth } from '../../../context/AuthContext';


const ConfigDevice = () => {
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
            <DeviceLink />
            <form action="" className={styles.formDeviceName}>
                <h3>Nombre del dispositivo</h3>
                <input type="text" placeholder='Ej: Comedero de Fido'/>
                <button type="submit" >Guardar</button>
            </form>
        </div>
        {/* Tarjeta de Horarios Programados */}
        <div className={styles.card}>
            <ScheduleManager />
        </div>
        </div>
    </div>
    );
};

export default ConfigDevice;