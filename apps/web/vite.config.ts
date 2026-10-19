import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const proxy = { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } };
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'canvas', test: /node_modules\/(?:@xyflow|d3-)/ },
            {
              name: 'motion',
              test: /node_modules\/(?:motion|motion-dom|motion-utils|framer-motion)\//,
            },
          ],
        },
      },
    },
  },
});
