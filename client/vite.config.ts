import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  define: {
    // We wrap values in JSON.stringify so the bundler gets a string 
    // containing the code to inject, rather than an undefined/object value.
    "process.env": JSON.stringify({}),
    "global": JSON.stringify("globalThis"),
    "Buffer": JSON.stringify("Buffer"), 
  },
  resolve: {
    alias: {
      "@": "/src",
      // This tells Vite to resolve the 'buffer' package when needed
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
})