import React, { useState, useEffect } from "react";
import styles from "./ConfigDevice.module.scss";
import ScheduleManager from "./Schedule/ScheduleManager";
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/firebase-config";
import { MdDelete, MdEdit } from "react-icons/md";
import Modal from "../../common/modal/Modal";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import Switch from "../../common/switch/Switch";

const ConfigDevice = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    if (currentUser && currentUser.deviceId) {
      const deviceRef = doc(db, "devicesPet", currentUser.deviceId);

      const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
        if (docSnap.exists()) {
          const deviceData = docSnap.data();
          const sortedSchedules = (deviceData.schedule || []).sort((a, b) =>
            a.time.localeCompare(b.time),
          );
          setSchedules(sortedSchedules);
        } else {
          console.log("No se encontró Datos de tu Dispositivo.");
          setLoading(false);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const closeModal = () => {
    setModalContent(null);
    setScheduleToDelete(null);
  };

  const confirmDeleteSchedule = async () => {
    console.log("Iniciando eliminación...");
    if (!scheduleToDelete) {
      console.log("Error: No hay un horario seleccionado para eliminar");
      return;
    }
    try {
      console.log("Eliminando horario ID:", scheduleToDelete.id);
      const deviceRef = doc(db, "devicesPet", currentUser.deviceId);

      const updatedSchedules = schedules.filter(
        (s) => s.id !== scheduleToDelete.id,
      );

      await updateDoc(deviceRef, { schedule: updatedSchedules });

      await addDoc(collection(db, "archived_schedules"), {
        ...scheduleToDelete,
        archivedAt: serverTimestamp(),
        deletedBy: currentUser.uid,
        deviceId: currentUser.deviceId,
        userEmail: currentUser.email,
        name: currentUser.nombre,
      });

      await addDoc(collection(db, "system_logs"), {
        action: "SCHEDULE_ARCHIVED",
        userId: currentUser.uid,
        deviceId: currentUser.deviceId,
        userEmail: currentUser.email,
        name: currentUser.nombre,
        timestamp: serverTimestamp(),
        details: `Horario ${scheduleToDelete.time} movido al archivo.`,
        type: "info",
      });

      toast.success("Horario eliminado", { className: "custom-toast-success" });
      closeModal();
    } catch (error) {
      toast.error("Error al eliminar", { className: "custom-toast-error" });
      console.error(error);
    }
  };

  const openDeleteModal = (schedule) => {
    setScheduleToDelete(schedule);
    setModalContent("delete_schedule");
  };

  const handleToggleStatus = async (schedule) => {
    try {
      const deviceRef = doc(db, "devicesPet", currentUser.deviceId);
      const updatedSchedules = schedules.map((s) =>
        s.id === schedule.id ? { ...s, enabled: !s.enabled } : s,
      );

      await updateDoc(deviceRef, { schedule: updatedSchedules });

      await addDoc(collection(db, "system_logs"), {
        action: schedule.enabled ? "SCHEDULE_DISABLED" : "SCHEDULE_ENABLED",
        userId: currentUser.uid,
        type: "info",
        deviceId: currentUser.deviceId,
        timestamp: serverTimestamp(),
        details: `Horario ${schedule.time} cambiado a ${!schedule.enabled ? "Habilitado" : "Deshabilitado"}`,
      });

      toast.success(
        schedule.enabled ? "Horario desactivado" : "Horario activado",
        { className: "custom-toast-success" },
      );
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const renderModalContent = (type) => {
    switch (type) {
      case "delete_schedule":
        return {
          title: "Eliminar Horario",
          size: "small",
          body: (
            <div className={styles.logoutModalContainer}>
              <p>
                ¿Estás seguro de que quieres eliminar la rutina de las{" "}
                <strong>{scheduleToDelete?.time}</strong>?
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={closeModal}
                  className={`${styles.modalActionButton} ${styles.secondaryButton}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDeleteSchedule()}
                  className={`${styles.modalActionButton} ${styles.primaryButton}`}
                >
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          ),
        };
      default:
        return { title: "", size: "medium", body: null };
    }
  };

  const modalInfo = renderModalContent(modalContent);

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const activeSchedules = schedules.filter((s) => !s.deleted);

  if (loading)
    return <div className={styles.loader}>Cargando configuración...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <ScheduleManager
            editData={editingSchedule}
            onClearEdit={() => setEditingSchedule(null)}
          />
        </div>
        <div className={styles.card}>
          <h2 className={styles.title}>Horarios Programados</h2>
          <div className={styles.routineGrid}>
            {schedules.filter((s) => s.delete !== true).length > 0 ? (
              schedules
                .filter((schedule) => schedule.delete !== true)
                .map((schedule, index) => (
                  <div
                    key={schedule.id || index}
                    className={`${styles.routineCard} ${!schedule.enabled ? styles.disabledRow : ""}`}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.timeText}>{schedule.time}</span>
                      <Switch
                        id={schedule.id}
                        isOn={schedule.enabled}
                        handleToggle={() => handleToggleStatus(schedule)}
                      />
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.portionBadge}>
                        {schedule.portion} Porción(es)
                      </div>
                      <div className={styles.daysList}>
                        {schedule.days?.map((d) => (
                          <span key={d} className={styles.dayBadge}>
                            {dayNames[d]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleEditClick(schedule)}
                        className={styles.editBtn}
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => openDeleteModal(schedule)}
                        className={styles.deleteBtn}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className={styles.noScheduleMessage}>
                No hay rutinas activas.
              </p>
            )}
          </div>
        </div>
        <Toaster position="top-center" />
      </div>
      {modalContent && (
        <Modal
          isOpen={!!modalContent}
          onClose={closeModal}
          title={modalInfo.title}
          size={modalInfo.size}
        >
          {modalInfo.body}
        </Modal>
      )}
    </div>
  );
};

export default ConfigDevice;
