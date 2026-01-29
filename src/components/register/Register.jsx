import { countryCode } from "../../utils/countryCode";
import styles from "./Register.module.scss";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "../../../node_modules/firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "../../../node_modules/firebase/firestore";
import { auth, db } from "../../firebase/firebase-config.js";
import ButtonForm from "../common/button/ButtonForm";
import InputForm from "../common/input/InputForm";
import Form from "../common/form/Form.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [number, setNumber] = useState("");
  // const [selectCode, setSelectCode] = useState('+591');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden", {
        className: "custom-toast-error",
      });
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        nombre: name,
        apellido: lastname,
        celular: number,
        email: user.email,
        role: "user",
        createdAt: serverTimestamp(),
        deviceId: null,
        emailVerified: false,
      });

      await addDoc(collection(db, "system_logs"), {
        action: "USER_REGISTERED",
        type: "info",
        category: "AUTH",
        userId: user.uid,
        userEmail: user.email,
        details: "Cuenta creada - Pendiente de verificaión",
        timestamp: serverTimestamp(),
        metadata: {
          platform: "Web-App",
          version: "1.0.0",
        },
        userAgent: navigator.userAgent,
      });

      toast.success(
        `¡Bienvenido ${name}! Registro exitoso. Por favor, verifica tu correo antes de iniciar sesión.`,
        { className: "custom-toast-success", duration: 6000 },
      );
      await auth.signOut();
      setName("");
      setLastname("");
      setNumber("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      navigate("/login");
    } catch (e) {
      console.error("Error al registrar:", e.code);

      await addDoc(collection(db, "system_logs"), {
        action: "USER_REGISTER_FAILED",
        type: "error",
        category: "AUTH",
        details: "Error al registrar usuario",
        status: "FAILED",
        attemptedEmail: email,
        errorCode: e.code,
        timestamp: serverTimestamp(),
        details: "Error al registrar usuario",
        userAgent: navigator.userAgent,
      });

      let mensajeError = "Error al crear la cuenta";

      if (e.code === "auth/email-already-in-use") {
        mensajeError = "Este correo ya está registrado.";
      } else if (e.code === "auth/weak-password") {
        mensajeError = "La contraseña debe tener al menos 6 caracteres.";
      } else if (e.code === "auth/invalid-email") {
        mensajeError = "El formato del correo no es válido.";
      }

      toast.error(mensajeError, { className: "custom-toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsRegister = [
    {
      type: "text",
      placeholder: "Nombre",
      value: name,
      onChange: (e) => setName(e.target.value),
      required: true,
      iconType: "user",
    },
    {
      type: "text",
      placeholder: "Apellido",
      value: lastname,
      onChange: (e) => setLastname(e.target.value),
      required: true,
      iconType: "user",
    },
    {
      type: "tel",
      placeholder: "Telefono",
      value: number,
      onChange: (e) => setNumber(e.target.value),
      required: true,
      iconType: "phone",
    },
    {
      type: "email",
      placeholder: "Correo electronico",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      required: true,
      iconType: "email",
    },
    {
      type: "password",
      placeholder: "Contraseña",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      required: true,
      iconType: "password",
    },
    {
      type: "password",
      placeholder: "Confirmar contraseña",
      value: confirmPassword,
      onChange: (e) => setConfirmPassword(e.target.value),
      required: true,
      iconType: "password",
    },
  ];
  return (
    <div className={styles.loginContainer}>
      <h2>Registrate</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      <Form
        fields={fieldsRegister}
        onSubmit={handleSubmit}
        submitButtonText={
          isLoading ? (
            <div className={styles["circle-loader"]}></div>
          ) : (
            "Registrar"
          )
        }
      />
      <p className={styles.registerPrompt}>
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
