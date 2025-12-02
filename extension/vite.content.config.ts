import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        outDir: 'dist',
        emptyOutDir: false, // Don't wipe the main build
        lib: {
            entry: resolve(__dirname, 'content.tsx'),
            name: 'ContentScript',
            fileName: () => 'content.js',
            formats: ['iife'], // Bundle as IIFE for Chrome Extension compatibility
        },
        rollupOptions: {
            output: {
                extend: true,
            },
        },
    },
});
