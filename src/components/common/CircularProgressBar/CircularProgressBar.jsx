import React from 'react';
import styles from './CircularProgressBar.module.scss';

const CircularProgressBar = ({ 
    percentage, 
    size, 
    strokeWidth = 3.37, 
    className,
    label = "FULL",
    color = "#00bcd4" 
}) => {
    const radius = 16;
    const dashArray = 75; 
    const dashOffset = (percentage / 100) * dashArray;

    return (
        <div className={`${styles.container} ${className || ''}`} style={{ width: size, height: size }}>
            <svg 
                viewBox="0 0 36 36"
                className={styles.circleBar}
            >
                <path
                    className={styles.circleBg}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashArray}, 100`}
                    strokeLinecap="round"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                <path
                    className={styles.circle}
                    strokeWidth={strokeWidth}
                    stroke={color} 
                    style={{ stroke: color }}
                    strokeDasharray={`${dashOffset}, 100`}
                    strokeLinecap="round"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                <text x="18" y="19" className={styles.percentage} style={{ fill: '#fff' }}>
                    {percentage}%
                </text>
                <text x="18" y="26" className={styles.label}>
                    {label}
                </text>
            </svg>
        </div>
    );
};

export default CircularProgressBar;