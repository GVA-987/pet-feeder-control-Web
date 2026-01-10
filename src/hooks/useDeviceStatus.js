import { useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, off } from "firebase/database";
import toast from 'react-hot-toast';

export const useDeviceStatus = (deviceId) => {
    const isFirstLoad = useRef(true);
    const lastStatus = useRef(null);

    useEffect(() => {
        if (!deviceId) return;

        const dbRT = getDatabase();
        const statusRef = ref(dbRT, `${deviceId}/status/online`);

        const handleStatusChange = (snapshot) => {
            const currentStatus = snapshot.val();

            if (currentStatus !== null) {
                if (isFirstLoad.current) {
                    lastStatus.current = currentStatus;
                    isFirstLoad.current = false;
                    return;
                }

                if (lastStatus.current !== currentStatus) {
                    if (currentStatus === "conectado") {
                        toast.success("Equipo en línea", { className: 'custom-toast-success', });

                    } else if (currentStatus === "desconectado") {
                        toast.error("Equipo desconectado", { className: 'custom-toast-error', });
                    }
                    lastStatus.current = currentStatus;
                }
            }
        };

        onValue(statusRef, handleStatusChange);
        return () => off(statusRef, 'value', handleStatusChange);
    }, [deviceId]);
};