import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://woodwork.tdshome.pt',
  output: 'server',
  adapter: cloudflare({
    mode: 'advanced',
    routes: {
      strategy: 'include',
      include: ['/*'],
    },
  }),
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      minify: true,
      assetsInlineLimit: 0,
    },
    ssr: {
      external: ['node:buffer', 'node:path', 'node:fs', 'node:os'],
      noExternal: ['sharp'],
    },
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
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
