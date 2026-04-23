import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// ---- custom plugins ----
// Fix for "use client" sourcemap errors in shadcn components
function removeUseClient() {
  return {
    name: 'remove-use-client',
    transform(code: string, id: string) {
      if (id.endsWith('.tsx') || id.endsWith('.ts')) {
        return {
          code: code.replace(/['"]use client['"];\s*/g, ''),
          map: null // Resets the map for this transformation to avoid mismatch
        };
      }
    },
  };
}

// ---- basic ports & paths ----
const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH ?? "/";

// ---- build plugin list ----
// Added removeUseClient() to the plugin chain
const plugins = [removeUseClient(), react(), tailwindcss(), runtimeErrorOverlay()];

// Replit‑only dev helpers (ignored on Vercel)
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
  try {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    plugins.push(
      cartographer({
        root: path.resolve(process.cwd(), ".."),
      })
    );
    plugins.push(devBanner());
  } catch {
    console.warn("Optional Replit plugins not loaded.");
  }
}

// ---- final config ----
export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY": JSON.stringify(
    process.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
  ),
  "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
    process.env.VITE_CLERK_PUBLISHABLE_KEY || ""
    ),
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@assets": path.resolve(process.cwd(), "../attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(process.cwd()),
  build: {
    // Vercel expects static output directly under /dist
    outDir: "dist/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Suppress noisy warnings about module-level directives
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom","wouter", "@clerk/react"], 
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true, deny: ["**/.*"] },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
