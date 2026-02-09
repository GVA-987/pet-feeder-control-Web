import React, { useState, useEffect } from "react";
import styles from "./ScheduleManager.module.scss";
import { useAuth } from "../../../../context/AuthContext";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db, rtdb } from "../../../../firebase/firebase-config";
import { ref, onValue } from "firebase/database";
import { MdDelete } from "react-icons/md";
import Form from "../../../common/form/Form.jsx";
import moment from "moment";
import toast from "react-hot-toast";

const ScheduleManager = ({ editData, onClearEdit }) => {
  const [baseGrams, setBaseGrams] = useState(0);
  const [newSchedule, setNewSchedule] = useState({
    time: "",
    portion: "",
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const { currentUser } = useAuth();
  const daysOfWeek = [
    { label: "D", value: 0 },
    { label: "L", value: 1 },
    { label: "M", value: 2 },
    { label: "Mi", value: 3 },
    { label: "J", value: 4 },
    { label: "V", value: 5 },
    { label: "S", value: 6 },
  ];
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);

  const handleInputChange = (eOrName, maybeValue) => {
    if (typeof eOrName === "string") {
      setNewSchedule((prev) => ({ ...prev, [eOrName]: maybeValue }));
      return;
    }

    const { name, value } = eOrName.target;
    setNewSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (dayValue) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue],
    );
  };

  useEffect(() => {
    if (!currentUser?.deviceId) return;

    const weightRef = ref(
      rtdb,
      `${currentUser.deviceId}/commands/weight_portion`,
    );
    const unsubscribe = onValue(weightRef, (snapshot) => {
      const val = snapshot.val();
      setBaseGrams(Number(val) || 0);
    });

    return () => unsubscribe();
  }, [currentUser.deviceId]);

  useEffect(() => {
    if (editData) {
      setNewSchedule({
        time: editData.time || "",
        portion: editData.portion || "",
      });
      setSelectedDays(editData.days || []);
    }
  }, [editData]);

  const totalGrams = (Number(newSchedule.portion) || 0) * baseGrams;

  const handleAddSchedule = async (e) => {
    e.preventDefault();

    if (selectedDays.length === 0) {
      toast.error("Selecciona al menos un día", {
        className: "custom-toast-error",
      });
      return;
    }
    try {
      const deviceRef = doc(db, "devicesPet", currentUser.deviceId);

      const scheduleObject = {
        id: editData?.id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        days: [...selectedDays].sort(),
        time: newSchedule.time,
        portion: Number(newSchedule.portion),
        grams: totalGrams,
        enabled: editData ? editData.enabled : true,
      };

      const docSnap = await getDoc(deviceRef);
      const currentSchedules = docSnap.exists()
        ? docSnap.data().schedule || []
        : [];

      let updatedSchedules;
      if (editData) {
        updatedSchedules = currentSchedules.map((item) =>
          item.id === editData.id ? scheduleObject : item,
        );
      } else {
        updatedSchedules = [...currentSchedules, scheduleObject];
      }

      await updateDoc(deviceRef, { schedule: updatedSchedules });

      await addDoc(collection(db, "system_logs"), {
        action: editData ? "SCHEDULE_UPDATED" : "SCHEDULE_CREATED",
        userId: currentUser.uid,
        deviceId: currentUser.deviceId,
        userEmail: currentUser.email,
        name: currentUser.nombre,
        timestamp: serverTimestamp(),
        details: `${editData ? "Editó" : "Creó"} el horario: ${scheduleObject.time}`,
        type: "info",
      });

      toast.success(editData ? "Horario actualizado" : "Horario agregado", {
        className: "custom-toast-success",
      });

      if (editData) handleCancel();
      setNewSchedule({ time: "", portion: "" });
      setSelectedDays([]);
    } catch (error) {
      toast.success("Error al guardar horario", {
        className: "custom-toast-error",
      });
      console.error(error);
    }
  };

  const handleCancel = () => {
    setNewSchedule({ time: "", portion: "" });
    setSelectedDays([]);
    onClearEdit();
  };

  const scheduleFields = [
    {
      label: "Hora de comida",
      type: "time",
      name: "time",
      value: newSchedule.time,
      onChange: handleInputChange,
      required: true,
      unstyled: true,
    },
    {
      label: "Porción",
      type: "numeric",
      name: "portion",
      value: newSchedule.portion,
      onChange: handleInputChange,
      placeholder: "Ej: 2",
      required: true,
      unstyled: true,
    },
  ];

  return (
    <div className={styles.scheduleFormContainer}>
      <h3>{editData ? "Editar Horario" : "Añadir Nuevo Horario"}</h3>

      <div className={styles.daysSelectorContainer}>
        <div className={styles.daysGrid}>
          {daysOfWeek.map((day) => (
            <button
              key={day.value}
              type="button"
              className={`${styles.dayButton} ${selectedDays.includes(day.value) ? styles.dayActive : ""}`}
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.infoGrams}>
        <span>
          Configuración actual: <strong>{baseGrams}g</strong> por porción.
        </span>
        {newSchedule.portion > 0 && (
          <p className={styles.calculation}>
            Total a dispensar: <strong>{totalGrams} gramos</strong>
          </p>
        )}
      </div>

      <Form
        fields={scheduleFields}
        onSubmit={handleAddSchedule}
        submitButtonText={editData ? "Actualizar Horario" : "Agregar Horario"}
      />

      {editData && (
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelBtn}
        >
          Cancelar Edición
        </button>
      )}
    </div>
  );
};

export default ScheduleManager;
