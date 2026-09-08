// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import pagefind from "astro-pagefind";
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://phinisilearn.web.id',
  output: 'server',
  devToolbar: {
    enabled: false
  },
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        'phinisilearn.web.id',
        'www.phinisilearn.web.id',
        'phinisinetwork.calvinumboh.my.id',
      ],
    },
    optimizeDeps: {
      include: [
        '@keystatic/core',
        '@keystatic/astro',
        '@keystatic/core/ui',
        '@keystatic/astro/ui',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
    ssr: {
      noExternal: ['@keystatic/astro', '@keystatic/core'],
    },
  },

  i18n: {
    defaultLocale: "id",
    locales: ["id", "en"],
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [react(), mdx(), pagefind(), keystatic()]
});