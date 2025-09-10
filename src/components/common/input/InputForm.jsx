import React, { useState } from 'react';
import styles from './InputForm.module.scss';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaMobileAlt, FaPaw} from 'react-icons/fa'

const InputForm = ({ type = 'text', placeholder = '', value, onChange, required = false, iconType, label, ...rest }) => {

    const [showPassword] = useState(false);
    const inputId = name ? `input-${name}` : undefined;

     // Función para determinar qué ícono mostrar
    const getIcon = () => {
        switch (iconType) {
            case 'user':
                return <FaUser />;
            case 'password':
                return <FaLock />
            case 'email':
                return <FaEnvelope />;
            case 'phone':
                return <FaMobileAlt />;
            case 'pet':
                return <FaPaw />;
            default:
                return null;
        }
    };

    //     // Función para manejar el clic en el ícono de contraseña
    // const handleIconClick = () => {
    //     if (iconType === 'password') {
    //         setShowPassword(!showPassword);
    //     }
    // };

// Determinamos el tipo de input real (text o password)
    const inputType = iconType === 'password' && showPassword ? 'text' : type;

    return (
        <div className={styles.inputMain}>
            {label && <label htmlFor={inputId} className={styles.labelInput}>{label}</label>}
        <div className={styles.inputContainer}>
            {/* Renderizamos el ícono si existe */}
            {iconType && (
                <span className={styles.icon} >
                    {getIcon()}
                </span>
            )}
            

            <input 
                className={styles.input}
                id={inputId}
                name={name}
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                {...rest}
            />
        </div>
        </div>
    );
}

export default InputForm;