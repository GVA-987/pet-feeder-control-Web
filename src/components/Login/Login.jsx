import styles from './Login.module.scss';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/petlog.png';
import ButtonForm from '../common/button/ButtonForm';
import { signInWithEmailAndPassword } from '../../../node_modules/firebase/auth';
import { auth } from '../../firebase/firebase-config.js';
import InputForm from '../common/input/InputForm.jsx';
import Form from '../common/form/Form.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const useCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = useCredential.user;

      console.log('Inicio de sesión exitoso', user);
      setEmail('');
      setPassword('');
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