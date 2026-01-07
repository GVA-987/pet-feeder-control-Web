import React from 'react';
import { RiUserFollowLine, RiHashtag, RiPulseLine } from "react-icons/ri"; 
import styles from './Admin.module.scss';

const AdminDashboardPage = () => {
    const stats = [
        { id: 1, title: 'Usuarios Registrados', value: '124', icon: <RiUserFollowLine />, color: '#4e73df' },
        { id: 2, title: 'Dispositivos Activos', value: '89', icon: <RiPulseLine />, color: '#1cc88a' },
        { id: 3, title: 'Alertas de Stock', value: '5', icon: <RiHashtag />, color: '#f6c23e' },
    ];

    return (
        <div className={styles.adminContainer}>
            <header className={styles.header}>
                <h1>Panel de Control Administrativo</h1>
                <p>Bienvenido al centro de mando de Pet-GVA</p>
            </header>


            <div className={styles.statsGrid}>
                {stats.map(stat => (
                    <div key={stat.id} className={styles.statCard} style={{ borderLeft: `5px solid ${stat.color}` }}>
                        <div className={styles.statInfo}>
                            <span className={styles.statTitle}>{stat.title}</span>
                            <span className={styles.statValue}>{stat.value}</span>
                        </div>
                        <div className={styles.statIcon} style={{ color: stat.color }}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.recentActivity}>
                    <h3>Actividad Reciente de Dispositivos</h3>
                    <div className={styles.placeholderTable}>
                        <p>Cargando últimos registros de alimentación...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;