import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from '../../node_modules/firebase/auth';
import { doc, getDoc } from '../../node_modules/firebase/firestore';
import { auth, db } from '../firebase/firebase-config';

const AuthContext = createContext();

//Creamos un hook para usar el contexto
export function useAuth() {
    return useContext(AuthContext);
}

//Componente proveedor
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async user => {
        if (user) {
        // Si hay un usuario, buscamos su documento en Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
            // Combinamos la información de Auth con los datos de Firestore
                const combinedUser ={
                    ...user,
                    ...userData,
                    devicePetId: userData.deviceId || null,
                };
                setCurrentUser(combinedUser);

            } else {
            // Si no se encuentra el documento, solo usamos la info de Auth
                setCurrentUser(user);
            }
        } else {
            setCurrentUser(null);
        }
            setLoading(false);
    });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}