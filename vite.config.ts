import path from "path";
import fs from "fs";

import { defineConfig } from "vite";

const pkg = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"));
  } catch (err) {
    return null;
  }
})();

const config = defineConfig(({ mode }) => {
  return {
    base: "/",
    server: {
      host: "127.0.0.1",
    },
    resolve: {
      alias: {
        "@timeless/timeless-dom": path.resolve(__dirname, "vendor/timeless/dom.js"),
        "@timeless/shadcn/globals.css": path.resolve(__dirname, "vendor/timeless/shadcn.css"),
        "@timeless/shadcn": path.resolve(__dirname, "vendor/timeless/shadcn.js"),
        "@timeless/timeless": path.resolve(__dirname, "vendor/timeless/index.js"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["@timeless/timeless", "@timeless/timeless-dom", "@timeless/shadcn"],
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    define: {
      "process.global.__VERSION__": JSON.stringify(pkg ? pkg.version : "unknown"),
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks(filepath) {
            // if (filepath.includes("hls.js")) {
            //   return "hls";
            // }
            if (filepath.includes("node_modules") && !filepath.includes("hls")) {
              return "vendor";
            }
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
      threads: false,
    },
  };
});

export default config;
