import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // Avoid full-page reloads when temp clones, build output, or tooling touch files.
      ignored: ["**/dist/**", "**/.tmp-*/**", "**/node_modules/**", "**/.git/**"],
    },
  },
});
