import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Custom plugin to copy manifest and icons to dist
const copyExtensionFiles = () => {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
      }

      // Copy manifest.json
      if (fs.existsSync('manifest.json')) {
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
      }

      // Copy icons if they exist
      ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
        if (fs.existsSync(icon)) {
          fs.copyFileSync(icon, `dist/${icon}`);
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Popup Page
        popup: resolve(__dirname, 'popup.html'),
        // Background Service Worker
        background: resolve(__dirname, 'background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});