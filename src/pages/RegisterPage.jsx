import Register from '../components/register/Register';
import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 1, rotateY: 90 },
    in: { opacity: 1, rotateY: 0 },
    out: { opacity: 1, rotateY: -90 }
};

const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.6
};

const RegisterPage = () => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
        >
            <Register />
        </motion.div>
    );
}
export default RegisterPage;