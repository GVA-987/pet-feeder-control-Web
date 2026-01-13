// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';
import styles from './HistoryDevice.module.scss';
import { MdAccessTime, MdInfoOutline, MdFileDownload, MdHistory } from 'react-icons/md';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const HistoryPage = () => {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]); // Nuevo estado
    const [loading, setLoading] = useState(true);
    const [filterRange, setFilterRange] = useState('all');

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
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(data);
                setFilteredHistory(data);
            } catch (error) {
                console.error('Error al obtener el historial:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentUser]);

    useEffect(() => {
        const now = new Date();
        const filtered = history.filter(item => {
            if (filterRange === 'all') return true;
            
            const itemDate = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp.seconds * 1000);
            const diffTime = Math.abs(now - itemDate);
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (filterRange === 'today') {
                return itemDate.toDateString() === now.toDateString();
            }
            if (filterRange === 'week') return diffDays <= 7;
            if (filterRange === 'month') return diffDays <= 30;
            return true;
        });
        setFilteredHistory(filtered);
    }, [filterRange, history]);



    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000 || timestamp);
        return date.toLocaleString('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const calculateChartData = (hist) => {
        const manualCount = hist.filter(item => item.type === 'manual').length;
        const scheduledCount = hist.length - manualCount;
        
        const pieData = [
            { name: 'Manual', value: manualCount, fill: '#f97316' },
            { name: 'Programado', value: scheduledCount, fill: '#10b981' },
        ];

        const dailyDataMap = hist.reduce((acc, item) => {
            if (!item.timestamp) return acc;
            const dateObj = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp.seconds * 1000);
            const dateLabel = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            acc[dateLabel] = (acc[dateLabel] || 0) + (parseInt(item.portion) || 0);
            return acc;
        }, {});

        const barData = Object.keys(dailyDataMap).map(key => ({
            date: key,
            portions: dailyDataMap[key]
        })).reverse().slice(-7); 

        return { 
            pieData, 
            barData, 
            kpis: {
                totalDispensed: hist.length,
                totalPortions: hist.reduce((sum, item) => sum + (parseInt(item.portion) || 0), 0)
            }
        };
    };

    const handleGenerateReport = () => {
        const headers = ["Fecha y Hora", "Porciones", "Tipo"];
        const csvRows = history.map(item => [
            `"${formatTimestamp(item.timestamp)}"`, 
            item.portion,
            item.type === 'manual' ? 'Manual' : 'Programada'
        ].join(','));

        const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${currentUser.deviceId}.csv`;
        link.click();
    };

    const { pieData, barData, kpis } = calculateChartData(filteredHistory);

    if (loading) return <div className={styles.loading}>Cargando historial...</div>;

    if (!currentUser?.deviceId || history.length === 0) {
        return (
            <div className={styles.noData}>
                <MdInfoOutline />
                <p>No hay registros disponibles para este dispositivo.</p>
            </div>
        );
    }
    

    return (
        <div className={styles.containerHistory}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1><MdHistory /> Historial de Actividad</h1>
                    <p>Monitorea las raciones de tu mascota</p>
                </div>
                <div className={styles.filterBar}>
                    <button 
                        className={filterRange === 'today' ? styles.active : ''} 
                        onClick={() => setFilterRange('today')}
                    >Hoy</button>
                    <button 
                        className={filterRange === 'week' ? styles.active : ''} 
                        onClick={() => setFilterRange('week')}
                    >7 Días</button>
                    <button 
                        className={filterRange === 'month' ? styles.active : ''} 
                        onClick={() => setFilterRange('month')}
                    >Mes</button>
                    <button 
                        className={filterRange === 'all' ? styles.active : ''} 
                        onClick={() => setFilterRange('all')}
                    >Todo</button>
                </div>

                <button className={styles.reportButton} onClick={handleGenerateReport}>
                    <MdFileDownload /> Reporte
                </button>
            </header>

            <section className={styles.dashboard}>
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <span>Total Eventos</span>
                        <h3>{kpis.totalDispensed}</h3>
                    </div>
                    <div className={styles.kpiCard}>
                        <span>Porciones Totales</span>
                        <h3>{kpis.totalPortions}</h3>
                    </div>
                </div>

                <div className={styles.chartsGrid}>
                    <div className={styles.chartCard}>
                        <h3>Distribución por Tipo</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className={styles.chartCard}>
                        <h3>Consumo últimos días</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="portions" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className={styles.tableSection}>
                <h3>Registros Recientes</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.historyTable}>
                        <thead>
                            <tr>
                                <th>Fecha y Hora</th>
                                <th>Porción</th>
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className={styles.timeCell}>
                                            <MdAccessTime /> {formatTimestamp(item.timestamp)}
                                        </div>
                                    </td>
                                    <td><strong>{item.portion}</strong></td>
                                    <td>
                                        <span className={item.type === 'manual' ? styles.tagManual : styles.tagScheduled}>
                                            {item.type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default HistoryPage;