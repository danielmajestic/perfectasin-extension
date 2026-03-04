import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import type { OutputChunk, OutputAsset } from 'rollup';

/**
 * Copies manifest.json (optionally patching CSP) and icons/ to dist/ after every build.
 * @param devApiUrl - When set (development mode only), injected into manifest CSP connect-src.
 */
function copyExtensionFiles(devApiUrl: string) {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const root = resolve(__dirname);

      // Read source manifest and optionally patch CSP for dev builds
      const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf-8'));
      if (devApiUrl) {
        const csp: string = manifest.content_security_policy?.extension_pages ?? '';
        if (!csp.includes(devApiUrl)) {
          manifest.content_security_policy.extension_pages = `${csp.trimEnd()} ${devApiUrl}`;
        }
      }
      writeFileSync(resolve(root, 'dist/manifest.json'), JSON.stringify(manifest, null, 2));

      // Copy icons/ → dist/icons/
      const srcIcons = resolve(root, 'icons');
      const distIcons = resolve(root, 'dist/icons');
      mkdirSync(distIcons, { recursive: true });
      readdirSync(srcIcons).forEach((file) => {
        if (!file.startsWith('.')) {
          copyFileSync(resolve(srcIcons, file), resolve(distIcons, file));
        }
      });
    },
  };
}

/**
 * Wraps content/content.js in an IIFE after bundling.
 * Content scripts run in non-module mode (no "type":"module" in manifest),
 * so top-level const/let collide on re-injection. Using generateBundle (runs
 * after minification) guarantees the bundler — not manual source code — owns
 * the IIFE boundary.
 */
function wrapContentScriptIife() {
  return {
    name: 'wrap-content-script-iife',
    generateBundle(
      _options: unknown,
      bundle: Record<string, OutputChunk | OutputAsset>
    ) {
      const chunk = bundle['content/content.js'] as OutputChunk | undefined;
      if (chunk?.type === 'chunk') {
        chunk.code = `;(function(){\n${chunk.code}\n})();\n`;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env.local (always) and .env.[mode] files
  const env = loadEnv(mode, process.cwd(), '');

  // Only inject Tailscale/custom API URL into dev builds
  const devApiUrl = mode === 'development' ? (env.VITE_API_URL ?? '') : '';

  return {
    plugins: [react(), copyExtensionFiles(devApiUrl), wrapContentScriptIife()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup/index.html'),
          sidepanel: resolve(__dirname, 'sidepanel/index.html'),
          content: resolve(__dirname, 'content/content.ts'),
          background: resolve(__dirname, 'background/background.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'content') return 'content/[name].js';
            if (chunkInfo.name === 'background') return 'background/[name].js';
            if (chunkInfo.name === 'sidepanel') return 'sidepanel/[name].js';
            return 'popup/[name].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'index.css') {
              const referrer = assetInfo.names?.[0] || '';
              if (referrer.includes('sidepanel')) return 'sidepanel/[name][extname]';
              return 'popup/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
  };
});
