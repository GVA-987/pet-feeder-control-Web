import { countryCode } from '../../utils/countryCode';
import styles from './Register.module.scss';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from '../../../node_modules/firebase/auth';
import { doc, setDoc } from '../../../node_modules/firebase/firestore';
import { auth, db } from '../../firebase/firebase-config.js';
import ButtonForm from '../common/button/ButtonForm';
import InputForm from '../common/input/InputForm';
import Form from '../common/form/Form.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [number, setNumber] = useState('');
  // const [selectCode, setSelectCode] = useState('+591');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit =  async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {

      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nombre: name,
        apellido: lastname,
        celular: number,
        email: user.email,
      });

      setSuccessMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
      setName('');
      setLastname('');
      setNumber('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      navigate('/home');
      
    }catch (e){
      console.error("Error al registrar el usuario:", e.code);
      if (e.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está registrado. Intenta iniciar sesión.');
      } 
      // else if (e.code === 'auth/weak-password') {
      //   setError('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      // }
      
      else {
        setError('Ocurrió un error inesperado. Intenta de nuevo más tarde.');
      }
    }finally{
      setIsLoading(false);
    }
  };

  const fieldsRegister = [
    {
      type: 'text',
      placeholder: 'Nombre',
      value: name,
      onChange: (e) => setName(e.target.value),
      required: true,
      iconType: 'user',
    },
    {
      type: 'text',
      placeholder: 'Apellido',
      value: lastname,
      onChange: (e) => setLastname(e.target.value),
      required: true,
      iconType: 'user',
    },
    {
      type: 'tel',
      placeholder: 'Telefono',
      value: number,
      onChange: (e) => setNumber(e.target.value),
      required: true,
      iconType: 'phone',
    },
    {
      type: 'email',
      placeholder: 'Correo electronico',
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
    },
    {
      type: 'password',
      placeholder: 'Confirmar contraseña',
      value: confirmPassword,
      onChange: (e) => setConfirmPassword(e.target.value),
      required: true,
      iconType: 'password',
    }
  ]
    return (
    <div className={styles.loginContainer}>
      <h2>Registrate</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <Form
        fields={fieldsRegister}
        onSubmit={handleSubmit}
        submitButtonText={isLoading ? <div className={styles['circle-loader']}></div> : "Registrar"}
      />
        <p className={styles.registerPrompt}>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
    </div>
  );
}