import { defineConfig } from 'vite';

export default defineConfig({
  server:{
    host: true,
    allowedHosts: ["dev.front.vinais.ovh", "luxanimastudio.com", "cocon.luxanimastudio.com"]
  },
  build: {
    target: 'es2020',
  },
});
