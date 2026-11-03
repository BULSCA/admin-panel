import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

// The standalone portal shares the authoritative backend's session through this proxy.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const target = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000';

    return {
        plugins: [tailwindcss(), vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
            },
        },
        server: {
            host: '127.0.0.1',
            port: 5176,
            strictPort: true,
            proxy: Object.fromEntries(
                ['/api/', '/auth/sso', '/storage/', '/img/'].map((path) => [
                    path,
                    { target, changeOrigin: false },
                ]),
            ),
        },
    };
});
