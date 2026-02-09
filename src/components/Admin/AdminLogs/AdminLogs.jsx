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
  const [logSources, setLogSources] = useState({ devices: [], users: [] });
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

  const normalizeData = (doc, origin) => {
    const data = doc.data();

    // Forzamos minúsculas y manejamos nulos
    let rawType = (data.type || data.level || "info").toLowerCase();

    // Mapeo de sinónimos de errores/éxitos
    if (["success", "ok", "done"].includes(rawType)) rawType = "info";
    if (["critical", "fatal", "emergency"].includes(rawType)) rawType = "error";

    return {
      id: doc.id,
      origin: origin, // "DEVICE" o "USER_ACTION"
      ...data,
      type: rawType, // Tipo normalizado para el filtro y CSS
      // Campo unificado para mostrar en la columna "SUJETO"
      displaySubject:
        data.deviceId ||
        data.userEmail ||
        data.attemptedEmail ||
        data.userId ||
        "Sistema",
      // Timestamp seguro para ordenar
      sortTime: data.timestamp?.seconds || 0,
    };
  };

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
    const qDevice = query(
      collection(db, "device_logs"),
      orderBy("timestamp", "desc"),
      limit(400),
    );
    const qUser = query(
      collection(db, "system_logs"),
      orderBy("timestamp", "desc"),
      limit(400),
    );

    let deviceArr = [];
    let userArr = [];

    const mergeLogs = () => {
      // Combinar y ordenar por tiempo real de Firebase
      const combined = [...deviceArr, ...userArr].sort(
        (a, b) => b.sortTime - a.sortTime,
      );
      setLogs(combined);
    };

    const unsubDevice = onSnapshot(qDevice, (snap) => {
      deviceArr = snap.docs.map((doc) => normalizeData(doc, "DEVICE"));
      mergeLogs();
    });

    const unsubUser = onSnapshot(qUser, (snap) => {
      userArr = snap.docs.map((doc) => normalizeData(doc, "USER_ACTION"));
      mergeLogs();
    });

    return () => {
      unsubDevice();
      unsubUser();
    };
  }, []);

  // 2. FILTRO INTELIGENTE (Busca en cualquier parte del objeto)
  const filteredLogs = logs.filter((log) => {
    const matchesType = filter === "all" || log.type === filter;

    // Buscamos en el ID, Acción, Detalles y Sujeto al mismo tiempo
    const searchableText = `
      ${log.action} 
      ${log.details} 
      ${log.displaySubject} 
      ${log.type}
    `.toLowerCase();

    return matchesType && searchableText.includes(searchTerm.toLowerCase());
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
          <span>FECHA HORA</span>
        </div>

        <div className={styles.containerTable}>
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
                      : log.userEmail || log.attemptedEmail || "Admin"}
                  </code>
                </div>
                <div className={styles.colAction}>
                  <strong>{log.action}</strong>
                </div>
                <div className={styles.colDetails}>{log.details}</div>
                <div className={styles.colTime}>
                  {log.timestamp
                    ? log.timestamp.toDate().toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Sin fecha"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
