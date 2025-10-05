import React, { useState, useEffect } from 'react';
//import logo from '../../assets/petlog.png';
import styles from './Home.module.scss';
import {useAuth} from '../../../context/AuthContext'
import {doc, getDoc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, getDocs, where, query, orderBy} from '../../../../node_modules/firebase/firestore';
import { getDatabase, ref, onValue, off, update } from "firebase/database";
import { db, rtdb } from '../../../firebase/firebase-config';
import { PiWifiHighFill, PiWifiSlashFill, PiThermometerSimple, PiTimer, PiWifiHigh } from "react-icons/pi";
import { MdAccessTime, MdInfoOutline } from 'react-icons/md';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

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
        return { quality: 'Débil / Pobre', level: 1, style: styles.poor, icon: <PiWifiSlashFill /> };
    }
};

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
  
  //obtener datos de firestore
  useEffect(() => {
    if(currentUser && currentUser.deviceId) {
      const fetchHistory = async () => {
        
        try {

          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if(userDocSnap.exists()) {
              const useDataDB = userDocSnap.data();
              setPetData(useDataDB.pets || { name: '', breed: '', age: '', weight: '' });
          }

          const hist = query(
            collection(db, 'dispense_history'),
            where('deviceId', '==', currentUser.deviceId),
            orderBy('timestamp', 'desc')
          );
          
          const querySnapshot = await getDocs(hist);
          const historyData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setHistory(historyData);
        } catch (e) {
          console.error("Error al obtener el historial", e);
        } finally {
          setLoading(false);
        }
      }
      
    
      const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
      
      const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
        if(docSnap.exists()){
          setDeviceData(docSnap.data());
          setLoading(false);
        }else{
          console.log("No se encontro el documento del dispositivo.");
          setLoading(false);
        }
        fetchHistory();
      });


    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }else{
    console.log("No se encontro el documento del dispositivo.");
    setLoading(false);
  }
}, [currentUser]);

// obtener datos de RTDB
useEffect(() => {
  if (!currentUser && !currentUser.deviceId) return;

  const dbRT = getDatabase();
  const deviceStatusRef = ref(dbRT, `${currentUser.deviceId}/status`);

  // DALE UN NOMBRE A LA FUNCIÓN DE CALLBACK
  const handleRealtimeData = (snapshot) => {
    if(snapshot.exists()) {
      setRtdbData(snapshot.val());
    }else{
      console.log("No data available in RTDB");
      setRtdbData(null); 
    }
  };

  // USA EL NOMBRE DE LA FUNCIÓN PARA SUSCRIBIRTE
  onValue(deviceStatusRef, handleRealtimeData);

  return () => {
    off(deviceStatusRef, handleRealtimeData);
  };
}, [currentUser])

 // para forzar la actualización del tiempo
  useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

  // Obtener historial de dispensado
  const formatTimestamp = (timestamp) => {
    if (!timestamp || typeof timestamp !== 'number') {
        return 'N/A';
    }
    const dateInMs = timestamp * 1000;
    const date = new Date(dateInMs);
    return date.toLocaleString();
  };

  // Función para dispensar alimento
  const handleDispenseNow = async () => {
    if(!currentUser || !currentUser.deviceId) return;

    try {
      const deviceRefRTDB = ref(rtdb, `${currentUser.deviceId}/commands`);

      await update(deviceRefRTDB, {
        dispense_manual: "activado",
      });

      alert('Alimento dispensado correctamente');
    }catch(error) {
      console.log('Error al dispensar el alimento: ', error);
      alert('Hubo un problema al dispensar el alimento. Intente de nuevo.');
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

    const lastSeenSeconds = rtdbData?.lastSeen || 0;
    const lastSeenMs = lastSeenSeconds * 1000;
    const CONNECTION_THRESHOLD_MS = 16000;
    const isRecentlySeen = (currentTime - lastSeenMs) < CONNECTION_THRESHOLD_MS;
    const isDataAvailable = rtdbData !== null; 
    const finalConnectionStatus = isRecentlySeen && isDataAvailable;  
    const foodLevel = deviceData.food_level || 0;

    const rssi = rtdbData?.rssi || "--";
    const chipTemp = rtdbData?.temperature || "--";
    const uptime = rtdbData?.uptime || "--";
    const schedule = deviceData.schedule || [];

    const wifiStatus = getWifiQuality(rssi);
    const formattedTemp = formatTemperature(chipTemp);


  // Componente para los eventos del calendario
  const EventComponent = ({ event }) => {
  return (
    <div
      style={{
          backgroundColor: event.color,
          color: "#fff",
          borderRadius: "6px",
          padding: "2px 4px",
          textAlign: "center",
          fontSize: "0.75rem",
          fontWeight: "500",
        }}
      >
        {event.title}
      </div>
    );

  };

  // Colores para el evento del calendario
  const colors = [
    "#84caf8", "#7dc488", "#d18e7d", "#9C27B0", "#F44336",
    "#00BCD4", "#8BC34A", "#FF5722", "#3F51B5", "#CDDC39",
    "#E91E63", "#795548"
  ];

  // Transformar los horarios al formato de eventos del calendario
  const calendarEvents = schedule.map((item, index) => {

    const start = moment(item.startDate + ' ' + item.time, "YYYY-MM-DD HH:mm").toDate();
    const end = moment(item.endDate + ' ' + item.time, "YYYY-MM-DD HH:mm").toDate();

    // Asegurarse de que las fechas de inicio y fin sean válidas
    if (!start || !end) {
      console.error("Fechas inválidas:", item);
      return null;
    }
    // Retorna el evento del calendario, asegurándose de que tenga un ID único
    return {
      id: index,
      title: `${item.portion} porción(es)`,
      start: start,
      end: end,
      color: colors[index % colors.length]
    };
  });
  

  return (
    <div className={styles.HomeContainer}>
        <header>
          <h1>
            Bienvenido {(currentUser.nombre && currentUser.apellido)
            ? `${currentUser.nombre} ${currentUser.apellido}`
            : currentUser.email} 👋🐾
          </h1>
        </header>

        {!finalConnectionStatus && (
                <div className={styles.connectionAlert}>
                    ⚠️ **¡Equipo Desconectado!** El equipo no ha reportado datos en más de 12 segundos. Funciones manuales desactivadas.
                </div>
            )}
        
        <div className={styles.contentHome}>

          {/* Tarjeta: informacion de la mascot */}
          <div className={styles.card}>
              <h2>Información de la mascota</h2>
              <p>Nombre: {petData.name}</p>
              <p>Edad: {petData.age}</p>
              <p>Raza: {petData.breed}</p>
              <p>Peso: {petData.weight}</p>
            </div>

            {/* Tarjeta: nivel de comida y dosificación manual */}
          <div className={styles.card}>
            <h2>Nivel de Comida y Control</h2>
            <div className={styles.foodControls}>
              <div className={styles.foodLevelContainer}>
                  <svg className={styles.circleBar} viewBox="0 0 36 36">
                      <path
                        className={styles.circleBg}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                          className={styles.circle}
                          strokeDasharray={`${foodLevel}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" className={styles.percentage}>{foodLevel}%</text>
                          </svg>
                          {/* <h3>Nivel de Comida</h3> */}
              </div>
              <button onClick={handleDispenseNow} className={styles.dispenseButton}>Alimentar Manual</button>
            </div>
          </div>
          
          {/* Tarjeta: Estado del equipo */} 
          <div className={styles.card}>
                    <h2>Estado del Dispositivo</h2>
                    <div className={styles.deviceStatus}>
                        <p>
                            Estado de conexión: 
                            <strong className={finalConnectionStatus ? styles.connected : styles.disconnected}>
                                {finalConnectionStatus ? '✅ En línea' : '❌ Desconectado'}
                            </strong>
                        </p>
                        <p>
                            <PiWifiHigh /> Señal Wi-Fi: 
                            <strong className={wifiStatus.style}>
                                {wifiStatus.quality} ({rssi} dBm)
                            </strong>
                        </p>
                        <p>
                            <PiThermometerSimple /> Temperatura del equipo: 
                            <strong> {formattedTemp}°C</strong>
                        </p>
                        <p>
                            <PiTimer /> Tiempo Activo : 
                            <strong> {uptime || '--'}</strong>
                        </p>
                    </div>
                </div>

          
            {/* Tarjeta: Historial Resumen*/}
            <div className={styles.card}>
              <h2>Actividad Reciente</h2>
              <div className={styles.historyContainer}>
                {history.length > 0 ? (
                  <div>
                    {history.map((item) => (
                      <div key={item.id} className={styles.historyItem}>
                        <p>
                          {formatTimestamp(item.timestamp)}: <strong>{item.type === 'manual' ? 'Dispensado Manual' : 'Dispensado Programada'}</strong>
                        </p>
                        <p>
                          {item.portion} porcion(es)
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay registro de dispensacion aún.</p>
                )}
              </div>
            </div>

            {/* Tarjeta: Horarios Programados */}
            <div className={styles.card}>
                  <h2>Horarios Programados</h2>
                  <div className={styles.calendarContainer}>
                    {schedule.length > 0 ? (
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        components={{
                          event: EventComponent
                        }}
                        defaultView="month"
                        toolbar={true}
                        popup={true}
                        messages={{
                          next: "Sig.",
                          previous: "Ant.",
                          today: "Hoy",
                          month: "Mes",
                        }}
                      />
                    ) : (
                      <p className={styles.noSchedule}>No hay horarios programados.</p>
                    )}
                    <div className={styles.legend}>
                      <ul>
                        {calendarEvents.map((ev) => (
                          <li key={ev.id}>
                            <span className={styles.colorDot} style={{background: ev.color}}></span>
                            {moment(ev.start).format('HH:mm')} - {ev.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
  );
}

export default HomeControl;