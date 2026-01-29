import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import {
  RiUserFollowLine,
  RiPulseLine,
  RiHistoryLine,
  RiAlertLine,
  RiExternalLinkLine,
  RiShieldUserLine,
} from "react-icons/ri";
import styles from "./Admin.module.scss";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    users: 0,
    devices: 0,
    alerts: 0,
    activeAdmins: 0,
  });
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const devicesSnap = await getDocs(collection(db, "devicesPet"));

        setStats((prev) => ({
          ...prev,
          users: usersSnap.size,
          devices: devicesSnap.size,
          activeAdmins: usersSnap.docs.filter((d) => d.data().role === "admin")
            .length,
        }));
      } catch (e) {
        console.error(e);
      }
    };

    const qLogs = query(
      collection(db, "system_logs"),
      orderBy("timestamp", "desc"),
      limit(8),
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCombinedLogs(logs);
      setStats((prev) => ({
        ...prev,
        alerts: logs.filter((l) => l.type === "error").length,
      }));
      setLoading(false);
    });

    fetchStats();
    return () => unsubLogs();
  }, []);

  if (loading)
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>Cargando Panel...
      </div>
    );

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <div className={styles.titleContent}>
          <h1>Vista General</h1>
          <p>Bienvenido al Centro de Mando Pet-GVA</p>
        </div>
        <div className={styles.serverStatus}>
          <span className={styles.pulse}></span> Servidores Operativos
        </div>
      </header>

      <div className={styles.statsGrid}>
        <StatCard
          title="Usuarios"
          value={stats.users}
          icon={<RiUserFollowLine />}
          color="#4e73df"
          subtitle={`${stats.activeAdmins} Administradores`}
        />
        <StatCard
          title="Dispositivos Activos"
          value={stats.devices}
          icon={<RiPulseLine />}
          color="#1cc88a"
          subtitle="Dispositivos en red"
        />
        <StatCard
          title="Alertas"
          value={stats.alerts}
          icon={<RiAlertLine />}
          color="#f6c23e"
          subtitle="Eventos críticos hoy"
        />
      </div>

      <div className={styles.contentLayout}>
        {/* Sección de Actividad Reciente */}
        <section className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h3>
              <RiHistoryLine /> Actividad del Ecosistema
            </h3>
            <Link to="/admin/logs" className={styles.viewMore}>
              Ver todo <RiExternalLinkLine />
            </Link>
          </div>
          <div className={styles.logTimeline}>
            {combinedLogs.map((log) => (
              <div
                key={log.id}
                className={`${styles.logRow} ${styles[log.type]}`}
              >
                <div className={styles.indicator}></div>
                <div className={styles.logData}>
                  <div className={styles.logTop}>
                    <strong>{log.action}</strong>
                    <span>{log.timestamp?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <p>{log.details}</p>
                  <small>
                    {log.origin === "DEVICE"
                      ? `ID: ${log.deviceId}`
                      : log.userEmail}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección lateral de Accesos Rápidos o Salud del Sistema */}
        <aside className={styles.sidePanel}>
          <div className={styles.healthCard}>
            <h4>Estado del Bridge</h4>
            <div className={styles.healthItem}>
              <span>MQTT Broker</span>
              <span className={styles.statusOk}>Online</span>
            </div>
            <div className={styles.healthItem}>
              <span>Base de Datos</span>
              <span className={styles.statusOk}>Online</span>
            </div>
          </div>

          <div className={styles.quickActions}>
            <h4>Accesos Rápidos</h4>
            <Link to="/admin/users" className={styles.actionBtn}>
              <RiShieldUserLine /> Gestionar Permisos
            </Link>
            <Link to="/admin/devices" className={styles.actionBtn}>
              <RiPulseLine /> Monitor de Telemetría
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className={styles.statCard} style={{ "--card-color": color }}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statData}>
      <span className={styles.statTitle}>{title}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statSubtitle}>{subtitle}</span>
    </div>
  </div>
);

export default AdminDashboardPage;
