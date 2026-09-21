import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Un seul fichier de configuration pour Vite (dev, build) et Vitest (tests).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
