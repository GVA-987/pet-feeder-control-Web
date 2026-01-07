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

        setPersistence(auth, browserSessionPersistence)
        .catch((error) => console.error("Error al establecer persistencia:", error));
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeUserDoc = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({
                        uid: user.uid,
                        email: user.email,
                        ...userData,
                        role: userData.role || 'user',
                        devicePetId: userData.deviceId || "null",
                    });
                } else {
                    setCurrentUser(user);
                }
                setLoading(false);
            });
            return () => unsubscribeUserDoc();   
        } else {
            setCurrentUser(null);
            setLoading(false);
        }
    });
        return () => unsubscribeAuth();
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