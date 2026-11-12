import { defineConfig } from 'vite';

const rewriteApiPath = path => path
  .replace(/^\/api\/pokemon(?=\/|\?)/, '/pokemon')
  .replace(/^\/api\/species(?=\/|\?)/, '/pokemon-species')
  .replace(/^\/api\/evolution-chain(?=\/|\?)/, '/evolution-chain')
  .replace(/^\/api\/evolution(?=\/|\?)/, '/evolution-chain')
  .replace(/^\/api\/abilities(?=\/|\?)/, '/ability')
  .replace(/^\/api\/types(?=\/|\?)/, '/type');

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://pokeapi.co/api/v2',
        changeOrigin: true,
        rewrite: rewriteApiPath
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
