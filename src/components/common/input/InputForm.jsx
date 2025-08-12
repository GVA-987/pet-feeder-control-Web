import React, { useState } from 'react';
import styles from './InputForm.module.scss';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaMobileAlt } from 'react-icons/fa'

const InputForm = ({ type, placeholder, value, onChange, required, iconType }) => {

    const [showPassword, setShowPassword] = useState(false);

     // Función para determinar qué ícono mostrar
    const getIcon = () => {
        switch (iconType) {
            case 'user':
                return <FaUser />;
            case 'password':
                // Para el caso de la contraseña, mostramos el ícono del ojo
                return showPassword ? <FaEyeSlash /> : <FaEye />;
            case 'email':
                return <FaEnvelope />;
            case 'phone':
                return <FaMobileAlt />;
            default:
                return null;
        }
    };

        // Función para manejar el clic en el ícono de contraseña
    const handleIconClick = () => {
        if (iconType === 'password') {
            setShowPassword(!showPassword);
        }
    };

// Determinamos el tipo de input real (text o password)
    const inputType = iconType === 'password' && showPassword ? 'text' : type;

    return (
        <div className={styles.inputContainer}>
            {/* Renderizamos el ícono si existe */}
            {iconType && (
                <span className={styles.icon} onClick={handleIconClick} >
                    {getIcon()}
                </span>
            )}

            <input 
                className={styles.input}
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required} 
            />
        </div>
    );
}

export default InputForm;