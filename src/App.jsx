import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import HomeControl from './components/dashboard/HomeControl';


function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomeControl />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
