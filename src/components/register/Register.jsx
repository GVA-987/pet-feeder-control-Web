import { countryCode } from '../../utils/countryCode';
import styles from './Register.module.scss';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    console.log('Nombre:', name);
    console.log('Apellido:', lastname);
    console.log('Código de país:', selectCode);
    console.log('Número de teléfono:', number);
    console.log('Email:', email);
    console.log('Password:', password);

    setName('');
    setLastname('');
    setNumber('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    navigate('/login');
  };

    return (
    <div className={styles.loginContainer}>
      <h2>Registrate</h2>
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
        <InputForm
        type="password"
        placeholder="Repita su contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        />

        {/* <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          required
        />
        <select 
        id="country-code"
        value={selectCode}
        onChange={(e) => setSelectCode(e.target.value)}>
          {countryCode.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>

          ))}
        </select>
        <input
          type="tel"
          placeholder="Telefono"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
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
        /> */}
        
        <ButtonForm type="submit">Registrate</ButtonForm>
      </form>
        <p className={styles.registerPrompt}>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      
    </div>
  );
}