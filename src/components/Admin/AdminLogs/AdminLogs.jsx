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
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [originFilter, setOriginFilter] = useState("all");

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No hay datos para exportar con los filtros actuales.");
      return;
    }

    // 1. Definir cabeceras
    const headers = [
      "ID",
      "Origen",
      "Acción",
      "Detalles",
      "Tipo",
      "Sujeto",
      "Fecha",
    ];

    const rows = filteredLogs.map((log) => {
      const cleanDetails = log.details?.replace(/,/g, ";") || "N/A";
      const date = log.timestamp?.toDate().toISOString() || "N/A";

      return [
        log.id,
        log.origin,
        log.action,
        cleanDetails,
        log.type.toUpperCase(),
        log.displaySubject,
        date,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `Reporte_Logs_${filter}_${new Date().toISOString().split("T")[0]}.csv`;

    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(
      `Reporte generado: ${filteredLogs.length} registros exportados.`,
    );
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
      origin: origin,
      ...data,
      type: rawType,

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

  const filteredLogs = logs.filter((log) => {
    const matchesType = filter === "all" || log.type === filter;
    const matchesOrigin = originFilter === "all" || log.origin === originFilter;

    const logDate = log.timestamp?.toDate();
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    if (endDate) endDate.setHours(23, 59, 59, 999);

    const matchesDate =
      (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);

    const searchableText =
      `${log.action} ${log.details} ${log.displaySubject}`.toLowerCase();

    return (
      matchesType &&
      matchesOrigin &&
      matchesDate &&
      searchableText.includes(searchTerm.toLowerCase())
    );
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
              <button
                onClick={exportToCSV}
                className={styles.btnExport}
                disabled={filteredLogs.length === 0}
              >
                <RiDownload2Line />
                Exportar {filteredLogs.length} registros
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
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
          >
            <option value="all">Todo Origen</option>
            <option value="DEVICE">Hardware</option>
            <option value="USER_ACTION">Usuarios</option>
          </select>

          <div className={styles.datePickerGroup}>
            <div className={styles.dateInput}>
              <span>Desde:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div className={styles.dateInput}>
              <span>Hasta:</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button
                className={styles.btnReset}
                onClick={() => setDateRange({ start: "", end: "" })}
                title="Limpiar fechas"
              >
                ×
              </button>
            )}
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
