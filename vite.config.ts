import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Build-time validation plugin
function validateEnvVars(): Plugin {
  return {
    name: 'validate-env-vars',
    buildStart() {
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_PUBLISHABLE_KEY'
      ];
      
      const missing = requiredVars.filter(v => !process.env[v]);
      
      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}\n` +
          `Please set these in Vercel Dashboard → Project Settings → Environment Variables\n` +
          `Required for: Production, Preview, and Development environments`
        );
      }
      
      // Validate URL format
      const url = process.env.VITE_SUPABASE_URL;
      if (url) {
        // Normalize URL for validation
        let normalizedUrl = url.trim().replace(/\/+$/, '');
        if (!normalizedUrl.startsWith('https://')) {
          if (normalizedUrl.startsWith('http://')) {
            normalizedUrl = normalizedUrl.replace('http://', 'https://');
          } else {
            normalizedUrl = `https://${normalizedUrl}`;
          }
        }
        
        // Validate format
        const supabasePattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
        if (!supabasePattern.test(normalizedUrl)) {
          throw new Error(
            `Invalid VITE_SUPABASE_URL format: ${url}\n` +
            `Expected format: https://[project-id].supabase.co\n` +
            `Example: https://ojtfnhzqhfsprebvpmvx.supabase.co\n` +
            `Note: URL will be normalized to: ${normalizedUrl}`
          );
        }
        
        // Warn if URL was normalized
        if (url !== normalizedUrl) {
          console.warn(`[build] VITE_SUPABASE_URL was normalized: "${url}" → "${normalizedUrl}"`);
        }
      }
      
      // Validate key length
      const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (key && key.length < 50) {
        console.warn(`[build] VITE_SUPABASE_PUBLISHABLE_KEY appears invalid (too short: ${key.length} chars)`);
      }
      
      console.log('[build] Environment variables validated successfully');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    validateEnvVars(), // Add build-time validation
    // Removed lovable-tagger - not needed for Vercel deployment
    // Only include in development if needed for local Lovable development
    ...(mode === 'development' && process.env.USE_LOVABLE_TAGGER === 'true' ? [] : []),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
  },
}));
