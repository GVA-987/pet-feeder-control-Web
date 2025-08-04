import React from 'react';
import { motion } from 'framer-motion';
import Login from '../components/Login/Login'; // Tu componente del formulario

// 1. Define las propiedades de la animación
const pageVariants = {
    initial: { opacity: 0.5, rotateY: -90 },
    in: { opacity: 1, rotateY: 0 },
    out: { opacity: 0.5, rotateY: 90 }
};

const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.6
};

const LoginPage = () => {
    return (
    // 2. Envuelve tu contenido con <motion.div> y aplica las props de animación
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
    >
        <Login />
    </motion.div>
    );
};

export default LoginPage;
