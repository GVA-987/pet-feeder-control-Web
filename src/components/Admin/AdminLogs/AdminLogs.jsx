import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import styles from "./AdminLogs.module.scss";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  RiCpuLine,
  RiUserSettingsLine,
  RiTerminalBoxLine,
  RiSearchLine,
  RiInformationLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiDownload2Line,
  RiPieChartLine,
} from "react-icons/ri";

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const exportToCSV = () => {
    const headers = ["ID,Origen,Accion,Detalles,Tipo,Fecha\n"];
    const rows = logs.map(
      (log) =>
        `${log.id},${log.origin},${log.action},${log.details},${log.type},${log.timestamp?.toDate().toLocaleString()}`,
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const chartData = [
    {
      name: "Info",
      value: logs.filter((l) => l.type === "info").length,
      color: "#3b82f6",
    },
    {
      name: "Warning",
      value: logs.filter((l) => l.type === "warning").length,
      color: "#f59e0b",
    },
    {
      name: "Error",
      value: logs.filter((l) => l.type === "error").length,
      color: "#ef4444",
    },
  ];

  const registerNewDevice = async (newId) => {
    try {
      await setDoc(doc(db, "devicesPet", newId), {
        status: "disconnected",
        lifecycle: "available", // Se registra como disponible para vinculación
        linked_user_id: null,
        foodLevel: 0,
        createdAt: new Date().toISOString(),
      });

      // Log de auditoría
      await addDoc(collection(db, "system_logs"), {
        action: "DEVICE_PROVISIONED",
        details: `Nuevo dispositivo registrado en sistema: ${newId}`,
        type: "info",
        timestamp: new Date(),
      });

      toast.success("Equipo provisionado correctamente");
    } catch (error) {
      toast.error("Error al registrar equipo");
    }
  };

  useEffect(() => {
    // Fuentes actuales
    const qDevice = query(
      collection(db, "device_logs"),
      orderBy("timestamp", "desc"),
      limit(100),
    );
    const qUser = query(
      collection(db, "system_logs"),
      orderBy("timestamp", "desc"),
      limit(100),
    );

    let deviceArr = [];
    let userArr = [];

    const mergeLogs = () => {
      const combined = [...deviceArr, ...userArr].sort(
        (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0),
      );
      setLogs(combined);
    };

    const unsubDevice = onSnapshot(qDevice, (snap) => {
      deviceArr = snap.docs.map((doc) => ({
        id: doc.id,
        origin: "DEVICE",
        ...doc.data(),
      }));
      mergeLogs();
    });

    const unsubUser = onSnapshot(qUser, (snap) => {
      userArr = snap.docs.map((doc) => {
        const data = doc.data();
        let normalizedType = (data.type || "info").toLowerCase();

        if (normalizedType === "success") normalizedType = "info";

        return {
          id: doc.id,
          origin: "USER_ACTION",
          ...data,
          type: normalizedType,
        };
      });
      mergeLogs();
    });

    return () => {
      unsubDevice();
      unsubUser();
    };
  }, []);

  // Filtro inteligente
  const filteredLogs = logs.filter((log) => {
    const matchesType = filter === "all" || log.type === filter;
    const searchContent =
      `${log.action} ${log.details} ${log.deviceId || ""} ${log.userEmail || ""}`.toLowerCase();
    return matchesType && searchContent.includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h2>
              <RiTerminalBoxLine /> Consola Unificada
            </h2>
            <div className={styles.actions}>
              <button onClick={exportToCSV} className={styles.btnExport}>
                <RiDownload2Line /> Exportar CSV
              </button>
            </div>
          </div>
        </header>

        {/* MINI ANALÍTICA CON RECHARTS */}
        <div className={styles.analyticsMini}>
          <div className={styles.chartInfo}>
            <h4>
              <RiPieChartLine /> Distribución de Eventos
            </h4>
            <p>Resumen visual del estado actual del sistema</p>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2>
            <RiTerminalBoxLine /> Centro de Mensajería Global
          </h2>
          <p>Historial unificado de dispositivos y gestión de usuarios</p>
        </div>

        <div className={styles.toolBar}>
          <div className={styles.search}>
            <RiSearchLine />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterChips}>
            {["all", "info", "warning", "error"].map((t) => (
              <button
                key={t}
                className={filter === t ? styles.active : ""}
                onClick={() => setFilter(t)}
              >
                {t === "all" ? "Ver Todo" : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.logTable}>
        <div className={styles.tableHeader}>
          <span>NIVEL</span>
          <span>ORIGEN</span>
          <span>SUJETO</span>
          <span>ACCIÓN REALIZADA</span>
          <span>DETALLES</span>
          <span>HORA EXACTA</span>
        </div>

        <div className={styles.tableBody}>
          {filteredLogs.map((log) => (
            <div key={log.id} className={`${styles.row} ${styles[log.type]}`}>
              <div className={styles.colType}>
                {log.type === "error" ? (
                  <RiErrorWarningLine className={styles.err} />
                ) : log.type === "warning" ? (
                  <RiAlertLine className={styles.warn} />
                ) : (
                  <RiInformationLine className={styles.info} />
                )}
              </div>
              <div className={styles.colOrigin}>
                {log.origin === "DEVICE" ? (
                  <span className={styles.badgeDevice}>
                    <RiCpuLine /> HARDWARE
                  </span>
                ) : (
                  <span className={styles.badgeUser}>
                    <RiUserSettingsLine /> USUARIO
                  </span>
                )}
              </div>
              <div className={styles.colSubject}>
                <code>
                  {log.origin === "DEVICE"
                    ? log.deviceId
                    : log.userEmail || "Admin"}
                </code>
              </div>
              <div className={styles.colAction}>
                <strong>{log.action}</strong>
              </div>
              <div className={styles.colDetails}>{log.details}</div>
              <div className={styles.colTime}>
                {log.timestamp
                  ?.toDate()
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
