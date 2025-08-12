import react, { useState, useEffect } from 'react';
//import logo from '../../assets/petlog.png';
import styles from './Home.module.scss';
import {useAuth} from '../../../context/AuthContext'
import {doc, onSnapshot, updateDoc} from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { PiWifiHighFill, PiWifiLowFill } from "react-icons/pi";

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

  if(loading) {
    return <div>Cargando Panel de Control...</div>;
  }
  if(!deviceData) {
    return <div>No se pudo cargar la informacion del dispositivo</div>
  }

  if (!currentUser) {
    return <div>Cargando...</div>;
  }
  return (
    <div className={styles.HomeContainer}>
      {/* <img src={logo} alt="Logo" /> */}
        <header>
          {/* <h1>Bienvenido, {currentUser.nombre || 'Usuario'}</h1> */}
          <h1>
          Bienvenido {(currentUser.nombre && currentUser.apellido)
          ? `${currentUser.nombre} ${currentUser.apellido}`
          : currentUser.email}
        </h1>
        </header>

        <section className={styles.statusSection}>
          <div className={styles.card}>
                    <h2>Estado del dispositivo</h2>
                    <p>Estado de conexión: <strong>{deviceData.status || 'Desconocido'}</strong></p>
                    <p>Nivel de comida: <strong>{deviceData.food_level || '--'}%</strong></p>
                </div>

        </section>

        <section className={styles.controlSection}>
          <div className={styles.card}>
                    <h2>Control Manual</h2>
                    <button className={styles.dispenseButton}>Dispensar Ahora</button>
                </div>
        </section>
    </div>
  );
}

export default HomeControl;