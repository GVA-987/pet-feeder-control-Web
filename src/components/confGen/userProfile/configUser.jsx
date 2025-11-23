import react, { useState, useEffect } from 'react';
import Form from '../../common/form/Form';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';

const ConfigUser = () => {
    
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({ name: '', lastname:'', number:'', email:'', password:'' });
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if(userDocSnap.exists()) {
                    const useDataDB = userDocSnap.data();
                    setUserData({
                        name: useDataDB.nombre || '',
                        lastname: useDataDB.apellido || '',
                        number: useDataDB.celular || '',
                        email: useDataDB.email || '',
                        // password: useDataDB.password || ''
                    });
                }
            }catch (e) {
                console.error('Error al obtener los datos del usuario:', e);
            }finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, [currentUser])

    const updateUserData = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                nombre: userData.name,
                apellido: userData.lastname,
                celular: userData.number,
                email: userData.email,
            });
            console.log('Datos de usuario actualizado con éxito!');
            // onClose();
        }catch (error){
            console.error('Error al actualizar los datos del usuario', error);

            if(error.code === 'permission-denied'){
                console.log('Permisos denegados para actualizar. Contacta al administrador.');
            }
        }finally{
            setIsLoading(false);
        }
    }

    const fieldsUser = [
        {
            label: 'Nombre',
            type: 'text',
            placeholder: '',
            name: 'name',
            value: userData.name,
            onChange: (e) => setUserData({ ...userData, name: e.target.value }),
            required: true,
        },
        {
            label: 'Apellido',
            type: 'text',
            placeholder: '',
            name: 'apellido',
            value: userData.lastname,
            onChange: (e) => setUserData({ ...userData, lastname: e.target.value }),
            required: true,
            
        },
        {
            label: 'Celular',
            type: 'number',
            placeholder: '',
            name: 'number',
            value: userData.number,
            onChange: (e) => setUserData({ ...userData, number: e.target.value }),
            required: true,
        },
        {
            label: 'Correo Electronico',
            type: 'email',
            placeholder: '',
            name: 'email',
            value: userData.email,
            onChange: (e) => setUserData({ ...userData, email: e.target.value }),
            required: true,
        },
        // {
        //     label: 'Contraseña',
        //     type: 'password',
        //     placeholder: '',
        //     name: 'password',
        //     // value: userData.password,
        //     // onChange: (e) => setUserData({ ...userData, password: e.target.value }),
        //     // onChange: (e) => setPassword(e.target.value),
        //     required: false,
        // },
        // {
        //     type: 'password',
        //     placeholder: 'Confirma tu contraseña',
        //     // value: password,
        //     // onChange: (e) => setPassword(e.target.value),
        //     // value: confirmPassword,
        //     // onChange: (e) => setConfirmPassword(e.target.value),
        //     required: false,
        //     iconType: 'password',
        // }
    ]

    return (
        <div> 
            <p>Edita tus datos personales. La contraseña es opcional.</p>
            
            {loading ? (
                <p>Cargando datos del usuario...</p>
            ) : (
                <Form
                fields={fieldsUser}
                onSubmit={updateUserData}
                // submitButtonText={loading ? <div className={styles['circle-loader']}></div> : "Actualizar Datos del Usuario"}
                submitButtonText={"Actualizar Datos del Usuario"}
                isLoading={isLoading}
            />
            )}
        </div>
    );

}
export default ConfigUser;