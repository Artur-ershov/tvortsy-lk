import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // доступ с телефона по локальной сети
    // порт назначает превью-харнесс через PORT; иначе дефолт Vite (5173)
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
