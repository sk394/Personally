import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
// import neon from './neon-vite-plugin.ts' // Disabled - using existing database

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      netlify(),
      // neon, // Disabled - using existing database
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
    resolve: {
      alias: {
        path: 'path-browserify',
      },
    },
    optimizeDeps: {
      exclude: ['@tanstack/react-form'],
    },
    ssr: {
      noExternal: ['better-auth'],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      globals: true,
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY),
      'process.env.BETTER_AUTH_SECRET': JSON.stringify(env.BETTER_AUTH_SECRET),
      'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
    },
  }
})

