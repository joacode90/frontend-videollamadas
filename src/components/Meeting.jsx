import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import style from '../style.module.css';

const Meeting = ({ codigoSala, onLeaveMeeting }) => {
    // 🎙️ Estados para los controles multimedia
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const localVideoRef = useRef(null); // 👈 Referencia para el recuadro de tu cámara
    const socketRef = useRef(null); // vamos a crear una referencia para guardar la conexión del socket y que no se pierda entre renderizados de React
    const peerConnectionRef = useRef(null); // 👈 Guarda la conexión WebRTC
    const remoteVideoRef = useRef(null);   // 👈 Apuntará al recuadro del segundo usuario
    const [localStream, setLocalStream] = useState(null); // 👈 Guardará el flujo de audio/video

    // ⏱️ Estado para el temporizador (segundos totales)
    const [seconds, setSeconds] = useState(0); // Inicializado en 01:23:06 para coincidir con tu foto

    // 🔄 Efecto para manejar el contador de tiempo real
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prevSeconds) => prevSeconds + 1);
        }, 1000);

        return () => clearInterval(interval); // Limpieza al desmontar
    }, []);

    // 🛠️ Función auxiliar para formatear los segundos a HH:MM:SS
    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        return [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    };

    useEffect(() => {
        // 1️⃣ Inicializamos el socket una sola vez
        socketRef.current = io(import.meta.env.VITE_BACKEND_URL);

        const rtcConfig = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        // Guardamos una copia interna del stream para los callbacks de WebRTC
        let streamActivo = null;

        const encenderCamara = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamActivo = stream;
                asignarFlujoLocal(stream);
            } catch (error) {
                console.warn("Iniciando en modo solo audio por falta de cámara física.");
                try {
                    const soloAudioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    streamActivo = soloAudioStream;
                    setIsCameraOff(true);
                    asignarFlujoLocal(soloAudioStream);
                } catch (audioError) {
                    console.error("No se detectaron dispositivos de audio:", audioError);
                }
            }
        };

        const asignarFlujoLocal = (stream) => {
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            // Entramos a la sala usando el ID único de nuestro socket
            socketRef.current.emit('join-room', codigoSala, socketRef.current.id);
        };

        // 🚪 EVENTO: Alguien se conecta -> Creamos Oferta
        socketRef.current.on('user-connected', async (usuarioId) => {
            console.log(`🔊 Creando conexión WebRTC con: ${usuarioId}`);

            peerConnectionRef.current = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            // Usamos 'streamActivo' para evitar depender del estado de React
            if (streamActivo) {
                streamActivo.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, streamActivo));
            }

            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', codigoSala, event.candidate);
                }
            };

            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socketRef.current.emit('offer', codigoSala, offer);
        });

        // 📩 EVENTO: Recibimos Oferta -> Creamos Respuesta
        socketRef.current.on('offer', async (offer) => {
            if (!peerConnectionRef.current) {
                peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

                if (streamActivo) {
                    streamActivo.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, streamActivo));
                }

                peerConnectionRef.current.ontrack = (event) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                peerConnectionRef.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketRef.current.emit('ice-candidate', codigoSala, event.candidate);
                    }
                };
            }

            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socketRef.current.emit('answer', codigoSala, answer);
        });

        // ✉️ EVENTO: Recibimos Respuesta
        socketRef.current.on('answer', async (answer) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // 🌐 EVENTO: Intercambio de candidatos ICE
        socketRef.current.on('ice-candidate', async (candidate) => {
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (e) {
                console.error("Error al añadir candidato ICE", e);
            }
        });

        // Escuchar si el otro usuario abandona la llamada voluntariamente
        socketRef.current.on('user-disconnected', (usuarioId) => {
            console.log(`❌ El usuario remoto se ha desconectado.`);
            // Limpiamos la referencia del video/audio del otro para que deje de sonar
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        });

        // Ejecutamos el encendido de hardware
        encenderCamara();

        // 🛑 LIMPIEZA: Se ejecuta ÚNICAMENTE cuando el usuario sale de la reunión
        return () => {
            if (streamActivo) {
                streamActivo.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            console.log("🔌 Conexiones cerradas limpiamente al salir.");
        };
    }, [codigoSala]); // 👈 ¡Dejamos SOLO codigoSala aquí!

    // 🎤 Función para encender/apagar el micrófono de manera segura
    const toggleMic = () => {
        if (localStream) {
            // Obtenemos la pista de audio (micrófono) del flujo local
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                // Si estaba activo, lo apaga; si estaba apagado, lo enciende
                audioTrack.enabled = isMuted;
            }
        }
        // Cambiamos el estado visual de React para que el botón cambie de color
        setIsMuted(!isMuted);
    };

    // 🚪 Función para colgar la llamada y limpiar todo el sistema
    const handleSalir = () => {
        // 1️⃣ Apagamos físicamente el micrófono y la cámara
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            console.log("🎙️ Hardware multimedia apagado por el usuario.");
        }

        // 2️⃣ Cerramos la conexión peer-to-peer de WebRTC
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        // 3️⃣ Avisamos al servidor que nos vamos y nos desconectamos
        if (socketRef.current) {
            socketRef.current.emit('leave-room', codigoSala);
            socketRef.current.disconnect();
        }

        // 4️⃣ Volvemos al Home de la aplicación
        onLeaveMeeting();
    };

    return (
        <div className="min-h-screen w-full bg-[#2a2a2a] flex flex-col text-white font-sans select-none relative overflow-hidden">

            {/* 🟦 BARRA SUPERIOR (GRADIENTE) */}
            <header className="w-full h-16 bg-linear-to-r from-[#0d1b3e] to-[#122960] px-6 flex items-center justify-between z-10 shadow-md">
                {/* Logo + Código de Sala (Agrupados en un contenedor flex) */}
                <div className="flex items-center gap-4">
                    <div className="bg-[#007bff] p-2 rounded-xl text-white">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                    </div>
                    {/* 🎫 Muestra el código de sala real aquí al lado del logo */}
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Código de reunión</span>
                        <span className="text-sm font-bold text-blue-300 tracking-wider font-mono uppercase">
                            {codigoSala || 'xxx-xxx'}
                        </span>
                    </div>
                </div>

                {/* Indicadores (Live + Temporizador) */}
                <div className="flex items-center gap-3">
                    <div className="bg-[#1e293b]/60 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE
                    </div>
                    <div className="bg-[#1e293b]/80 border border-gray-700 px-4 py-1.5 rounded-xl font-mono text-sm tracking-widest text-gray-300 min-w-22.5 text-center">
                        {formatTime(seconds)}
                    </div>
                </div>
            </header>

            {/* 🖥️ ÁREA CENTRAL DE VIDEOS */}
            <main className={`${style.video_main_content} flex-1 p-6 flex items-center justify-center relative`}>

                {/* Recuadro de Video Principal (Persona 1) */}
                <div className={`w-112.5 aspect-4/3 bg-[#2244a0] border border-blue-400/30 rounded-2xl flex items-center justify-center shadow-2xl relative ${style.video_content}`}>
                    {isCameraOff ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-blue-200 text-sm font-medium z-10">
                            Cámara desactivada
                        </div>
                    ) : null}

                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted // Muteamos nuestro propio video para no escuchar nuestro eco
                        className={`${style.video_call} w-full h-full object-cover`}
                    />
                    {/* Icono de Pantalla Completa arriba a la derecha */}
                    {
                    /*
                    <button className="absolute top-4 right-4 text-white/80 hover:text-white transition cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    </button>*/
                    }
                </div>

                {/* Miniatura de Video Secundaria abajo a la derecha (Persona 2) */}
                <div className={`absolute bottom-6 right-6 w-44 aspect-4/3 bg-[#0f1f44] border-2 border-blue-500/40 rounded-xl flex items-center justify-center shadow-xl video-content ${style.video_content}`}>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`${style.video_call} w-full h-full object-cover`}
                    />
                    <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${style.icon_svg}`}>
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7 0 3.75 3.75 0 017 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                </div>

                {/* 🎛️ PANEL DE CONTROLES INFERIOR */}
                <div className={`${style.call_control} absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#181818]/90 px-6 py-3 rounded-full flex items-center gap-5 backdrop-blur-md shadow-xl border border-gray-800`}>

                    {/* Botón Micrófono */}
                    <button
                        onClick={toggleMic} // 👈 ¡Cambiamos esto para que llame a la nueva función!
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-800 text-gray-300'
                            }`}
                    >
                        {isMuted ? (
                            <svg className="w-5 h-5" fill="#ffffff"  outline="none"  viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M5.7041396,5.70414456 L19.0710678,19.0710678 C19.4615921,19.4615921 19.4615921,20.0947571 19.0710678,20.4852814 C18.6805435,20.8758057 18.0473786,20.8758057 17.6568543,20.4852814 L16.063838,18.892419 C15.1449713,19.4353613 14.1081016,19.7997927 13.0009551,19.9379871 L13,21 C13,21.5522847 12.5522848,22 12,22 C11.4477153,22 11,21.5522847 11,21 L11.0000487,19.9381123 C7.05371357,19.4460359 4.00000002,16.0796344 4.00000002,12 C4.00000002,11.4477153 4.44771527,11 5.00000002,11 C5.55228477,11 6.00000002,11.4477153 6.00000002,12 C6.00000002,15.3137085 8.68629152,18 12,18 C12.9259358,18 13.8028836,17.7902576 14.5859245,17.4156917 L13.0348641,15.8648402 C12.7047768,15.9530016 12.3578769,16 12,16 C9.79086102,16 8.00000002,14.209139 8.00000002,12 L7.99993201,10.829 L4.29182523,7.12025233 C3.90130094,6.72972804 3.90130094,6.09656306 4.29182523,5.70603877 C4.68171709,5.31614691 5.3134644,5.3155155 5.7041396,5.70414456 Z M19,11 C19.5522848,11 20,11.4477153 20,12 C20,13.483507 19.5962013,14.8727017 18.8925188,16.0636691 L17.4155089,14.5863067 C17.7901893,13.803169 18,12.9260864 18,12 C18,11.4477153 18.4477153,11 19,11 Z M12,2 C14.209139,2 16,3.790861 16,6 L16,12 C16,12.3579355 15.9529862,12.7048904 15.8647969,13.0350263 L13.999932,11.171 L14,6 C14,4.8954305 13.1045695,4 12,4 C10.8954305,4 10,4.8954305 10,6 L9.99993201,7.171 L8.07145159,5.24342122 C8.4251078,3.39603916 10.0495227,2 12,2 Z"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3-3.75h6M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>

                    {/* Botón Cámara */}
                    <button
                        onClick={() => {
                            // El signo '?' evita que la app se rompa si getVideoTracks()[0] no existe
                            if (localStream && localStream.getVideoTracks()[0]) {
                                localStream.getVideoTracks()[0].enabled = isCameraOff;
                            }
                            setIsCameraOff(!isCameraOff);
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${isCameraOff ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-800 text-gray-300'
                            }`}
                    >
                        {isCameraOff ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9A2.25 2.25 0 014.5 6.75H12A2.25 2.25 0 0114.25 9v7.5A2.25 2.25 0 0112 18.75z" strokeDasharray="3 3" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        )}
                    </button>

                    {/* Botón Finalizar Llamada (Rojo Fijo con icono inclinado) */}
                    <button
                        onClick={handleSalir}
                        className="w-11 h-11 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-lg shadow-red-600/20"
                    >
                        <svg className="w-5 h-5 transform rotate-135deg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                    </button>

                </div>

            </main>

        </div>
    );
};

export default Meeting;