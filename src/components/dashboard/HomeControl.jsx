import react from 'react';
import { useState, useEffect } from 'react';
import logo from '../../assets/petlog.png';

function HomeControl() {
  return (
    <div>
      <img src={logo} alt="Logo" />
        <h1>Bienvenido a PetControl-GVA</h1>
        <p>Esta es la página de inicio del sistema de control de mascotas.</p>
    </div>
  );
}

export default HomeControl;