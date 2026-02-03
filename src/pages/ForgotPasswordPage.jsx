import React from "react";
import { motion } from "framer-motion";
import ForgotPass from "../components/ForgotPassword/ForgotPassword";

const pageVariants = {
  initial: { opacity: 0.5, rotateY: -90 },
  in: { opacity: 1, rotateY: 0 },
  out: { opacity: 0.5, rotateY: 90 },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.6,
};

const LoginPage = () => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <ForgotPass />
    </motion.div>
  );
};

export default LoginPage;
