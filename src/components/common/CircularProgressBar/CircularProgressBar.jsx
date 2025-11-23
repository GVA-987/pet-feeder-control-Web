// src/components/common/CircularProgressBar/CircularProgressBar.jsx

import React from 'react';
import styles from './CircularProgressBar.module.scss';

const CircularProgressBar = ({ percentage, size = 36, strokeWidth = 3.37 }) => {
    
    // Para una barra simple, 100 es la circunferencia total en esta escala de viewBox="0 0 36 36".
    const normalizedRadius = 16; 

    return (
        <svg 
            className={styles.circleBar} 
            viewBox="0 0 36 36"
            width={size}
            height={size}
        >
            {/* Fondo */}
            <path
                className={styles.circleBg}
                d={`M18 2.0845 a ${normalizedRadius} ${normalizedRadius} 0 0 1 0 ${2 * normalizedRadius} a ${normalizedRadius} ${normalizedRadius} 0 0 1 0 ${-2 * normalizedRadius}`}
            />
            {/* Barra de Progreso */}
            <path
                className={styles.circle}
                // Porcentaje para el llenado de la barra
                strokeDasharray={`${percentage}, 100`}
                d={`M18 2.0845 a ${normalizedRadius} ${normalizedRadius} 0 0 1 0 ${2 * normalizedRadius} a ${normalizedRadius} ${normalizedRadius} 0 0 1 0 ${-2 * normalizedRadius}`}
            />
            <text x="18" y="20.35" className={styles.percentage}>
                {percentage}%
            </text>
        </svg>
    );
};

export default CircularProgressBar;