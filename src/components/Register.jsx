import React, { useState } from 'react';
import AuthCard from './AuthCard';

const Register = ({ onSwitchScreen }) => {
    // 🔑 Estados para capturar los tres campos de texto
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Limpiar errores previos

        // Validar coincidencia de contraseñas de forma local
        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden.');
            return;
        }

        try {
            // 🌐 Enviamos los datos al Backend
            // 'http://localhost:5000/api/auth/register'
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Si el backend responde con un error (ej: el email ya existe)
                setErrorMessage(data.error || 'Hubo un error al registrar el usuario.');
            } else {
                // Si todo sale bien, notificamos y redirigimos al Login
                alert('🎉 ¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
                onSwitchScreen('login');
            }
        } catch (error) {
            console.error('Error de red:', error);
            setErrorMessage('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
        }
    };

    return (
        <AuthCard title="Crear Cuenta" isLogin={false}>
            <form onSubmit={handleSubmit} className="flex flex-col w-full text-left">

                {/* 📧 Campo: Correo Electrónico */}
                <label className="text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3e73ff] focus:border-transparent outline-none transition mb-6"
                    placeholder="tu@correo.com"
                    required
                />

                {/* 🔒 Campo: Contraseña */}
                <label className="text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3e73ff] focus:border-transparent outline-none transition mb-6"
                    placeholder="••••••••"
                    required
                />

                {/* 🔄 Campo: Repetir Contraseña */}
                <label className="text-sm font-medium text-gray-700 mb-2">
                    Repetir Contraseña
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3e73ff] focus:border-transparent outline-none transition mb-8"
                    placeholder="••••••••"
                    required
                />

                {/* 🚀 Botón Principal: Registrarse */}
                <button
                    type="submit"
                    className="w-full h-12 bg-[#3e73ff] hover:bg-[#2a5bdf] text-white font-bold rounded-lg transition shadow-md shadow-blue-500/10 mb-4"
                >
                    Registrarse
                </button>

                {/* 🔙 Botón Secundario: Iniciar Sesión (para volver) */}
                <button
                    type="button"
                    onClick={() => onSwitchScreen('login')} // 🔄 Cambia el estado en App.jsx a 'login'
                    className="w-full h-12 bg-[#3e73ff] hover:bg-[#2a5bdf] text-white font-bold rounded-lg transition shadow-md shadow-blue-500/10"
                >
                    Iniciar Sesión
                </button>

            </form>
        </AuthCard>
    );
};

export default Register;