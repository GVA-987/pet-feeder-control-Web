import { countryCode } from '../../utils/countryCode';
import styles from './Register.module.scss';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from '../../../node_modules/firebase/auth';
import { doc, setDoc } from '../../../node_modules/firebase/firestore';
import { auth, db } from '../../firebase/firebase-config.js';
import ButtonForm from '../common/button/ButtonForm';
import InputForm from '../common/input/InputForm';

export default function Register() {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [number, setNumber] = useState('');
  const [selectCode, setSelectCode] = useState('+591');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit =  async (e) => {
    e.preventDefault();
    setError('');
    // Aquí iría la lógica de autenticación

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nombre: name,
        apellido: lastname,
        celular: number,
        email: user.email,
      });

      console.log('Usuario registrado con exito', user);
      setName('');
      setLastname('');
      setNumber('');
      setEmail('');
      setPassword('');
      // Redirigir al usuario a la página de inicio o dashboard
      navigate('/login');
      
    }catch (e){
      console.log("Erro al registrar el usaurio", e);
      setError(e.message);
    }
  };

    return (
    <div className={styles.loginContainer}>
      <h2>Registrate</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <InputForm 
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        />
        <InputForm
        type="text"
        placeholder="Apellido"
        value={lastname}
        onChange={(e) => setLastname(e.target.value)}
        required
        />
        <InputForm
        type="tel"
        placeholder="Telefono"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        required
        />
        <InputForm
        type="email"
        placeholder="Correo electronico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        />
        <InputForm
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        />        
        <ButtonForm type="submit">Registrate</ButtonForm>
      </form>
        <p className={styles.registerPrompt}>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      
    </div>
  );
}