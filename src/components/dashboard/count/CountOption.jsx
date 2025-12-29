// src/components/configuration/GeneralOptions.jsx

import React, { useState, useEffect } from 'react';
import styles from './CountOption.module.scss';
import Form from '../../common/form/Form.jsx';
import Button from '../../common/button/ButtonForm.jsx';
import DeviceLink from './deviceLink/DeviceLink';
import {db, rtdb} from '../../../firebase/firebase-config.js';
import {useAuth} from '../../../context/AuthContext'
import {doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, where, query, orderBy} from 'firebase/firestore';
import { getDatabase, ref, onValue, off, update } from "firebase/database";

const GeneralOptions = () => {
    const { currentUser } = useAuth();
    const [calibratePortion, setCalibratePortion] = useState('');
    const [weightPortion, setWeightPortion] = useState('');
    const [rtdbData, setRtdbData] = useState(null);
    const [commands, setCommands] = useState(null);
const [status, setStatus] = useState(null);

    //RTDB
    useEffect (() => {
        if (!currentUser && !currentUser.deviceId) return;

        const dbRT = getDatabase();
        const portionRef = ref(dbRT, `${currentUser.deviceId}/commands`);
        const wifiRef = ref(dbRT, `${currentUser.deviceId}/status`);

        const unsubscribePortion = onValue(portionRef, (snapshot) => {
            setCommands(snapshot.exists() ? snapshot.val() : null);
        });

        const unsubscribeWifi = onValue(wifiRef, (snapshot) => {
            setStatus(snapshot.exists() ? snapshot.val() : null);
        });
        return () => {
            unsubscribePortion();
            unsubscribeWifi();
        };
    }, [currentUser]);

    const handleWeightCalibrate = async (e) => {
        e.preventDefault();

        if (!currentUser && !currentUser.deviceId) return;

        try {
            const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);
            await update(deviceRefRTDB, {
                weight_portion: String(calibratePortion),
            });

            setCalibratePortion('');
        } catch (error) {
            console.error('Error al calibrar porción:', error);
        }
    }
    const calibratePortionFields = [
        {
            type: 'text',
            placeholder: 'Porcion a Calibrar (g)',
            value: calibratePortion,
            onChange: (e) => setCalibratePortion(e.target.value),
            required: true,
        }
    ]


    return (
    <div className={styles.containerConfig}>
            <h3 className={styles.mainTitle}>Configuracion del Equipo</h3>
        <div className={styles.contentGrid}>

            {/* Tarjeta de Dispositivos */}
            <div className={styles.card}>
                <h3>Dispositivos</h3>
                <div className={styles.containerDeviceList}>
                    <DeviceLink />
                    <div className={styles.deviceList}>
                        <h4>Dispositivos Enlazados</h4>
                    </div>
                </div>
            </div>

            {/* Tarjeta 2 Calibracion */}
            <div className={styles.card}>
                <h3>Ajustar de porcion</h3>
                <p>Define cuántos gramos equivale a una unidad de Comida.</p>
                <p className={styles.deviceInfo}><label>Porción actual:</label><strong>1 porcion = {commands?.weight_portion || 'fija Una Medida'} g.</strong></p>
                <Form 
                    fields={calibratePortionFields}
                    onSubmit={handleWeightCalibrate}
                    submitButtonText= "Calibrar"
                />
            </div>

            {/* Tarjeta 3 Wi-Fi */}
            <div className={styles.card}>
                <h3>Conectividad</h3>
                <p>Revisa la conexión Wi-Fi de tu dispositivo.</p>
                <p className={styles.deviceInfo}><label>Nombre de Wi-Fi:</label><strong>{status?.ssid || 'No disponible'}</strong></p>
                <p className={styles.deviceInfo}><label>Señal:</label><strong>{status?.rssi || 'No disponible'} dBm</strong></p>
                <Button>
                    Restaurar Wi-Fi
                </Button>
            </div>
        </div>
    </div>
    );
};

export default GeneralOptions;