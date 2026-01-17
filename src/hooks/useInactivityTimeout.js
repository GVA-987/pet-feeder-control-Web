import { useEffect, useCallback } from 'react';
import { auth } from '../firebase/firebase-config';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useInactivityTimeout = (timeoutInMinutes = 60) => {
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        try {
            if (auth.currentUser) {
                await auth.signOut();
                toast('Sesión cerrada por inactividad', {
                    icon: '⏰',
                    style: { background: '#333', color: '#fff' }
                });
                navigate('/login');
            }
        } catch (error) {
            console.error("Error al cerrar sesión por inactividad", error);
        }
    }, [navigate]);

    useEffect(() => {
        let timer;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(handleLogout, timeoutInMinutes * 60 * 1000);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const setEvents = () => {
            events.forEach(event => window.addEventListener(event, resetTimer));
        };

        const cleanEvents = () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };

        resetTimer();
        setEvents();

        return () => {
            if (timer) clearTimeout(timer);
            cleanEvents();
        };
    }, [handleLogout, timeoutInMinutes]);
};