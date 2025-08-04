import React from 'react';
import styles from './InputForm.module.scss';

const InputForm = ({ type, placeholder, value, onChange, required }) => {
    return (
        <input 
        className={`${styles.input}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required} 
        />
    )
}

export default InputForm;