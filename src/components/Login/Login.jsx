import styles from './Login.module.scss';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/petlog.png';
import ButtonForm from '../common/button/ButtonForm';
import { signInWithEmailAndPassword } from '../../../node_modules/firebase/auth';
import { doc, setDoc } from '../../../node_modules/firebase/firestore';
import { auth, db } from '../../firebase/firebase-config.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmail('');
    setPassword('');
    setIsLoading(true);
    // Redirigir al usuario a la página de inicio o dashboard

    try {
      const useCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = useCredential.user;

      console.log('Inicio de sesión exitoso', user);
      window.location.href = '/home';

    }catch{
      console.log('Error al iniciar sesion', e.code);
      if(e.code === 'auth/invalid-credential'){
        setError('Credenciales invalidas. Verifica tu correo y contraseña');
      }else if(e.code === 'auth/user-disabled'){
        setError('Tu cuenta ha sido deshabilitada. Contacta al administrador');
      }else if(e.code === 'auth/too-many-requests'){
        setError('Demasiados intentos fallidos. Intenta de nuevo mas tarde');
      }else{
        setError('Ocuttio un error inesperado. Intenta de nuevo mas tarde');
      }
    }finally{
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Iniciar Sesión</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <img src={logo} alt="" className={styles.logo} />
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <ButtonForm type="submit" disabled={isLoading}>
        {isLoading ? (
          // Si esta carganndo, muestra el estado de carga
          <div className={styles["circle-loader"]}></div>
        ): ("Acceder")}
        </ButtonForm>
      </form>
      <p className={styles.registerPrompt}>
        ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}