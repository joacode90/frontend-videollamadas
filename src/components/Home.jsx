import React, { useState } from 'react';

const Home = ({ usuario, onJoinMeeting }) => {
    const [meetingCode, setMeetingCode] = useState('');
    const [errorHome, setErrorHome] = useState('');

    // 📹 Función para crear la reunión desde el botón
    const handleCrearReunion = async () => {
        setErrorHome('');
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/meetings/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ creador_id: usuario?.id }), // Enviamos el ID del usuario logueado
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorHome(data.error || 'No se pudo crear la reunión.');
            } else {
                // Redirigimos a la pantalla de la videollamada pasando el código generado
                onJoinMeeting(data.codigo_sala);
            }
        } catch (error) {
            console.error('Error de red al crear reunión:', error);
            setErrorHome('Error de conexión con el servidor.');
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setErrorHome(''); // Limpiamos errores previos

        // Validamos que el usuario no haya dejado el campo vacío
        if (!meetingCode.trim()) {
            setErrorHome('Por favor, introduce un código de sala.');
            return;
        }

        try {
            // 🌐 Consultamos al Backend si el código existe en MySQL
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/meetings/validate/${meetingCode.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                // ❌ Si el backend responde con error (404), mostramos el mensaje en la interfaz
                setErrorHome(data.error || 'Código inválido.');
            } else {
                // ✅ Si es válido, pasamos a la pantalla de la videollamada con ese código
                onJoinMeeting(data.sala.codigo_sala);
            }
        } catch (error) {
            console.error('Error de red al validar la reunión:', error);
            setErrorHome('No se pudo conectar con el servidor para validar el código.');
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex flex-col text-gray-800 font-sans">

            {/* 🧭 HEADER / NAVBAR */}
            <header className="w-full h-20 px-8 flex items-center justify-between border-b border-gray-100">
                {/* Logo de Videollamada */}
                <div className="bg-[#007bff] p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/20">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                </div>

                {/* Avatar de Perfil */}
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition cursor-pointer">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>
            </header>

            {/* 🎯 CONTENIDO CENTRAL */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
                <div className="text-center max-w-2xl w-full">

                    {/* 🚨 CARTEL DE ERROR INTEGRADO (Estilo Minimalista) */}
                    {errorHome && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl mb-6 w-full max-w-md mx-auto text-center font-medium animate-fade-in shadow-xs">
                            {errorHome}
                        </div>
                    )}

                    {/* Títulos */}
                    <h1 className="text-6xl font-light text-gray-900 tracking-tight mb-4">
                        Videollamadas
                    </h1>
                    <p className="text-xl text-gray-500 font-normal mb-12">
                        Crea una nueva reunión o únete a la de alguien más.
                    </p>

                    {/* 🔘 ZONA DE ACCIONES (Formulario e inputs) */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">

                        {/* Botón Nueva Reunión */}
                        <button
                            onClick={handleCrearReunion} // 👈 Cambia de pantalla al hacer clic 
                            className="w-full sm:w-auto h-12 px-6 bg-[#007bff] hover:bg-[#0069d9] text-white font-medium rounded-full flex items-center justify-center gap-3 transition cursor-pointer shadow-lg shadow-blue-500/10 shrink-0"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Nueva reunión
                        </button>

                        {/* Input y Botón Unirse */}
                        <form onSubmit={handleJoin} className="flex items-center gap-3 w-full sm:w-auto max-w-sm">
                            <input
                                type="text"
                                placeholder="Ingresa código"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className="w-full h-12 px-5 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                            />
                            <button
                                type="submit"
                                disabled={!meetingCode.trim()}
                                className={`text-base font-medium px-2 transition h-12 ${meetingCode.trim()
                                    ? 'text-[#007bff] hover:text-[#0056b3] cursor-pointer'
                                    : 'text-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                Unirse
                            </button>
                        </form>

                    </div>

                </div>
            </main>

        </div>
    );
};

export default Home;