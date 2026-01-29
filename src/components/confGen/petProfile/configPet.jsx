import react, { useState, useEffect } from "react";
import Form from "../../common/form/Form";
import {
  getDoc,
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./configPet.module.scss";

const ConfigPet = () => {
  const { currentUser } = useAuth();
  const [petData, setPetData] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
  });
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPetData = async () => {
      if (!currentUser?.deviceId) {
        setLoading(false);
        return;
      }

      try {
        const deviceRef = doc(db, "devicesPet", currentUser.deviceId);
        const deviceSnap = await getDoc(deviceRef);
        if (deviceSnap.exists()) {
          const dbData = deviceSnap.data();
          // Si ya existen datos de mascota, los cargamos; si no, dejamos el estado inicial
          if (dbData.pets) {
            setPetData(dbData.pets);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Error al cargar datos de la mascota");
      } finally {
        setLoading(false);
      }
    };
    fetchPetData();
  }, [currentUser?.deviceid]);

  const handleUpdatePet = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const petRef = doc(db, "devicesPet", currentUser.deviceId);

      await updateDoc(petRef, {
        pets: {
          name: petData.name,
          breed: petData.breed,
          age: petData.age,
          weight: petData.weight,
          updateAt: serverTimestamp(),
        },
      });

      await addDoc(collection(db, "system_logs"), {
        action: "DEVICE_PET_UPDATED",
        type: "info",
        category: "CONFIG",
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        details: `Actualizados datos de: ${petData.name}`,
        metadata: {
          platform: "Web App",
          userAgent: navigator.userAgent,
        },
      });
      toast.success("¡Datos de la mascota guardados!", {
        icon: "🐶",
        position: "bottom-right",
        className: "custom-toast-success",
      });
    } catch (error) {
      console.error("Error:", error);
      await addDoc(collection(db, "system_logs"), {
        action: "DEVICE_PET_UPDATE_FAILED",
        type: "error",
        category: "CONFIG",
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        details: `Error al actualizar datos de: ${petData.name}`,
        metadata: {
          platform: "Web App",
          userAgent: navigator.userAgent,
          errorMessage: error.message,
        },
      });
      toast.error("No se pudieron guardar los cambios", {
        className: "custom-toast-error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsPet = [
    {
      label: "Nombre",
      type: "text",
      placeholder: "Nombre de Mascota",
      value: petData.name,
      onChange: (e) => setPetData({ ...petData, name: e.target.value }),
      required: true,
    },
    {
      label: "Raza",
      type: "text",
      placeholder: "Raza",
      value: petData.breed,
      onChange: (e) => setPetData({ ...petData, breed: e.target.value }),
      required: true,
    },
    {
      label: "Edad",
      type: "number",
      placeholder: "Edad",
      value: petData.age,
      onChange: (e) => setPetData({ ...petData, age: e.target.value }),
      required: true,
    },
    {
      label: "Peso (Kg)",
      type: "number",
      placeholder: "Peso de la Mascota",
      value: petData.weight,
      onChange: (e) => setPetData({ ...petData, weight: e.target.value }),
      required: true,
    },
  ];
  if (!currentUser?.deviceId) {
    return toast.error(
      "Seleccione un dispositivo o registre uno para configurar la mascota.",
      {
        className: "custom-toast-error",
      },
    );
  }

  if (loading) return <div className={styles.loader}>Cargando...</div>;
  return (
    <div className={styles.configBox}>
      <div className={styles.header}>
        <p>Gestiona los datos de tu Mascota.</p>
      </div>

      <Form
        fields={fieldsPet}
        onSubmit={handleUpdatePet}
        submitButtonText={
          isLoading ? "Actualizando..." : "Actualizar Datos de la Mascota"
        }
        isLoading={isLoading}
      />
    </div>
  );
};
export default ConfigPet;
