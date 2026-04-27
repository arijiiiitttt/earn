import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Buffer } from "buffer";
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],define: {
    "process.env": {},
    global: "globalThis",
    Buffer: Buffer,
  },
  resolve: {
    alias: {
      "@": "/src",
       buffer: "buffer",
    },
    optimizeDeps: {
    include: ["buffer"],
  },
  },
})
