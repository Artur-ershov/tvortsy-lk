import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Доступ с телефона по локальной сети
  server: { host: true },
})
