import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

function levelsDataPlugin(): Plugin {
  const sourcePath = resolve(process.cwd(), "content/lang/english/levels.json");
  const audioPath = resolve(process.cwd(), "content/lang/english/audios");
  const imagesPath = resolve(process.cwd(), "content/assets/images");
  const fontLicensePath = resolve(process.cwd(), "content/assets/fonts/OFL-Lexend.txt");
  const licensesPath = resolve(process.cwd(), "content/licenses.json");
  let outputPath = resolve(process.cwd(), "dist");

  return {
    name: "levels-data",
    configResolved(config) {
      outputPath = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use("/assets/images", (request, response, next) => {
        const pathname = (request.url ?? "").split("?")[0];
        if (!/^\/[a-z]+\.(?:svg|jpg)$/.test(pathname)) {
          next();
          return;
        }
        try {
          const image = readFileSync(resolve(imagesPath, `.${pathname}`));
          response.setHeader("Content-Type", pathname.endsWith(".svg") ? "image/svg+xml" : "image/jpeg");
          response.end(image);
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            response.statusCode = 404;
            response.end("Image not found.");
            return;
          }
          next(error instanceof Error ? error : new Error("Could not read image asset."));
        }
      });
      server.middlewares.use("/lang/english/audios", (request, response, next) => {
        const pathname = (request.url ?? "").split("?")[0];
        if (!/^\/(?:[a-z0-9-]+|words\/[a-z]+)\.mp3$/.test(pathname)) {
          next();
          return;
        }
        try {
          response.setHeader("Content-Type", "audio/mpeg");
          response.end(readFileSync(resolve(audioPath, `.${pathname}`)));
        } catch (error) {
          next(error instanceof Error ? error : new Error("Could not read audio asset."));
        }
      });
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
      cpSync(audioPath, resolve(outputPath, "lang/english/audios"), { recursive: true });
      cpSync(imagesPath, resolve(outputPath, "assets/images"), { recursive: true });
      mkdirSync(resolve(outputPath, "assets/fonts"), { recursive: true });
      copyFileSync(fontLicensePath, resolve(outputPath, "assets/fonts/OFL-Lexend.txt"));
      mkdirSync(resolve(outputPath, "content"), { recursive: true });
      copyFileSync(licensesPath, resolve(outputPath, "content/licenses.json"));
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
        assetFileNames(asset) {
          return asset.names.includes("lexend-v26-latin-regular.woff2")
            ? "assets/fonts/[name][extname]"
            : "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { pretendToBeVisual: true } },
    setupFiles: ["./src/test-setup.ts"],
  },
});
