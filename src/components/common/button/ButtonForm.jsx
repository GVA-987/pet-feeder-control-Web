import React from 'react';
import styles from './ButtonForm.module.scss';

const ButtonForm = ({ children, onClick, type = 'button' }) => {
    return (
        <button
        className={`${styles.button}`}
        type={type}
        onClick={onClick}
        >
            {children}
        </button>
    )
}

export default ButtonForm;