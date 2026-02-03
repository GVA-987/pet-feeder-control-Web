import styles from "./forgot.module.scss"; // Reutilizamos estilos
import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase/firebase-config.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Form from "../common/form/Form.jsx";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      await addDoc(collection(db, "system_logs"), {
        action: "PASSWORD_RESET_REQUESTED",
        category: "AUTH",
        type: "info",
        status: "SUCCESS",
        userEmail: email,
        timestamp: serverTimestamp(),
        details: "Se envió el enlace de recuperación de contraseña",
        metadata: {
          userAgent: navigator.userAgent,
        },
      });

      toast.success("Enlace enviado. Revisa tu correo electrónico.", {
        duration: 5000,
        icon: "📧",
        className: "custom-toast",
      });
    } catch (err) {
      console.error("Error reset:", err.code);

      let typeLog = "error";
      let friendlyError = "No se pudo enviar el correo";

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-email"
      ) {
        typeLog = "warning";
        friendlyError = "El correo no es válido o no está registrado";
      }

      await addDoc(collection(db, "system_logs"), {
        action: "PASSWORD_RESET_FAILED",
        category: "SECURITY",
        type: typeLog,
        status: "FAILED",
        attemptedEmail: email,
        errorCode: err.code,
        timestamp: serverTimestamp(),
        details:
          typeLog === "warning"
            ? "Intento con correo no registrado"
            : "Error técnico en reset",
      });

      toast.error(friendlyError, {
        id: "reset-error",
        duration: 5000,
        className: "custom-toast-error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    {
      type: "email",
      placeholder: "Ingresa tu correo de recuperación",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      required: true,
      iconType: "email",
      autoComplete: "on",
    },
  ];

  return (
    <div className={styles.forgotcontainer}>
      {" "}
      <h2>Recuperar Cuenta</h2>
      <p>Te enviaremos un enlace para restablecer tu contraseña.</p>
      <Form
        fields={fields}
        onSubmit={handleSubmit}
        submitButtonText={
          isLoading ? (
            <div className={styles["circle-loader"]}></div>
          ) : (
            "Enviar Enlace"
          )
        }
        isLoading={isLoading}
      />
      <div className={styles.backToLogin}>
        <Link to="/login">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
}
