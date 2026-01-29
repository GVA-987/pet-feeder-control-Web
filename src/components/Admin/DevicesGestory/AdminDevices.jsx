import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db, rtdb } from "../../../firebase/firebase-config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./AdminDevices.module.scss";
import {
  MdOutlineDevicesOther,
  MdScale,
  MdSignalWifiStatusbar4Bar,
  MdWifiOff,
  MdRefresh,
  MdFastfood,
} from "react-icons/md";
import { RiBaseStationLine, RiFilter3Line } from "react-icons/ri";
import Modal from "../../common/modal/Modal";
import RegisterDeviceForm from "./RegisterDeviceForm";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const AdminDevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (uSnapshot) => {
      const uData = {};
      uSnapshot.forEach((doc) => {
        uData[doc.id] = doc.data();
      });
      setUsersMap(uData);
    });

    const unsubFirestore = onSnapshot(
      collection(db, "devicesPet"),
      (fsSnapshot) => {
        const fsDevices = fsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const devicesRTDBRef = ref(rtdb, "/");
        onValue(devicesRTDBRef, (rtSnapshot) => {
          const rtData = rtSnapshot.val() || {};

          const combinedList = fsDevices.map((fsDev) => {
            const rtDev = rtData[fsDev.id] || {};

            const owner = usersMap[fsDev.linked_user_id];

            return {
              ...fsDev,
              ...(rtDev.status || {}),
              ownerEmail: owner
                ? owner.email
                : fsDev.linked_user_id &&
                    fsDev.linked_user_id !== "null" &&
                    fsDev.linked_user_id !== ""
                  ? "Cargando..."
                  : "Disponible",
              ownerName: owner ? owner.name : "",
              foodLevel: rtDev.status?.foodLevel ?? 0,
              online: rtDev.status?.online || "desconectado",
            };
          });

          setDevices(combinedList);
          setLoading(false);
        });
      },
    );

    return () => {
      unsubUsers();
      unsubFirestore();
    };
  }, [usersMap]);

  const onSnapshotDevices = () => {
    return onValue(ref(rtdb, "/"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .filter((key) => key !== "admins")
          .map((id) => ({
            id,
            ...data[id].status,
            ownerEmail: data[id].ownerEmail || "Sin dueño",
          }));
        setDevices(list);
      }
      setLoading(false);
    });
  };

  const logAdminAction = async (action, deviceId, details) => {
    try {
      await addDoc(collection(db, "system_logs"), {
        action: action,
        category: "ADMIN_CONTROL",
        type: "warning",
        deviceId: deviceId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        details: details,
        timestamp: serverTimestamp(),
        metadata: {
          platform: "Admin Panel",
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error("Error al guardar log de auditoría:", error);
    }
  };

  const handleRemoteAction = async (deviceId, action) => {
    const actionRef = ref(rtdb, `${deviceId}/control`);
    try {
      await update(actionRef, {
        command: action,
        timestamp: Date.now(),
        executed: false,
      });
      await logAdminAction(
        `ADMIN_COMMAND_${action}`,
        deviceId,
        `El administrador envió el comando ${action} al dispositivo.`,
      );

      toast.success(`Comando ${action} enviado a ${deviceId}`);
    } catch (error) {
      toast.error("Error al enviar comando");
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesTab =
      filter === "all" ||
      (filter === "online" && d.online === "conectado") ||
      (filter === "stock" && d.foodLevel < 20) ||
      (filter === "new" && (!d.linked_user_id || d.linked_user_id === "null"));

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      d.id?.toLowerCase().includes(search) ||
      d.ownerEmail?.toLowerCase().includes(search) ||
      d.ownerName?.toLowerCase().includes(search) ||
      d.mac?.toLowerCase().includes(search);

    return matchesTab && matchesSearch;
  });

  if (loading)
    return <div className={styles.loader}>Escaneando red IoT...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h2>
            <RiBaseStationLine /> Administración de Dispositivos
          </h2>
          <p>Total: {devices.length} equipos en sistema</p>
          <button
            className={styles.btnAddDevice}
            onClick={() => setIsModalOpen(true)}
          >
            + Nuevo Equipo
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <MdOutlineDevicesOther className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por ID, Email, Nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.clearBtn}
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.filterTabs}>
            <button
              className={filter === "all" ? styles.active : ""}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              className={filter === "new" ? styles.active : ""}
              onClick={() => setFilter("new")}
            >
              Disponibles
            </button>
            <button
              className={filter === "online" ? styles.active : ""}
              onClick={() => setFilter("online")}
            >
              Online
            </button>
          </div>
        </div>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provisionar Nuevo Hardware"
      >
        <RegisterDeviceForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>

      <div className={styles.deviceGrid}>
        {filteredDevices.map((device) => (
          <div
            key={device.id}
            className={`${styles.card} ${device.online !== "conectado" ? styles.offlineCard : ""}`}
          >
            <div className={styles.cardStatus}>
              <span className={styles.onlineBadge}>
                {device.online === "conectado" ? "● ONLINE" : "● OFFLINE"}
              </span>
              <code>ID: {device.id}</code>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.mainMetric}>
                <div className={styles.progressCircle}>
                  <svg viewBox="0 0 36 36" className={styles.circularChart}>
                    <path
                      className={styles.circleBg}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={styles.circle}
                      strokeDasharray={`${device.foodLevel}, 100`}
                      stroke={device.foodLevel < 20 ? "#ff4757" : "#2ed573"}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className={styles.percentage}>
                    {Math.round(device.foodLevel)}%
                  </div>
                </div>
                <span className={styles.metricLabel}>Nivel de Comida</span>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <MdSignalWifiStatusbar4Bar />
                  <span>Señal: {device.rssi} dBm</span>
                </div>
                <div className={styles.infoItem}>
                  <MdRefresh />
                  <span>V: {device.version || "1.0.0"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span>IP: {device.ip_address || "No IP"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span>MAC: {device.mac_address || "No MAC"}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                title="Reiniciar Dispositivo"
                onClick={() => handleRemoteAction(device.id, "REBOOT")}
              >
                <MdRefresh />
              </button>
            </div>

            <div className={styles.cardFooter}>
              <span>Dueño: {device.ownerEmail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDevicesPage;
