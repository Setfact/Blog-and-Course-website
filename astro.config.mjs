// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import pagefind from "astro-pagefind";
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.KEYSTATIC_SECRET': 'process.env.KEYSTATIC_SECRET',
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID': 'process.env.KEYSTATIC_GITHUB_CLIENT_ID',
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET': 'process.env.KEYSTATIC_GITHUB_CLIENT_SECRET'
    }
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