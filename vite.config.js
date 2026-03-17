import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Image proxy plugin - proxies external images to bypass CORS for PDF generation
function imageProxyPlugin() {
    return {
        name: 'image-proxy',
        configureServer(server) {
            server.middlewares.use('/__image_proxy', async (req, res) => {
                try {
                    const url = new URL(req.url, 'http://localhost');
                    const imageUrl = url.searchParams.get('url');
                    if (!imageUrl) {
                        res.statusCode = 400;
                        res.end('Missing url parameter');
                        return;
                    }

                    const response = await fetch(imageUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                            'Accept': 'image/*,*/*',
                        }
                    });

                    if (!response.ok) {
                        res.statusCode = response.status;
                        res.end(`Failed to fetch image: ${response.statusText}`);
                        return;
                    }

                    const buffer = Buffer.from(await response.arrayBuffer());
                    const contentType = response.headers.get('content-type') || 'image/jpeg';

                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.end(buffer);
                } catch (err) {
                    console.error('Image proxy error:', err.message);
                    res.statusCode = 500;
                    res.end('Failed to proxy image');
                }
            });
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), imageProxyPlugin()],

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
