import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth, setPersistence, signInWithEmailAndPassword, browserSessionPersistence, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase-config';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}
export function AuthProvider({ children }) {

    
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (email, password) => {
        const authInstance = getAuth(); 
        await setPersistence(authInstance, browserSessionPersistence);
        return signInWithEmailAndPassword(authInstance, email, password);
    };

    const logout = () => {
        return signOut(auth); 
    };

    useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        // 1. Si hay un cambio de auth, primero limpiamos cualquier suscripción activa anterior
        if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
            unsubscribeUserDoc = null;
        }

        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            
            // 2. Usamos onSnapshot para mantener el rol y deviceId actualizados en tiempo real
            unsubscribeUserDoc = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({
                        uid: user.uid,
                        email: user.email,
                        ...userData,
                        role: userData.role || 'user',
                        // Usamos deviceId consistente con tus capturas de pantalla
                        deviceId: userData.deviceId || null, 
                    });
                } else {
                    // Si el documento no existe aún (ej. registro nuevo)
                    setCurrentUser({
                        uid: user.uid,
                        email: user.email,
                        ...userData,
                        role: userData.role || 'user',
                        deviceId: userData.deviceId || null, // Usa 'deviceId' para que coincida con Firestore
                    });
                }
                setLoading(false);
            }, (error) => {
                console.error("Error en Snapshot de usuario:", error);
                setLoading(false);
            });
        } else {
            // 3. Al cerrar sesión, limpiamos el estado completamente
            setCurrentUser(null);
            setLoading(false);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
}, []);

    const value = {
        currentUser,
        login,
        logout,
        isAdmin: currentUser?.role === 'admin'
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}