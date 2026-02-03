import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://woodwork.tdshome.pt',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    mdx(),
    tailwind(),
  ],
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
