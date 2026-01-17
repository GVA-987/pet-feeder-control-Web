import styles from './Login.module.scss';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/petlog.png';
import {doc, getDoc, collection, addDoc, serverTimestamp} from 'firebase/firestore';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from '../../../node_modules/firebase/auth';
import { auth, db } from '../../firebase/firebase-config.js';
import Form from '../common/form/Form.jsx';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError();

    try {

      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = 'user';

      if (!user.emailVerified) {
        toast.error("Debes verificar tu correo antes de ingresar.", {
          icon: '📧',
          className: 'custom-toast-error'
        });
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      if (userDoc.exists()){
        role = userDoc.data().role || 'user';
      }



      await addDoc(collection(db, "system_logs"), {
        action: "USER_LOGIN",
        category: "AUTH",
        type: "info",
        status: "SUCCESS",
        userId: user.uid,
        userEmail: user.email,
        role: role,
        timestamp: serverTimestamp(),
        metadata: {
          platform: "Web-App",
          version: "1.0.0",
          userAgent: navigator.userAgent
        },
      });

      toast.success('¡Bienvenido de nuevo!', { className: 'custom-toast' });

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }

      setEmail('');
      setPassword('');
    }catch (err) {
      console.log('Error al iniciar sesion', err.code);

      await addDoc(collection(db, "system_logs"), {
        action: "USER_LOGIN_FAILED",
        category: "SECURITY",
        status: "FAILED",
        attemptedEmail: email, 
        errorCode: err.code,
        timestamp: serverTimestamp(),
        details: "Intento de inicio de sesión con credenciales incorrectas",
        userAgent: navigator.userAgent
      });

      let friendlyError = 'Ocurrió un error inesperado';
      
      if (err.code === 'auth/invalid-credential') {
        friendlyError = 'Correo o contraseña incorrectos';
      } else if (err.code === 'auth/user-disabled') {
        friendlyError = 'Cuenta deshabilitada. Contacta soporte';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'Demasiados intentos. Bloqueado temporalmente';
      }

      toast.error(friendlyError, { className: 'custom-toast' });
    }finally{
      setIsLoading(false);
    }
  };

  const fieldsLog = [
    {
      type: 'email',
      placeholder: 'Correo electrónico',
      value: email,
      onChange: (e) => setEmail(e.target.value),
      required: true,
      iconType: 'email',
    },
    {
      type: 'password',
      placeholder: 'Contraseña',
      value: password,
      onChange: (e) => setPassword(e.target.value),
      required: true,
      iconType: 'password',
    }
  ]
  return (
    <div className={styles.loginContainer}>
      <h2>Iniciar Sesión</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <img src={logo} alt="" className={styles.logo} />
      <Form
        fields={fieldsLog}
        onSubmit={handleSubmit}
        submitButtonText={isLoading ? <div className={styles['circle-loader']}></div> : "Acceder"}
        isLoading={isLoading}
      />
      <p className={styles.registerPrompt}>
        ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}