import React from 'react';
import Navbar from './navbar/Navbar'; // Asumiendo esta ruta

const MainLayout = ({ children }) => {
    return (
    <>
        <Navbar />
            <main>
                {children}
            </main>
    </>
    );
};

export default MainLayout;