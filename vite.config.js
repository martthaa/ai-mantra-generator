import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ai-mantra-generator/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        playground: 'playground.html',
        components: 'components.html',
      },
    },
  },
});
