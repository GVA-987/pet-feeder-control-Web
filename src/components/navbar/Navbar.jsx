import React from 'react';
import { signOut } from '../../../node_modules/firebase/auth'; // Importamos la función signOut
import { auth } from '../../firebase/firebase-config'; // Tu objeto de autenticación
import { useAuth } from '../../context/AuthContext'; // Para saber si hay un usuario

const Navbar = () => {
    const { currentUser } = useAuth();

    const handleLogout = async () => {
    try {
        await signOut(auth);
      // Opcional: Redirigir al usuario al login después de cerrar sesión
      // navigate('/login');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
    };

    return (
    <nav>
        {currentUser ? (
        <>
            {/* Usamos un condicional para mostrar el nombre si existe, o el email si no */}
                <span>
                    Hola, {(currentUser.nombre && currentUser.apellido)
                    ? `${currentUser.nombre} ${currentUser.apellido}`
                    : currentUser.email}
                </span>
                <button onClick={handleLogout}>Cerrar Sesión</button>
        </>
        ) : (
        <span>No has iniciado sesión</span>
        )}
    </nav>
    );
};

export default Navbar;