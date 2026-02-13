import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    // Server configuration
    server: {
        port: 5173,
        strictPort: false,
    },

    // Build configuration - Optimized for production
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: process.env.VITE_ENV !== 'PRODUCTION', 
        chunkSizeWarningLimit: 1000,

        rollupOptions: {
            output: {
                // Intelligent code splitting
                manualChunks: {
                    // Vendor libraries
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'auth-vendor': ['@react-oauth/google', 'jwt-decode'],
                    'ui-vendor': ['lucide-react'],
                    'api-vendor': ['axios'],
                },

                // Asset naming for caching
                entryFileNames: 'js/[name].[hash].js',
                chunkFileNames: 'js/[name].[hash].js',
                assetFileNames: ({ name }) => {
                    if (/\.(gif|jpe?g|png|svg)$/.test(name)) {
                        return 'images/[name].[hash][extname]';
                    } else if (/\.css$/.test(name)) {
                        return 'css/[name].[hash][extname]';
                    }
                    return 'assets/[name].[hash][extname]';
                },
            },
        },

        cssCodeSplit: true,
        reportCompressedSize: true,

        terserOptions: {
            compress: {
                drop_console: process.env.VITE_ENV === 'PRODUCTION',
                drop_debugger: process.env.VITE_ENV === 'PRODUCTION',
            },
        },
    },

    // Path alias
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    // Dependency optimization
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@react-oauth/google',
            'axios',
            'jwt-decode',
            'lucide-react',
        ],
    },
});
