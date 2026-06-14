import React from 'react';

const AuthCard = ({ title, children, isLogin }) => {
    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#1a1a1a]">

            {/* Lado del Branding */}
            <div className="flex flex-col items-center justify-center bg-[#1a1a1a] p-10 w-full md:w-1/2">
                <div className="bg-[#3e73ff] p-6 rounded-full shadow-2xl mb-6">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            {/* Lado del Formulario */}
            <div className="flex flex-col items-center justify-center bg-white p-10 w-full md:w-1/2">
                <div className="w-full max-w-md flex flex-col">
                    <h2 className="text-4xl font-bold text-gray-800 text-center mb-8">{title}</h2>
                    {children}
                </div>
            </div>

        </div>
    );
};

export default AuthCard;