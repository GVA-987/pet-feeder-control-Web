// src/pages/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';
import styles from './HistoryDevice.module.scss';
import { MdAccessTime, MdInfoOutline } from 'react-icons/md';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

    // Funcion para formatear timestamps
    const formatTimestamp = (timestamp) => {
        if (!timestamp || typeof timestamp !== 'number') {
            return 'N/A';
        }

        const dateInMs = timestamp * 1000; // Convertir a milisegundos
        const date = new Date(dateInMs);
        
        // formatear fecha en español y hora 24h 
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };


    const calculateChartData = (hist) => {
    const manualCount = hist.filter(item => item.type === 'manual').length;
    const scheduledCount = hist.length - manualCount;
    
    const pieData = [
        { name: 'Manual', value: manualCount, fill: '#f97316' },
        { name: 'Programado', value: scheduledCount, fill: '#10b981' },
    ];

    // Datos para el gráfico de barras
    const dailyDataMap = hist.reduce((acc, item) => {

        const dateKey = new Date(item.timestamp * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        
        acc[dateKey] = (acc[dateKey] || 0) + (parseInt(item.portion) || 0);
        return acc;
    }, {});

    // Convertimos el mapa a un array
    const barData = Object.keys(dailyDataMap).map(key => ({
        date: key,
        portions: dailyDataMap[key]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const recentBarData = barData.slice(-7); 
    const kpis = { 
        totalDispensed: hist.length, 
        totalPortions: hist.reduce((sum, item) => sum + (parseInt(item.portion) || 0), 0)
    };

    return { pieData, recentBarData, kpis };
};

// Funcion para generar reporte CSV
const handleGenerateReport = () => {
        if (history.length === 0) return;

        const headers = ["Fecha y Hora", "Porciones", "Tipo", "ID de Dispositivo"];
        
        const csvRows = history.map(item => [
            `"${formatTimestamp(item.timestamp)}"`, 
            item.portion,
            item.type === 'manual' ? 'Manual' : 'Programada',
            item.deviceId || 'N/A'
        ].join(','));

        const csvContent = [
            headers.join(','),
            ...csvRows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_historial_${currentUser.deviceId || 'general'}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const { pieData, recentBarData, kpis } = calculateChartData(history);

    


    return (
        <div className={styles.containerHistory}>
            <header className={styles.headerHistory}>
                <h1>Historial de Dispensación</h1>
                <button 
                    className={styles.reportButton} 
                    onClick={handleGenerateReport}
                    disabled={history.length === 0}
                >
                    Generar Reporte 📄
                </button>
            </header>

            {loading ? (
                <p>Cargando historial...</p>
            ) : history.length > 0 ? (
                <>
                    {/* Sección de KPIs */}
                    <div className={styles.kpiContainer}>
                        <div className={styles.kpiCard}>
                            <h3>Total Dispensado (Eventos)</h3>
                            <p className={styles.kpiValue}>{kpis.totalDispensed}</p>
                        </div>
                        <div className={styles.kpiCard}>
                            <h3>Porciones Totales</h3>
                            <p className={styles.kpiValue}>{kpis.totalPortions}</p>
                        </div>
                        <div className={styles.kpiCard}>
                            <h3>Dispensación Programada</h3>
                            <p className={styles.kpiValue}>{pieData[1].value}</p>
                        </div>
                        <div className={styles.kpiCard}>
                            <h3>Dispensación Manual</h3>
                            <p className={styles.kpiValue}>{pieData[0].value}</p>
                        </div>
                    </div>
                    
                    {/* Tabla de Historial */}
                    <div className={styles.tableContainer}>
                        <div className={styles.tableWrapper}> 
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>Fecha y Hora</th>
                                        <th className={styles.centerText}>Porción</th>
                                        <th>Tipo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id} className={styles.historyRow}>
                                            <td>
                                                <MdAccessTime className={styles.timeIcon} />
                                                {formatTimestamp(item.timestamp)}
                                            </td>
                                            <td className={styles.centerText}>
                                                {item.portion}
                                            </td>
                                            <td>
                                                <span className={item.type === 'manual' ? styles.tagManual : styles.tagScheduled}>
                                                    {item.type === 'manual' ? 'Manual' : 'Programada'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sección de KPIs y Gráficos */}
                <div className={styles.chartContainer}>

                    <div className={styles.chartCard}>
                        <h3>Desglose de Dispensación (Eventos)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    fill="#8884d8"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                                
                    <div className={styles.chartCard} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className={styles.kpiSmallCard}>
                            <h3>Eventos Totales</h3>
                            <p className={styles.kpiSmallValue}>{kpis.totalDispensed}</p>
                        </div>
                        <div className={styles.kpiSmallCard}>
                            <h3>Porciones Totales</h3>
                            <p className={styles.kpiSmallValue}>{kpis.totalPortions}</p>
                        </div>
                    </div>
                                
                    <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
                        <h3>Porciones Dispensadas (Últimos 7 Días)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={recentBarData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#999" />
                                <YAxis stroke="#999" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} 
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="portions" name="Porciones" fill="#10b981" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                    </>
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