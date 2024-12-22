import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: "IOT-client-v2",
  plugins: [vue()],
  resolve: {
    alias: [
      
    ]
  },
})
