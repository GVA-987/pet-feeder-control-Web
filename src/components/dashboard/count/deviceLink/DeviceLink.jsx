import Recat, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getDatabase, ref, set } from "firebase/database";
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db, rtdb } from '../../../../firebase/firebase-config';
import styles from './DeviceLink.module.scss';
import Modal from '../../../common/modal/Modal';
import { useNavigate } from 'react-router-dom';
import Form from '../../../common/form/Form';



const DeviceLink = () => {
    
    const [deviceId, setDeviceId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const handleLinkDevice = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await runTransaction (db, async (transaction) => {
                const deviceRef = doc(db, 'devicesPet', deviceId.toUpperCase());
                const userRef = doc(db, 'users', currentUser.uid);
                const deviceDoc = await transaction.get(deviceRef);

                if(!deviceDoc.exists()){
                    throw new Error('Equipo no encontrado. Verifica el ID.');
                }
                if(deviceDoc.data().linked_user_id !== "null"){
                    throw new Error('Este equipo ya esta enlazado a otra cuenta');
                }

                transaction.update(deviceRef, {linked_user_id: currentUser.uid})
                transaction.update(userRef, {deviceId: deviceId.toUpperCase()});
            });

            const deviceRefRT = ref(rtdb, `${deviceId.toUpperCase()}`);

            await set(deviceRefRT, {
                ownerUid: currentUser.uid,
                status: {
                online: false,
                lastSeen: Date.now()
                },
                commands: {
                last_command: null
                }
            });
            
            //onClose();
            navigate('/home');
            setDeviceId('');
        }catch (e) {
            console.log(e.message);
            setError(e.message);
        }finally {
            setLoading(false)
        }
    }

    const linkDeviceFields = [
        {
            type: 'text',
            placeholder: 'Ej: ESP-PET-####',
            value: deviceId,
            onChange: (e) => setDeviceId(e.target.value),
            required: true,
        }
    ];

    return (
        <div className={styles.conatiner}>
                <h4>Enlazar Equipo</h4>
                <p>Introduce el ID unico de su equipo</p>
                {error && <p className={styles.error}>{error}</p>}
                <Form 
                fields={linkDeviceFields}
                onSubmit={handleLinkDevice}
                submitButtonText={loading ? 'Enlazando...' : 'Enlazar'}
                // Puedes pasar una prop adicional si tu componente Form maneja el estado "disabled"
                disabled={loading}
                
            />
        </div>
    )

}

export default DeviceLink;