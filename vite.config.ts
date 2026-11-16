import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

function levelsDataPlugin(): Plugin {
  const sourcePath = resolve(process.cwd(), "content/lang/english/levels.json");
  let outputPath = resolve(process.cwd(), "dist");

  return {
    name: "levels-data",
    configResolved(config) {
      outputPath = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use("/lang/english/levels.json", (_request, response, next) => {
        try {
          response.setHeader("Content-Type", "application/json");
          response.end(readFileSync(sourcePath));
        } catch (error) {
          next(error instanceof Error ? error : new Error("Could not read level data."));
        }
      });
    },
    closeBundle() {
      const targetPath = resolve(outputPath, "lang/english/levels.json");
      mkdirSync(resolve(outputPath, "lang/english"), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    },
    writeBundle() {
      const htmlPath = resolve(outputPath, "index.html");
      const html = readFileSync(htmlPath, "utf8");
      const standaloneHtml = html.replace(
        /<script\b(?=[^>]*\btype="module")[^>]*\bsrc="([^"]+)"[^>]*><\/script>/,
        (_tag, source) => `<script defer src="${source}"></script>`,
      );
      if (standaloneHtml === html) {
        throw new Error("Could not convert the production entry to a file-compatible script.");
      }
      writeFileSync(htmlPath, standaloneHtml);
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react(), levelsDataPlugin()],
  build: {
    sourcemap: false,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        format: "iife",
        name: "SpinTheWheels",
      },
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { pretendToBeVisual: true } },
    setupFiles: ["./src/test-setup.ts"],
  },
});
