import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createRefineMantraMiddleware } from './src/server/refineMantraApi.js';
import { createTextToSpeechMiddleware } from './src/server/textToSpeechApi.js';
import { createWaitlistMiddleware } from './src/server/waitlistApi.js';

function mantraApiPlugin(env) {
  return {
    name: 'mantra-api',
    configureServer(server) {
      server.middlewares.use(createRefineMantraMiddleware(env));
      server.middlewares.use(createTextToSpeechMiddleware(env));
      server.middlewares.use(createWaitlistMiddleware(env));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/ai-mantra-generator/',
    plugins: [react(), mantraApiPlugin(env)],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          playground: 'playground.html',
          components: 'components.html',
          waitlist: 'waitlist.html',
        },
      },
    },
  };
});
