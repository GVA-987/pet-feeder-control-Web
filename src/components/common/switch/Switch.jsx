import React from 'react';
import styles from './Switch.module.scss';

const Switch = ({ isOn, handleToggle, id }) => {
    return (
    <div className={styles.switchContainer}>
        <input
            checked={isOn}
            onChange={handleToggle}
            className={styles.switchCheckbox}
            id={`switch-${id}`}
            type="checkbox"
        />
        <label
            className={styles.switchLabel}
            htmlFor={`switch-${id}`}
        >
        <span className={styles.switchButton} />
        </label>
    </div>
    );
};

export default Switch;