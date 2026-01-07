import React from 'react';
import Navbar from './Navigatebar/Navbar';
import styles from './MainLayout.module.scss';
import Header from './Header/Header';
import AdminNavbar from './Navigatebar/AdminNavbar';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
    const {currentUser} = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className={`${styles.mainLayout} ${isAdmin ? styles.adminTheme : ''}`}>
            {isAdmin ? <AdminNavbar /> : <Navbar />}
            <div className={styles.contentArea}>
                {!isAdmin && <Header />}
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
        );
    };

export default MainLayout;