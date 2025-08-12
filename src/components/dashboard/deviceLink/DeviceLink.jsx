import Recat, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, runTransaction } from '../../../../node_modules/firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import styles from './DeviceLink.module.scss';
import Modal from '../../common/modal/Modal';

const DeviceLink = ({ onClose }) => {

    const [deviceId, setDeviceId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLinkDevice = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if(!currentUser) {
            setError('No hay un usuario autenticado');
            setLoading(false);
            return;
        }
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
            //onClose();
            navigate('/home');
        }catch (e) {
            console.log(e.message);
            setError(e.message);
        }finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.conatiner}>
            <form className={styles.formDevice} onSubmit={handleLinkDevice}>
                <h2>Enlazar Dosificadora</h2>
                <p>Introduce el ID unico de su equipo</p>
                {error && <p className={styles.error}>{error}</p>}
                <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Ej: ESP-PET-####" required/>

                <button type="submit" disabled={loading}>
                    {loading ? 'Enlazando...': 'Enlazar'}
                </button>
            </form>
        </div>
    )

}

export default DeviceLink;