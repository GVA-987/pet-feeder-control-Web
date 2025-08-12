import React from 'react';
import Navbar from './Navigatebar/Navbar'; // Asumiendo esta ruta
import styles from './MainLayout.module.scss';

const MainLayout = ({ children }) => {
    return (
    <div className={styles.mainLayout}>
        <Navbar />
        <div className={styles.contentArea}>
            <main>
                {children}
            </main>
        </div>
    </div>
    );
};

export default MainLayout;