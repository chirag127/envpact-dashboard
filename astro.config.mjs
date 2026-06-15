import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://envpact.oriz.in',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      target: 'es2022',
    },
  },
});
