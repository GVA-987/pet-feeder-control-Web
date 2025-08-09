import { countryCode } from '../../utils/countryCode';
import styles from './Register.module.scss';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from '../../../node_modules/firebase/auth';
import { doc, setDoc } from '../../../node_modules/firebase/firestore';
import { auth, db } from '../../firebase/firebase-config.js';
import ButtonForm from '../common/button/ButtonForm';
// import styles from '../common/button/ButtonForm.module.scss';
import InputForm from '../common/input/InputForm';
import { div, style } from 'framer-motion/client';

export default function Register() {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [number, setNumber] = useState('');
  const [selectCode, setSelectCode] = useState('+591');
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
    // Aquí iría la lógica de autenticación
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

      // Cerrar sesión después del registro para forzar al usuario a loguearse
      // await signOut(auth); // <--- Línea añadida para cerrar sesión

      setSuccessMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
      setName('');
      setLastname('');
      setNumber('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Redirigir al usuario a la página de inicio o dashboard
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

    return (
    <div className={styles.loginContainer}>
      <h2>Registrate</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <InputForm type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required/>
        <InputForm type="text" placeholder="Apellido" value={lastname} onChange={(e) => setLastname(e.target.value)} required/>
        <InputForm type="tel"  placeholder="Telefono" value={number} onChange={(e) => setNumber(e.target.value)} required />
        <InputForm type="email" placeholder="Correo electronico" value={email} onChange={(e) => setEmail(e.target.value)} required/>
        <InputForm type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required/>        
        <InputForm type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>        
        
        <ButtonForm type="submit" disabled={isLoading}>
        {isLoading ? (
          // Si esta carganndo, muestra el estado de carga
          <div className={styles["circle-loader"]}></div>
        ): ("Registrar")}
        </ButtonForm>
      </form>
        <p className={styles.registerPrompt}>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      
    </div>
  );
}