// src/pages/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';
import styles from './HistoryDevice.module.scss';
import { MdAccessTime, MdInfoOutline } from 'react-icons/md';

const HistoryPage = () => {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchHistory = async () => {
        if (!currentUser?.deviceId) {
        setLoading(false);
        return;
        }

        try {
        const q = query(
            collection(db, 'dispense_history'),
            where('deviceId', '==', currentUser.deviceId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const historyData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setHistory(historyData);
        } catch (error) {
        console.error('Error al obtener el historial:', error);
        } finally {
        setLoading(false);
        }
    };

    fetchHistory();
    }, [currentUser]);

    // funcion para formatear la fecha
    const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString();
    };

    return (
    <div className={styles.containerHistory}>
        <header className={styles.headerHistory}>
        <h1>Historial de Dispensación</h1>
        </header>

        {loading ? (
        <p>Cargando historial...</p>
        ) : history.length > 0 ? (
        <div className={styles.historyList}>
            {history.map((item) => (
            <div key={item.id} className={styles.historyItem}>
                <div className={styles.icon}>
                <MdAccessTime />
                </div>
                <div className={styles.details}>
                <span>
                    <strong>{item.type === 'manual' ? 'Dispensación Manual' : 'Dispensación Programada'}</strong>
                </span>
                <p>
                    {item.portion} porción(es) de comida.
                </p>
                <p className={styles.timestamp}>
                    {formatTimestamp(item.timestamp)}
                </p>
                </div>
            </div>
            ))}
        </div>
        ) : (
        <div className={styles.noData}>
            <MdInfoOutline />
            <p>No hay registros de dispensación aún.</p>
        </div>
        )}
    </div>
    );
};

export default HistoryPage;