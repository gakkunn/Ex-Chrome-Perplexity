import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest/manifest.config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const isProdBuild = command === 'build' && mode === 'production';

  return {
    plugins: [preact(), crx({ manifest })],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
    base: '',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          inject: path.resolve(rootDir, 'src/inject/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'inject') {
              return 'src/inject/index.js';
            }
            return 'assets/[name]-[hash].js';
          },
        },
      },
    },
    esbuild: isProdBuild
      ? {
          // Drop console/debugger only for production builds
          drop: ['console', 'debugger'],
        }
      : undefined,
  };
});
