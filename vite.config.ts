import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Manually set environment variables
  const env = {
    VITE_FIREBASE_API_KEY: 'AIzaSyBMUrnAPcXVwvqwCQLzhv2VJzgKAFDWiko',
    VITE_FIREBASE_AUTH_DOMAIN: 'ai-calorie-tracker-3cdc8.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'ai-calorie-tracker-3cdc8',
    VITE_FIREBASE_STORAGE_BUCKET: 'ai-calorie-tracker-3cdc8.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '118996352240',
    VITE_FIREBASE_APP_ID: '1:118996352240:web:7a2d7760d06930d7fe5635'
  };

  console.log('[Vite] Firebase Environment Variables:', {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID
  });

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@context": path.resolve(__dirname, "./src/context"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@lib": path.resolve(__dirname, "./src/lib"),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless'
      }
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID)
    }
  };
});
