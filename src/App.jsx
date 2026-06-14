import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Meeting from './components/Meeting';

function App() {
  // 🧭 Estado central de la navegación. Arranca en 'login'.
  // Valores posibles: 'login' | 'register' | 'home' | 'meeting'
  const [screen, setScreen] = useState('login');
  const [usuarioLogueado, setUsuarioLogueado] = useState(null); // 👈 Guardará { id, email }
  const [currentMeetingCode, setCurrentMeetingCode] = useState(''); // 👈 Guardará el código de la sala activa

  // Función que llamará Login cuando el inicio de sesión sea exitoso
  const handleLoginSuccess = (usuario) => {
    setUsuarioLogueado(usuario);
    setScreen('home');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">

      {/* 🔐 Pantalla de Inicio de Sesión */}
      {screen === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} onSwitchScreen={setScreen} />
      )}

      {/* 📝 Pantalla de Registro de Nuevos Usuarios */}
      {screen === 'register' && (
        <Register onSwitchScreen={setScreen} />
      )}

      {/* 🏠 Pantalla de Inicio (Dashboard de la App) */}
      {screen === 'home' && (
        <Home
          usuario={usuarioLogueado}
          onJoinMeeting={(codigo) => {
            setCurrentMeetingCode(codigo);
            setScreen('meeting');
          }}
        />
      )}

      {/* 📹 Pantalla de la Videollamada Activa */}
      {screen === 'meeting' && (
        <Meeting codigoSala={currentMeetingCode} onLeaveMeeting={() => setScreen('home')} />
      )}

    </div>
  );
}

export default App;