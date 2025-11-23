// src/components/configuration/GeneralOptions.jsx

import React, { useState, useEffect } from 'react';
import styles from './CountOption.module.scss';
import Form from '../../common/form/Form.jsx';

const GeneralOptions = () => {
    return (
    <div className={styles.containerCount}>
        <div className={styles.cardForm}>
            <h3>Configuracion del Equipo</h3>
        </div>
    </div>
    );
};

export default GeneralOptions;