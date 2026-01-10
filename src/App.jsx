import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RoutesWithAnimation from './components/Routs/RoutesWithAnimation';
import { Toaster } from 'react-hot-toast';
import './scss/base/_toasts.scss';

function App() {
  return (
    <Router>
      <Toaster 
                position="top-center" 
                toastOptions={{
                    duration: 5000,
                }}
            />
      <RoutesWithAnimation />
    </Router>
  );
}

export default App;
