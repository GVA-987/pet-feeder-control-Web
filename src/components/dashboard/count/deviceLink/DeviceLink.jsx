import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { getDatabase, ref, set } from "firebase/database";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  collection,
  arrayUnion,
} from "firebase/firestore";
import { db, rtdb } from "../../../../firebase/firebase-config";
import styles from "./DeviceLink.module.scss";
import Modal from "../../../common/modal/Modal";
import { useNavigate } from "react-router-dom";
import Form from "../../../common/form/Form";
import toast from "react-hot-toast";

const DeviceLink = () => {
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLinkDevice = async (e) => {
    e.preventDefault();
    setError("");
    const cleanId = deviceId.toUpperCase().trim();

    if (!cleanId) {
      toast.error("Por favor, ingresa un ID de equipo");
      return;
    }
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const deviceRef = doc(db, "devicesPet", cleanId);
        const userRef = doc(db, "users", currentUser.uid);
        const deviceDoc = await transaction.get(deviceRef);

        if (!deviceDoc.exists()) {
          throw new Error("Equipo no encontrado. Verifica el ID.");
        }
        const data = deviceDoc.data();
        if (
          data.linked_user_id &&
          data.linked_user_id !== "null" &&
          data.linked_user_id !== currentUser.uid
        ) {
          throw new Error("Este equipo ya pertenece a otro usuario");
        }

        transaction.update(deviceRef, {
          linked_user_id: currentUser.uid,
          last_link_date: serverTimestamp(), // Fecha del último enlace
          status_device: "active",
        });

        transaction.update(userRef, {
          devices: arrayUnion(cleanId),
          deviceId: cleanId,
          updatedAt: serverTimestamp(),
        });

        const auditLogRef = doc(collection(db, "system_logs"));
        transaction.set(auditLogRef, {
          action: "DEVICE_PROVISIONING",
          category: "SECURITY",
          type: "info",
          deviceId: cleanId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          details: `Vinculación de hardware exitosa para el usuario ${currentUser.email}`,
          timestamp: serverTimestamp(),
          metadata: {
            platform: "Web App",
            version: "1.0.2",
          },
          userAgent: navigator.userAgent,
        });
      });

      const deviceRefRT = ref(rtdb, cleanId);

      await set(deviceRefRT, {
        ownerUid: currentUser.uid,
        status: {
          online: false,
          lastSeen: Date.now(),
          linkedAt: new Date().toISOString(),
        },
        commands: {
          dispense_manual: "desactivado",
          food_portion: "0",
        },
      });
      toast.success("¡Equipo enlazado correctamente! 🐾", {
        className: "custom-toast-success",
      });

      //onClose();
      navigate("/home");
      setDeviceId("");
    } catch (e) {
      console.error(e.message);
      toast.error(e.message, { className: "custom-toast-error" });
    } finally {
      setLoading(false);
    }
  };

  const linkDeviceFields = [
    {
      type: "text",
      placeholder: "Ej: ESP-PET-####",
      value: deviceId,
      onChange: (e) => setDeviceId(e.target.value),
      required: true,
    },
  ];

  return (
    <div className={styles.conatiner}>
      <h4>Enlazar Equipo</h4>
      <p>Introduce el ID unico de su equipo</p>
      {error && <p className={styles.error}>{error}</p>}
      <Form
        fields={linkDeviceFields}
        onSubmit={handleLinkDevice}
        submitButtonText={loading ? "Enlazando..." : "Enlazar Equipo"}
        disabled={loading}
      />
    </div>
  );
};

export default DeviceLink;
