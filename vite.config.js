import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 🛡️ Esta regla le dice a Vite: "Confía en cualquier subdominio de Localtunnel y Ngrok"
    allowedHosts: ['.loca.lt', '.ngrok-free.dev', '.ngrok-free.app'],
    headers: {
      // 🛡️ Esto le avisa a Localtunnel que es una petición segura y autorizada
      'Bypass-Tunnel-Reminder': 'true',
    },
  },
})
