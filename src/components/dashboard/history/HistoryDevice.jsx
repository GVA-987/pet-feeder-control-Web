import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import { useAuth } from "../../../context/AuthContext";
import styles from "./HistoryDevice.module.scss";
import {
  MdAccessTime,
  MdInfoOutline,
  MdFileDownload,
  MdHistory,
} from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const HistoryPage = () => {
  const { currentUser } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.deviceId) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "dispense_history"),
          where("deviceId", "==", currentUser.deviceId),
          // Quitamos el filtro de userId si quieres que todos en la familia vean el historial
          orderBy("timestamp", "desc"),
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistory(data);
        setFilteredHistory(data);
      } catch (error) {
        console.error("Error al obtener el historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  useEffect(() => {
    const now = new Date();
    const filtered = history.filter((item) => {
      if (filterRange === "all") return true;
      const itemDate = item.timestamp?.toDate
        ? item.timestamp.toDate()
        : new Date(item.timestamp);
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);

      if (filterRange === "today")
        return itemDate.toDateString() === now.toDateString();
      if (filterRange === "week") return diffDays <= 7;
      if (filterRange === "month") return diffDays <= 30;

      if (filterRange === "custom") {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    });
    setFilteredHistory(filtered);
  }, [filterRange, startDate, endDate, history]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateChartData = (hist) => {
    const dailyDataMap = hist.reduce((acc, item) => {
      if (!item.timestamp) return acc;
      const dateObj = item.timestamp.toDate
        ? item.timestamp.toDate()
        : new Date(item.timestamp);
      const dateLabel = dateObj.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });

      if (!acc[dateLabel]) acc[dateLabel] = { manual: 0, programado: 0 };

      const grams = parseFloat(item.portion) || 0;
      if (item.type === "manual") {
        acc[dateLabel].manual += grams;
      } else {
        acc[dateLabel].programado += grams;
      }
      return acc;
    }, {});

    const barData = Object.keys(dailyDataMap)
      .map((key) => ({
        date: key,
        Manual: Math.round(dailyDataMap[key].manual),
        Programado: Math.round(dailyDataMap[key].programado),
      }))
      .reverse()
      .slice(-7);

    return {
      barData,
      kpis: {
        totalEvents: hist.length,
        totalGrams: hist
          .reduce((sum, item) => sum + (parseFloat(item.realGrams) || 0), 0)
          .toFixed(0),
      },
    };
  };

  const handleGenerateReport = () => {
    const headers = [
      "Fecha y Hora",
      "Gramos Consumidos (Real)",
      "Gramos Programados",
      "Tipo",
    ];

    // Usamos filteredHistory para que el CSV respete el filtro de fecha actual
    const csvRows = filteredHistory.map((item) =>
      [
        `"${formatTimestamp(item.timestamp)}"`,
        `${item.realGrams}g`,
        `${item.requestedGrams}g`,
        item.type === "manual" ? "Manual" : "Programada",
      ].join(","),
    );

    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `reporte_consumo_${filterRange}_${new Date().toISOString().split("T")[0]}.csv`;
    link.download = fileName;
    link.click();
  };

  const { barData, kpis } = calculateChartData(filteredHistory);

  if (loading)
    return <div className={styles.loading}>Cargando historial...</div>;

  return (
    <div className={styles.containerHistory}>
      <header className={styles.header}>
        <button className={styles.reportButton} onClick={handleGenerateReport}>
          <MdFileDownload /> Reporte ({filteredHistory.length})
        </button>
        <div className={styles.filterControls}>
          <div className={styles.filterBar}>
            {["today", "week", "month", "custom", "all"].map((range) => (
              <button
                key={range}
                className={filterRange === range ? styles.active : ""}
                onClick={() => {
                  setFilterRange(range);
                  if (range === "custom") {
                    const today = new Date().toISOString().split("T")[0];
                    setEndDate(today);
                    // Opcionalmente poner startDate una semana atrás por defecto
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    setStartDate(lastWeek.toISOString().split("T")[0]);
                  }
                }}
              >
                {range === "today"
                  ? "Hoy"
                  : range === "week"
                    ? "7 Días"
                    : range === "month"
                      ? "Mes"
                      : range === "custom"
                        ? "Calendario"
                        : "Todo"}
              </button>
            ))}
          </div>
          {filterRange === "custom" && (
            <div className={styles.datePickerContainer}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
              <span>al</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </header>

      <section className={styles.dashboard}>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span>Total Porciones</span>
            <h3>{kpis.totalEvents}</h3>
          </div>
          <div className={styles.kpiCard}>
            <span>Total Gramos</span>
            <h3>{kpis.totalGrams} g</h3>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Porciones de Alimentacion</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#444"
              />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Legend iconType="circle" />
              {/* StackId="a" hace que se apilen una encima de otra */}
              <Bar
                dataKey="Programado"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Manual"
                stackId="a"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.tableSection}>
        <h3>Registros Recientes</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Cantidad Real</th>
                <th>Cantidad Programada</th>
                <th>Porcion</th>
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
                  <td>
                    <strong>{parseFloat(item.realGrams).toFixed(2)} g</strong>
                  </td>
                  <td>
                    <strong>
                      {parseFloat(item.requestedGrams).toFixed(2)} g
                    </strong>
                  </td>
                  <td>{item.portion} porción</td>
                  <td>
                    <span
                      className={
                        item.type === "manual"
                          ? styles.tagManual
                          : styles.tagScheduled
                      }
                    >
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
