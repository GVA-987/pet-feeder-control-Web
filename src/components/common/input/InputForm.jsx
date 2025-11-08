import React, { useState } from 'react';
import styles from './InputForm.module.scss';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaMobileAlt, FaPaw} from 'react-icons/fa'

const InputForm = ({
    type = 'text',
    placeholder = '',
    value,
    onChange,
    required = false,
    iconType,
    label,
    name,
    inputClassName = '',
    containerClassName = '',
    labelClassName = '',
    unstyled = false,
    ...rest }) => {

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

    const inputType = iconType === 'password' && showPassword ? 'text' : type;

    const containerClass = unstyled ? containerClassName : `${styles.inputContainer} ${containerClassName}`;
    const inputClass = unstyled ? inputClassName : `${styles.input} ${inputClassName}`;
    const labelClass = unstyled ? labelClassName : `${styles.labelInput} ${labelClassName}`;


    return (
        <div className={styles.inputMain}>
                {label && (
                    <label htmlFor={inputId} className={labelClass}>
                        {label}
                    </label>
                )}
            <div className={containerClass}>
                {iconType && (
                    <span className={styles.icon}>
                        {getIcon()}
                    </span>
                )}
                <input
                    className={inputClass}
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