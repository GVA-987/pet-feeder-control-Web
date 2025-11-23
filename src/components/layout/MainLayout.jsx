import React from 'react';
import Navbar from './Navigatebar/Navbar';
import styles from './MainLayout.module.scss';
import Header from './Header/Header';

const MainLayout = ({ children }) => {
    return (
    <div className={styles.mainLayout}>
        <Navbar />
        <div className={styles.contentArea}>
            <Header />
            <main>
                {children}
            </main>
        </div>
    </div>
    );
};

export default MainLayout;