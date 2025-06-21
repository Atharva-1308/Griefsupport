import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    https: {
      key: fs.existsSync(path.resolve(__dirname, 'certs/key.pem')) 
        ? fs.readFileSync(path.resolve(__dirname, 'certs/key.pem'))
        : undefined,
      cert: fs.existsSync(path.resolve(__dirname, 'certs/cert.pem'))
        ? fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem'))
        : undefined,
    },
    host: '0.0.0.0',
    port: 5173,
  },
});