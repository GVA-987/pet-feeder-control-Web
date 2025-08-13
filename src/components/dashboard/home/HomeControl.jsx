import react, { useState, useEffect } from 'react';
//import logo from '../../assets/petlog.png';
import styles from './Home.module.scss';
import {useAuth} from '../../../context/AuthContext'
import {doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc} from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { PiWifiHighFill, PiWifiSlashFill } from "react-icons/pi";

function HomeControl() {

  const { currentUser } = useAuth();
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if(currentUser && currentUser.deviceId) {
      const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);

      const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
        if(docSnap.exists()){
          setDeviceData(docSnap.data());
          setLoading(false);
        }else{
          console.log("No se encontro el documento del dispositivo.");
          setLoading(false);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleDispenseNow = async () => {
    if(!currentUser || !currentUser.deviceId) return;

    try {
      const deviceRef = doc(db, 'devicesPet', currentUser.deviceId);
      const historyRef = collection(db, "dispense_history");

      // 1. Envía el comando de dispensar
      await updateDoc(deviceRef, {
          dispense_manual: true,
          last_dispense_timestamp: serverTimestamp()
      });

      await addDoc(historyRef, {
        deviceId: currentUser.deviceId,
        type: "manual",
        portion: 1, // Por ahora, asumimos una porción por defecto
        timestamp: serverTimestamp()
      });

      alert('Alimento dispensado correctamente');
    }catch(error) {
      console.log('Error al dispensar el alimento: ', error);
      alert('Hubo un problema al dispensar el alimento. Intente de nuevo.');
    }
  }

  if(loading) {
    return <div className={styles.loading}>Cargando Panel de Control...</div>;
  }
  if(!deviceData) {
    return <div className={styles.noData}>No se pudo cargar la informacion del dispositivo</div>
  }

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  const isConnected = deviceData.status === 'connected';
  const foodLevel = deviceData.food_level || 0;
  const schedule = deviceData.schedule || [];

  return (
    <div className={styles.HomeContainer}>
      {/* <img src={logo} alt="Logo" /> */}
        <header>
          {/* <h1>Bienvenido, {currentUser.nombre || 'Usuario'}</h1> */}
          <h1>
            Bienvenido {(currentUser.nombre && currentUser.apellido)
            ? `${currentUser.nombre} ${currentUser.apellido}`
            : currentUser.email} 👋🐾
          </h1>
        </header>
        <div className={styles.contentHome}>
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
                <button onClick={handleDispenseNow} className={styles.dispenseButton}>Dispensar Ahora</button>
              </div>
          </div>

          {/* Tarjeta 2 Estado del equipo */} 
          <div className={styles.card}>
            <h2>Estado del Dispositivo</h2>
            <div className={styles.deviceStatus}>
              <p>Estado de conexión: <strong className={isConnected ? styles.connected : styles.disconnected}>{isConnected ? 'En línea' : 'Desconectado'}</strong></p>
              <p>Señal Wi-Fi: {isConnected ? <PiWifiHighFill className={styles.wifiIcon} /> : <PiWifiSlashFill className={styles.wifiIcon} />}</p>
              <p>Temperatura: <strong>{deviceData.temperature || '--'}°C</strong></p>
            </div>
            {/* <div className={styles.wifiStatus}>
              {isConnected ? <PiWifiHighFill className={styles.wifiIcon} /> : <PiWifiSlashFill className={styles.wifiIcon} />}
              <p>Wi-Fi: {isConnected ? 'Conectado' : 'Desconectado'}</p>
            </div> */}
          </div>

          {/* Nueva Tarjeta 3: Horarios Programados */}
                <div className={styles.card}>
                    <h2>Horarios Programados</h2>
                    <div className={styles.scheduleList}>
                        {/* Aquí se mostrarán los horarios */}
                        
                        {schedule.length > 0 && (
                            <ul>
                                {schedule.map((item, index) => (
                                    <li key={index}>
                                        <strong>{item.time}</strong> - {item.portion} porción(es)
                                        <p>{item.days.join(', ')}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {schedule.length === 0 && (
                            <p>No hay horarios programados.</p>
                        )}
                    </div>
                </div>
        </div>
    </div>
  );
}

export default HomeControl;