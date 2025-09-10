import React from 'react';
import styles from './ButtonForm.module.scss';

const ButtonForm = ({ children, onClick, type = 'button', ...rest }) => {
    return (
        <button
        className={`${styles.btnForm}`}
        type={type}
        onClick={onClick}
        {...rest}
        >
            {children}
        </button>
    )
}

export default ButtonForm;