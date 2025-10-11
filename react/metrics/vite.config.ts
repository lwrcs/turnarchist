import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

const devSourceMaps = (mode: string) =>
  mode === "development"
    ? {
        build: {
          sourcemap: mode === "development",
        },
        esbuild: {
          sourcemap: mode === "development",
        },
      }
    : {};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 5174,
    host: true,
    proxy: {
      "^/(api)": "http://localhost:3000",
    },
  },
  ...devSourceMaps(mode),
}));
