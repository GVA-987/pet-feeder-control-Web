import react, { useState, useEffect } from 'react';
import Form from '../../common/form/Form';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-config';
import { useAuth } from '../../../context/AuthContext';

const ConfigPet = () => {

    const { currentUser } = useAuth();
    const [petData, setPetData] = useState({ name: '', breed: '', age: '', weight: '' });
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
                    setPetData(useDataDB.pets || { name: '', breed: '', age: '', weight: '' });
                }
            }catch (e) {
                console.error('Error al obtener los datos del usuario:', e);
            }finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, [currentUser]);

    const AddandUodatePet = async (e) => {
            e.preventDefault();
            setIsLoading(true);
                try {
                    const petRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(petRef, {
                        pets: {
                            name: petData.name,
                            breed: petData.breed,
                            age: petData.age,
                            weight: petData.weight
                        }
                    });
                    alert('Datos de la mascota actualizados con éxito.');
                }catch (error) {
                    console.error('Error al guardar los datos de la mascota:', error);
                }
                finally {
                    setIsLoading(false);
            }
        }

    const fieldsPet = [
        {
            label: 'Nombre',
            type: 'text',
            placeholder: '',
            value: petData.name,
            onChange: (e) => setPetData({ ...petData, name: e.target.value }),
            required: true,
        },
        {
            label: 'Raza',
            type: 'text',
            placeholder: '',
            value: petData.breed,
            onChange: (e) => setPetData({ ...petData, breed: e.target.value }),
            required: true,
        },
        {
            label: 'Edad',
            type: 'text',
            placeholder: '',
            value: petData.age,
            onChange: (e) => setPetData({ ...petData, age: e.target.value }),
            required: true,
        },
        {
            label: 'Peso',
            type: 'text',
            placeholder: '',
            value: petData.weight,
            onChange: (e) => setPetData({ ...petData, weight:e.target.value }),
            required: true,
        }
    ]

    return (
        <div> 
            <p>Edita tus datos personales. La contraseña es opcional.</p>
            <Form
                fields={fieldsPet}
                onSubmit={AddandUodatePet}
                // submitButtonText={loading ? <div className={styles['circle-loader']}></div> : "Actualizar Datos de la Mascota"}
                submitButtonText={"Actualizar Datos de la Mascota"}
                isLoading={isLoading}
            />
        </div>
    );
}
export default ConfigPet;