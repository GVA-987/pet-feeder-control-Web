# 🐾 PetFeeder Web System

Sistema de control y monitoreo web para el dosificador automático de mascotas. Esta interfaz permite la gestión remota, visualización de historial y envío de comandos en tiempo real.

## 🚀 Tecnologías Utilizadas

- **React 18** + **Vite**: Para una interfaz rápida y reactiva.
- **SASS**: Preprocesador de CSS para estilos modulares y mantenibles.
- **Firebase**:
  - **Realtime Database/Firestore**: Para la sincronización de comandos y lectura de estados.
  - **Authentication**: Gestión de acceso de usuarios.

---

## 🏗️ Arquitectura del Proyecto

Este repositorio es solo el **Frontend**, pero forma parte de un ecosistema IoT integrado:

1.  **Frontend (Este repo):** Interfaz de usuario donde se activan dispensaciones y se consulta el historial. Se comunica directamente con Firebase.
2.  **[Backend Node.js](https://github.com/GVA-987/pet-feeder-backend.git):** Actúa como puente (bridge) entre Firebase y el protocolo MQTT.
3.  **[Firmware ESP32](https://github.com/GVA-987/device-pet-feederESP32.git):** Suscrito a HiveMQ para recibir órdenes y ejecutar la acción física del motor.

---

## ✨ Funcionalidades

- **Panel de Control:** Activación manual del motor para alimentar a la mascota de acuerdo a una porcion programada.
- **Programacion de horarios:** Se programan horarios para alimentar a la mascota de forma automatico de acuerdo a una porcion programada.
- **Lectura de Historial:** Visualización de registros de alimentación guardados en Firebase.
- **Estado del Dispositivo:** Indicadores de conexión y sensores en tiempo real.
