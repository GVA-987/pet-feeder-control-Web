import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RoutesWithAnimation from './components/Routs/RoutesWithAnimation';

function App() {
  return (
    <Router>
      <RoutesWithAnimation />
    </Router>
  );
}

export default App;
