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

      <div className={styles.tableWrapper}>
        <table className={styles.deviceTable}>
          <thead>
            <tr>
              <th>Estado</th>
              <th>ID Dispositivo</th>
              <th>Dueño</th>
              <th>Nivel Comida</th>
              <th>Señal / Versión</th>
              <th>Red (IP/MAC)</th>
              <th>Último Enlace</th>
              <th>Fecha Creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr
                key={device.id}
                className={
                  device.online !== "conectado" ? styles.offlineRow : ""
                }
              >
                <td>
                  <span
                    className={`${styles.statusDot} ${device.online === "conectado" ? styles.online : styles.offline}`}
                  ></span>
                  <span className={styles.statusText}>
                    {device.online === "conectado" ? "Online" : "Offline"}
                  </span>
                </td>
                <td>
                  <code className={styles.deviceId}>{device.id}</code>
                </td>
                <td>
                  <div className={styles.ownerInfo}>
                    <strong>{device.ownerName || "N/A"}</strong>
                    <span>{device.ownerEmail}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.foodLevelCell}>
                    <div className={styles.miniBarContainer}>
                      <div
                        className={styles.miniBar}
                        style={{
                          width: `${device.foodLevel}%`,
                          backgroundColor:
                            device.foodLevel < 20 ? "#ff4757" : "#2ed573",
                        }}
                      ></div>
                    </div>
                    <span>{Math.round(device.foodLevel)}%</span>
                  </div>
                </td>
                <td>
                  <div className={styles.techInfo}>
                    <span>
                      <MdSignalWifiStatusbar4Bar /> {device.rssi} dBm
                    </span>
                    <span>
                      <MdRefresh /> v{device.version || "1.0.0"}
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.networkInfo}>
                    <small>IP: {device.ip_address || "---"}</small>
                    <small>MAC: {device.mac_address || "---"}</small>
                  </div>
                </td>
                <td>
                  <span className={styles.dateText}>
                    {device.last_link_date
                      ? device.last_link_date.toDate().toLocaleString("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Sin registro"}
                  </span>
                </td>
                <td>
                  <span className={styles.dateText}>
                    {device.createdAt
                      ? device.createdAt.toDate().toLocaleString("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Sin registro"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.btnAction}
                      title="Reiniciar Dispositivo"
                      onClick={() => handleRemoteAction(device.id, "REBOOT")}
                    >
                      <MdRefresh />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDevicesPage;
