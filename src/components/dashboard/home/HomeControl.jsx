import React, { useState, useEffect } from "react";
import styles from "./Home.module.scss";
import { useAuth } from "../../../context/AuthContext";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  where,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getDatabase, ref, onValue, off, update } from "firebase/database";
import { db, rtdb } from "../../../firebase/firebase-config";
import {
  PiWifiHighFill,
  PiWifiSlashFill,
  PiThermometerSimple,
  PiTimer,
  PiWifiHigh,
} from "react-icons/pi";
import { MdAccessTime, MdInfoOutline } from "react-icons/md";
import { FaPaw } from "react-icons/fa";
import moment from "moment";
import CircularProgressBar from "../../common/CircularProgressBar/CircularProgressBar";
import FormFood from "../../common/form/Form";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast, { Toaster } from "react-hot-toast";
import "../../../scss/base/_toasts.scss";

moment.locale("es");

const getWifiQuality = (rssi) => {
  if (!rssi || rssi === "--")
    return { quality: "Desconectado", percent: 0, level: 0 };

  const rssiNum = parseInt(rssi);
  let percent;

  // Fórmula de mapeo estándar para RSSI a Porcentaje
  if (rssiNum <= -100) percent = 0;
  else if (rssiNum >= -50) percent = 100;
  else percent = 2 * (rssiNum + 100);

  let quality = "Débil";
  let level = 1;
  if (percent > 80) {
    quality = "Excelente";
    level = 4;
  } else if (percent > 60) {
    quality = "Buena";
    level = 3;
  } else if (percent > 30) {
    quality = "Aceptable";
    level = 2;
  }

  return { quality, percent, level };
};

const getTempStatus = (temp) => {
  if (temp === "--") return { label: "N/A", color: "#94a3b8", percent: 0 };

  const t = parseFloat(temp);
  let label = "Normal";
  let color = "#10b981";

  if (t > 70) {
    label = "Crítico";
    color = "#ef4444";
  } else if (t > 55) {
    label = "Caliente";
    color = "#f59e0b";
  }

  const percent = Math.min(Math.max(t, 0), 100);

  return { label, color, percent };
};

const getNextDosage = (schedules) => {
  if (!schedules || schedules.length === 0) return null;

  const ahora = moment();
  const diaHoy = ahora.day(); // 0 = Domingo, 1 = Lunes...
  const horariosDeHoy = schedules.filter(
    (s) => s.days && s.days.includes(diaHoy),
  );

  if (horariosDeHoy.length === 0) return null;

  const proximos = horariosDeHoy
    .map((s) => ({
      ...s,
      fechaMoment: moment(s.time, "HH:mm"),
    }))
    .filter((s) => s.fechaMoment.isAfter(ahora))
    .sort((a, b) => a.fechaMoment.diff(b.fechaMoment));
  return proximos.length > 0 ? proximos[0] : null;
};

const getOnline = (online) => {
  if (online === "conectado") {
    return { style: styles.connected };
  } else if (online === "desconectado") {
    return { style: styles.disconnected };
  }
  return { style: styles.unknown };
};

const formatTemperature = (temp) => {
  if (temp === "--") return "--";
  return parseFloat(temp).toFixed(1);
};

function HomeControl() {
  const { currentUser } = useAuth();
  const [deviceData, setDeviceData] = useState(null);
  const [rtdbData, setRtdbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [petData, setPetData] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
  });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [foodPortion, setFoodPortion] = useState("");
  const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const [isProcessing, setIsProcessing] = useState(false);
  const getProgressColor = (percent) => {
    if (percent > 50) return "#10b981";
    if (percent > 20) return "#f59e0b";
    return "#ef4444";
  };

  useEffect(() => {
    if (!currentUser?.deviceId) return;

    const fetchInitialData = async () => {
      try {
        const deviceRef = doc(db, "devicesPet", currentUser.deviceId);
        const deviceSnap = await getDoc(deviceRef);
        if (deviceSnap.exists()) {
          setPetData(
            deviceSnap.data().pets || {
              name: "",
              breed: "",
              age: "",
              weight: "",
            },
          );
        }

        // Historial inicial
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const histQuery = query(
          collection(db, "dispense_history"),
          where("deviceId", "==", currentUser.deviceId),
          where("userId", "==", currentUser.uid),
          where("timestamp", ">=", Timestamp.fromDate(inicioHoy)),
          orderBy("timestamp", "desc"),
        );
        const querySnapshot = await getDocs(histQuery);
        setHistory(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error inicial:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser?.deviceId]);

  useEffect(() => {
    if (!currentUser?.deviceId) return;

    const deviceRef = doc(db, "devicesPet", currentUser.deviceId);
    const unsubFirestore = onSnapshot(deviceRef, (docSnap) => {
      if (docSnap.exists()) setDeviceData(docSnap.data());
    });

    const dbRT = getDatabase();
    const statusRef = ref(dbRT, `${currentUser.deviceId}/status`);
    const unsubRTDB = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) setRtdbData(snapshot.val());
    });

    return () => {
      unsubFirestore();
      off(statusRef, "value", unsubRTDB);
    };
  }, [currentUser?.deviceId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "number") {
      const dateInMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      date = new Date(dateInMs);
    } else {
      return "N/A";
    }

    return date.toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Función para dispensar alimento
  const handleDispenseNow = async (e) => {
    e.preventDefault();
    if (!finalConnectionStatus) {
      toast.error("No se puede dosificar: El equipo está offline", {
        id: "offline-error",
      });
      return;
    }
    if (!currentUser?.deviceId || isProcessing || !foodPortion) return;

    try {
      setIsProcessing(true);
      const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);

      await update(deviceRefRTDB, {
        dispense_manual: "activado",
        food_portion: String(foodPortion),
      });

      await addDoc(collection(db, "system_logs"), {
        action: "DISPENSACION_MANUAL",
        details: `Usuario ${currentUser.email} dispensó ${foodPortion} porciones.`,
        deviceId: currentUser.deviceId,
        uid: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: serverTimestamp(),
        type: "info",
      });

      toast.success("Dosificando Alimento", {
        className: "custom-toast-success",
      });
      setFoodPortion("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al conectar", { className: "custom-toast-error" });
    } finally {
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  if (!currentUser.deviceId) {
    return (
      <div className={styles.noDevice}>
        <MdInfoOutline />
        <h2>No tienes ningún equipo registrado.</h2>
        <p>Por favor, enlaza un equipo para ver el panel de control.</p>
      </div>
    );
  }
  if (loading) {
    return <div className={styles.loading}>Cargando Panel de Control...</div>;
  }
  if (!deviceData) {
    return (
      <div className={styles.noData}>
        No se pudo cargar la informacion del dispositivo
      </div>
    );
  }

  const calculateFoodPercentage = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "--")
      return 0;

    const DISTANCIA_LLENO = 200.0; // Mayor valor mas comida
    const DISTANCIA_VACIO = 65.0; // Menor valor menos comida

    if (rawValue <= DISTANCIA_VACIO) return 0;

    if (rawValue >= DISTANCIA_LLENO) return 100;

    const percentage =
      ((rawValue - DISTANCIA_VACIO) / (DISTANCIA_LLENO - DISTANCIA_VACIO)) *
      100;

    return Math.round(percentage);
  };

  const lastSeenSeconds = rtdbData?.lastSeen || 0; // en segundos
  const lastSeenMs = lastSeenSeconds * 1000; // convertir a milisegundos
  const CONNECTION_THRESHOLD_MS = 16000; // 16 segundos
  const isRecentlySeen = currentTime - lastSeenMs < CONNECTION_THRESHOLD_MS; // true si se vio recientemente
  const isDataAvailable = rtdbData !== null; // true si hay datos disponibles

  // const foodLevel = 50;

  const rawFoodLevel = rtdbData?.foodLevel || 0;
  const foodLevel = calculateFoodPercentage(rawFoodLevel);
  const rssi = rtdbData?.rssi || "--";
  const chipTemp = rtdbData?.temperature || "--";
  const uptime = rtdbData?.uptime || "--";
  const schedule = deviceData.schedule || [];
  const online = rtdbData?.online;

  const finalConnectionStatus = online === "conectado"; // estado final de conexión

  const onlineStatus = getOnline(online);
  const wifiStatus = getWifiQuality(rssi);
  const formattedTemp = formatTemperature(chipTemp);
  const ahora = moment(currentTime);
  const diaHoy = ahora.day();
  const proximaComida = getNextDosage(schedule);
  const eventosHoy = schedule
    .filter((item) => item.days && item.days.includes(diaHoy))
    .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

  const todayStr = new Date().toISOString().split("T")[0];
  const agendaHoy = (deviceData?.schedule || [])
    .filter((item) => item.days && item.days.includes(diaHoy))
    .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

  const WifiIndicator = ({ rssi }) => {
    const { quality, percent, level } = getWifiQuality(rssi);

    return (
      <div className={styles.wifiContainer}>
        <div className={styles.bars}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`${styles.bar} ${level >= bar ? styles.active : ""}`}
            />
          ))}
        </div>
        <div className={styles.wifiInfo}>
          <span>{percent}%</span>
          <strong>{quality}</strong>
        </div>
      </div>
    );
  };

  const TempIndicator = ({ temp }) => {
    const { label, color, percent } = getTempStatus(temp);

    return (
      <div className={styles.tempContainer}>
        <div className={styles.thermometer}>
          <div
            className={styles.fill}
            style={{ height: `${percent}%`, backgroundColor: color }}
          />
        </div>
        <div className={styles.tempInfo}>
          <strong>{temp !== "--" ? `${temp}°C` : "--"}</strong>
          <span style={{ color: color }}>{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.HomeContainer}>
      {!finalConnectionStatus && (
        <div className={styles.offlineBanner}>
          <PiWifiSlashFill />
          <span>
            El alimentador <strong>Pet-GVA</strong> no responde. Comprueba la
            conexión del equipo.
          </span>
        </div>
      )}
      <div
        className={styles.contentHome}
        style={{ opacity: finalConnectionStatus ? 1 : 0.85 }}
      >
        <div className={styles.leftColumns}>
          <section className={`${styles.card} ${styles["card-food-control"]}`}>
            <h2 style={{ marginBottom: "0" }}>Nivel de Tolva</h2>
            <div className={styles.foodControlWrapper}>
              <div className={styles.progressContainer}>
                <CircularProgressBar
                  percentage={foodLevel}
                  color={getProgressColor(foodLevel)}
                />
              </div>

              <div className={styles.centerAction}>
                <button
                  className={`${styles.btnCircular} ${!finalConnectionStatus ? styles.btnDisabled : ""}`}
                  onClick={handleDispenseNow}
                  disabled={isProcessing || !finalConnectionStatus}
                  title={
                    finalConnectionStatus
                      ? "Dosificar Alimento"
                      : "Equipo desconectado"
                  }
                >
                  <FaPaw />
                </button>
                <span
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {isProcessing ? "Procesando..." : "Dosificar"}
                </span>
                <input
                  type="number"
                  className={styles.inputMinimalist}
                  placeholder="Porciones"
                  value={foodPortion}
                  onChange={(e) => setFoodPortion(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <section className={styles.card}>
              <h2>Agenda de Hoy</h2>
              <div className={styles.agendaList}>
                {agendaHoy.length > 0 ? (
                  agendaHoy.map((item, index) => {
                    const haPasado = moment(item.time, "HH:mm").isBefore(
                      moment(),
                    );
                    return (
                      <div
                        key={index}
                        className={`${styles.scheduledItem} ${haPasado ? styles.passed : ""}`}
                      >
                        <div className={styles.timeBadge}>{item.time}</div>
                        <div className={styles.details}>
                          <strong>{item.portion} Porción(es)</strong>
                          <span>{haPasado ? "Entregado" : "Pendiente"}</span>
                        </div>
                        {haPasado && (
                          <span className={styles.checkIcon}>✔</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.emptyState}>
                    No hay programaciones para hoy.
                  </p>
                )}
              </div>
            </section>
            <section className={styles.card}>
              <h2>Actividad Reciente</h2>
              <div className={styles.historyContainer}>
                {history.length > 0 ? (
                  <div className={styles.activityList}>
                    {history.slice(0, 6).map((item) => (
                      <div key={item.id} className={styles.activityItem}>
                        <div
                          className={`${styles.statusDot} ${item.type === "manual" ? styles.manual : styles.auto}`}
                        ></div>
                        <div className={styles.activityInfo}>
                          <small>{formatTimestamp(item.timestamp)}</small>
                          <strong>
                            {item.type === "manual"
                              ? "Dispensado Manual"
                              : "Programada"}
                          </strong>
                        </div>
                        <span className={styles.portionTag}>
                          {item.portion} porc.
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>Sin registros hoy.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <h2>Mascota</h2>
            <div className={styles.infPetContainer}>
              <div className={styles.infoRow}>
                <label>Nombre</label>
                <strong>{petData.name}</strong>
              </div>
              <div className={styles.infoRow}>
                <label>Raza</label>
                <strong>{petData.breed}</strong>
              </div>
              <div className={styles.infoRow}>
                <label>Edad</label>
                <strong>{petData.age} años</strong>
              </div>
              <div className={styles.infoRow}>
                <label>Peso</label>
                <strong>{petData.weight} Kg</strong>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Dispositivo</h2>
            <div className={styles.statusDevice}>
              <div className={styles.infoRow}>
                <label>Estado</label>
                <span
                  className={
                    online === "conectado"
                      ? styles.connected
                      : styles.disconnected
                  }
                >
                  {online}
                </span>
              </div>
              <div className={styles.infoRow}>
                <label>SSID</label>
                <strong>{rtdbData?.ssid || "No disponible"}</strong>
              </div>
              <div className={styles.infoRow}>
                <label>Señal</label>
                <WifiIndicator rssi={rssi} />
              </div>
              <div className={styles.infoRow}>
                <label>Temp.</label>
                <TempIndicator temp={formattedTemp} />
              </div>
            </div>
          </section>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default HomeControl;
