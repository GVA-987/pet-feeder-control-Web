import React, { useState, useEffect } from 'react';
import styles from './Home.module.scss';
import {useAuth} from '../../../context/AuthContext'
import {doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, where, query, orderBy, Timestamp} from 'firebase/firestore';
import { getDatabase, ref, onValue, off, update } from "firebase/database";
import { db, rtdb } from '../../../firebase/firebase-config';
import { PiWifiHighFill, PiWifiSlashFill, PiThermometerSimple, PiTimer, PiWifiHigh } from "react-icons/pi";
import { MdAccessTime, MdInfoOutline } from 'react-icons/md';
import moment from 'moment';
import CircularProgressBar from '../../common/CircularProgressBar/CircularProgressBar';
import FormFood from '../../common/form/Form';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import toast, { Toaster } from 'react-hot-toast';
import '../../../scss/base/_toasts.scss';

moment.locale('es');

const getWifiQuality = (rssi) => {
    if (!rssi || rssi === '--') return { quality: 'Desconocido', level: 0, style: styles.unknown, icon: <PiWifiSlashFill /> };
    const rssiNum = parseInt(rssi);
    if (rssiNum >= -50) {
        return { quality: 'Excelente', level: 4, style: styles.excellent, icon: <PiWifiHighFill /> };
    } else if (rssiNum >= -60) {
        return { quality: 'Buena', level: 3, style: styles.good, icon: <PiWifiHighFill /> };
    } else if (rssiNum >= -70) {
        return { quality: 'Aceptable', level: 2, style: styles.acceptable, icon: <PiWifiHighFill /> };
    } else {
        return { quality: 'Débil', level: 1, style: styles.poor, icon: <PiWifiSlashFill /> };
    }
};

const getNextDosage = (schedules) => {
    if (!schedules || schedules.length === 0) return null;

    const ahora = moment();
    const diaHoy = ahora.day(); // 0 = Domingo, 1 = Lunes...
    const horariosDeHoy = schedules.filter(s => s.days && s.days.includes(diaHoy));

    if (horariosDeHoy.length === 0) return null;

    const proximos = horariosDeHoy
        .map(s => ({
            ...s,
            fechaMoment: moment(s.time, "HH:mm")
        }))
        .filter(s => s.fechaMoment.isAfter(ahora))
        .sort((a, b) => a.fechaMoment.diff(b.fechaMoment));
    return proximos.length > 0 ? proximos[0] : null;
};

const getOnline = (online) => {
  if (online === "conectado") {
    return { style: styles.connected};
  }
  else if (online === "desconectado") {
    return { style: styles.disconnected};
  }
  return { style: styles.unknown};
}

const formatTemperature = (temp) => {
    if (temp === '--') return '--';
    return parseFloat(temp).toFixed(1);
};

function HomeControl() {

  const { currentUser } = useAuth();
  const [deviceData, setDeviceData] = useState(null);
  const [rtdbData, setRtdbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [petData, setPetData] = useState({ name: '', breed: '', age: '', weight: '' });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [foodPortion, setFoodPortion] = useState('');
  const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const [isProcessing, setIsProcessing] = useState(false);
  
  //obtener datos de firestore
  useEffect(() => {
    if (!currentUser?.deviceId) return;

    const fetchInitialData = async () => {
      try {
        // Datos de la mascota
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setPetData(userDocSnap.data().pets || { name: '', breed: '', age: '', weight: '' });
        }

        // Historial inicial
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const histQuery = query(
          collection(db, 'dispense_history'),
          where('deviceId', '==', currentUser.deviceId),
          where('timestamp', '>=', Timestamp.fromDate(inicioHoy)),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(histQuery);
        setHistory(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error inicial:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser?.deviceId]);

// obtener datos de RTDB
useEffect(() => {
    if (!currentUser?.deviceId) return;

    const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
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
      off(statusRef, 'value', unsubRTDB);
    };
  }, [currentUser?.deviceId]);

  useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

  // Obtener historial de dispensado
  const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';

        let date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } 
        else if (timestamp instanceof Date) {
            date = timestamp;
        }

        else if (typeof timestamp === 'number') {
            const dateInMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            date = new Date(dateInMs);
        } 
        else {
            return 'N/A';
        }

    // Formatear fecha en español y hora 24h
        return date.toLocaleString('es-ES', {
            // year: 'numeric',
            // month: 'short',
            // day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

  // Función para dispensar alimento
  const handleDispenseNow = async (e) => {
    e.preventDefault();
    if (!currentUser?.deviceId || isProcessing || !foodPortion) return;

    try {
      setIsProcessing(true);
      const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);

      await update(deviceRefRTDB, {
        dispense_manual: "activado",
        food_portion: String(foodPortion),
      });

      await addDoc(collection(db, 'system_logs'), {
          action: 'DISPENSACION_MANUAL',
          details: `Usuario ${currentUser.email} dispensó ${foodPortion} porciones.`,
          deviceId: currentUser.deviceId,
          uid: currentUser.uid,
          userEmail: currentUser.email,
          timestamp: serverTimestamp(),
          type: 'info'
      });

      toast.success('Dosificando Alimento', { className: 'custom-toast-success', });
      setFoodPortion('');
    }catch(error) {
      console.error('Error:', error);
      toast.error('Error al conectar',  { className: 'custom-toast-error', });
    } finally {
        setTimeout(() => setIsProcessing(false), 3000);
    }
  }

  // Verificar si el usuario está cargando
  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  // Verificar si el usuario tiene un dispositivo
  if (!currentUser.deviceId) {
  return (
    <div className={styles.noDevice}>
      <MdInfoOutline />
      <h2>No tienes ningún equipo registrado.</h2>
      <p>Por favor, enlaza un equipo para ver el panel de control.</p>
    </div>
    );
  }
  if(loading) {
    return <div className={styles.loading}>Cargando Panel de Control...</div>;
  }
  if(!deviceData) {
    return <div className={styles.noData}>No se pudo cargar la informacion del dispositivo</div>
  }

  // Calcular el porcentaje de comida de la tolba
    const calculateFoodPercentage = (rawValue) => {
      if (rawValue === null || rawValue === undefined || rawValue === '--') return 0;
      
      const DISTANCIA_LLENO = 200.0; // Mayor valor mas comida
      const DISTANCIA_VACIO = 65.0; // Menor valor menos comida

      if (rawValue <= DISTANCIA_VACIO) return 0;
      
      if (rawValue >= DISTANCIA_LLENO) return 100;

      const percentage = ((rawValue - DISTANCIA_VACIO) / (DISTANCIA_LLENO - DISTANCIA_VACIO)) * 100;
      
      return Math.round(percentage);
    };

    const lastSeenSeconds = rtdbData?.lastSeen || 0; // en segundos
    const lastSeenMs = lastSeenSeconds * 1000; // convertir a milisegundos
    const CONNECTION_THRESHOLD_MS = 16000; // 16 segundos
    const isRecentlySeen = (currentTime - lastSeenMs) < CONNECTION_THRESHOLD_MS; // true si se vio recientemente
    const isDataAvailable = rtdbData !== null; // true si hay datos disponibles
    const finalConnectionStatus = isRecentlySeen && isDataAvailable;  // estado final de conexión
    // const foodLevel = 50;
    
    const rawFoodLevel = rtdbData?.foodLevel || 0;
    const foodLevel = calculateFoodPercentage(rawFoodLevel);
    const rssi = rtdbData?.rssi || "--";
    const chipTemp = rtdbData?.temperature || "--";
    const uptime = rtdbData?.uptime || "--";
    const schedule = deviceData.schedule || [];
    const online = rtdbData?.online;

    const onlineStatus = getOnline(online);
    const wifiStatus = getWifiQuality(rssi);
    const formattedTemp = formatTemperature(chipTemp);
    const ahora = moment(currentTime);
    const diaHoy = ahora.day();
    const proximaComida = getNextDosage(schedule);
    const eventosHoy = schedule
        .filter(item => item.days && item.days.includes(diaHoy))
        .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

  
  // input porcion comida
  const fieldFood = [
    {
      type: 'numeric',
      placeholder: 'Porción de comida',
      value: foodPortion,
      onChange: (e) => setFoodPortion(e.target.value),
      required: true,
      inputClassName: styles.inputPortion,
      containerClassName: styles.contenerInputPortion,
      unstyled: true,
    }
  ]

  return (
    <div className={styles.HomeContainer}>

        <div className={styles.contentHome}>

          {/* Tarjeta: nivel de comida y dosificación manual */}
          <div className={`${styles.card} ${styles['card-food-control']}`}>
            <h2>Nivel de Comida y Control</h2>
            <div className={styles.foodControls}>
              <CircularProgressBar percentage={foodLevel} className={styles.myProgress} />
              <FormFood
                fields={fieldFood}
                onSubmit={handleDispenseNow}
                submitButtonText={isProcessing ? "Procesando..." : "Dosificar"}
                buttonPosition = "top"
                isLoading={isProcessing}
                // isLoading={loading}
              />
            </div>
          </div>

          {/* Tarjeta: informacion de la mascot */}
          <div className={`${styles.card} ${styles['card-pet-info']}`}>
              <h2>Mascota</h2>
              <p><label>Nombre:</label> {petData.name}</p>
              <p><label>Edad:</label> {petData.age}</p>
              <p><label>Raza:</label> {petData.breed}</p>
              <p><label>Peso:</label> {petData.weight}</p>
            </div>

          {/* Tarjeta: Estado del equipo */}
          <div className={`${styles.card} ${styles['card-device-status']}`}>
                    <h2>Estado del Dispositivo</h2>
                    <div className={styles.deviceStatus}>
                        <p>
                            <strong className={onlineStatus.style || ''}>
                                {online || 'Cargando...'}
                            </strong>
                        </p>
                        <p>
                            <label>
                              <PiWifiHigh /> Wi-Fi:
                            </label>
                            <strong className={wifiStatus.style}>
                                {wifiStatus.quality} ({rssi} dBm)
                            </strong>
                        </p>
                        <p>
                            <label><PiThermometerSimple /> Temperatura: </label>
                            <strong> {formattedTemp}°C</strong>
                        </p>
                        <p>
                            <label><PiTimer /> Tiempo Activo : </label>
                            <strong> {uptime || '--'}</strong>
                        </p>
                    </div>
                </div>

            {/* Tarjeta: Historial Resumen*/}
            <div className={`${styles.card} ${styles['card-activity']}`}>
              <h2>Actividad Reciente</h2>
              <div className={styles.historyContainer}>
                {history.length > 0 ? (
                  <div>
                    {history.map((item) => (
                      <div key={item.id} className={styles.historyItem}>
                        <p> {formatTimestamp(item.timestamp)} </p>
                        <strong>{item.type === 'manual' ? 'Dispensado Manual' : 'Dispensado Programada'}</strong>
                        <p> {item.portion} porcion(es) </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay registro de dispensacion aún.</p>
                )}
              </div>
            </div>

            {/* Tarjeta: Horarios Programados */}
            <div className={`${styles.card} ${styles['card-schedule-today']}`}>
                {/* <h2>Agenda de Hoy ({DIAS_SEMANA[diaHoy]})</h2> */}
                <h2>Agenda de Hoy</h2>
                    
                    {proximaComida ? (
                        <div className={styles.nextEvent}>
                            <MdAccessTime className={styles.iconTime} />
                            <div>
                                <p>Siguiente dosis a las:</p>
                                <h3>{proximaComida.time} hrs</h3>
                                <span>{proximaComida.portion} porción(es)</span>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.allDone}>Comidas completadas por hoy.</p>
                    )}

                    <div className={styles.todayList}>
                        {eventosHoy.map((item, index) => {
                            const haPasado = moment(item.time, "HH:mm").isBefore(ahora);
                            return (
                                <div key={index} className={`${styles.todayItem} ${haPasado ? styles.passed : ''}`}>
                                    <span className={styles.timeBadge}>{item.time}</span>
                                    <div className={styles.itemInfo}>
                                        <strong>{item.portion} porción(es)</strong>
                                        <small>{haPasado ? 'Entregado' : 'Pendiente'}</small>
                                    </div>
                                    {haPasado && <span className={styles.check}>✔</span>}
                                </div>
                            );
                        })}
                    </div>

            </div>
        </div>
    </div>
  );
}

export default HomeControl;