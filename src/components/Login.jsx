import React, { useState } from 'react';
import AuthCard from './AuthCard';

const Login = ({ onSwitchScreen, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Limpiar errores previos

        try {
            // 🌐 Enviamos las credenciales al Backend
            // 'http://localhost:5000/api/auth/login'
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Credenciales incorrectas o usuario inexistente
                setErrorMessage(data.error || 'Error al iniciar sesión.');
            } else {
                // 🎉 Login exitoso: Pasamos a la pantalla de Inicio (Home)
                console.log('Usuario autenticado:', data.user);
                onLoginSuccess(data.user); // 👈 Guardamos el usuario en el estado central y redirigimos
            }
        } catch (error) {
            console.error('Error de red:', error);
            setErrorMessage('No se pudo conectar con el servidor. Verifica tu conexión.');
        }
    };

    return (
        <AuthCard title="Iniciar Sesión" isLogin={true}>
            {/* 📋 El formulario ahora es un contenedor Flex vertical */}
            <form onSubmit={handleSubmit} className="flex flex-col w-full text-left">

                {/* 📧 Bloque de Email */}
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

                {/* 🔒 Bloque de Contraseña */}
                <label className="text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3e73ff] focus:border-transparent outline-none transition mb-8"
                    placeholder="••••••••"
                    required
                />

                {/* 🚀 Botón Principal: Iniciar Sesión */}
                <button
                    type="submit"
                    className="w-full h-12 bg-[#3e73ff] hover:bg-[#2a5bdf] text-white font-bold rounded-lg transition shadow-md shadow-blue-500/10 mb-4"
                >
                    Iniciar Sesión
                </button>

                {/* 📝 Botón Secundario: Registrarse */}
                <button
                    type="button"
                    onClick={() => onSwitchScreen('register')} // 🔄 Cambia el estado en App.jsx a 'register'
                    className="w-full h-12 bg-[#3e73ff] hover:bg-[#2a5bdf] text-white font-bold rounded-lg transition shadow-md shadow-blue-500/10"
                >
                    Registrarse
                </button>

            </form>
        </AuthCard>
    );
};

export default Login;