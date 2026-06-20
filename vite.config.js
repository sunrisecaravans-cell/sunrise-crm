import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path: "/sunrise-crm/" when deployed to GitHub Pages,
// "/" for any other host (Vercel, Netlify, Cloudflare Pages, custom domain).
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
