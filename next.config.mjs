/** @type {import('next').NextConfig} */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Para empaquetar con Tauri se usa export estatico (output: 'export').
// En `next dev` el export se ignora, asi que el dev server funciona normal.
// Para generar el bundle de Tauri: TAURI_BUILD=1 npm run build  ->  carpeta ./out
const isTauriBuild = process.env.TAURI_BUILD === "1";

// `@zentto/vertical-layout` importa `next-auth/react` a nivel de modulo.
// Esta app NO usa next-auth (auth propia contra el backend Web3), y no se
// instala next-auth: se redirige el import a un shim local inerte.
// Turbopack necesita una ruta relativa POSIX (no acepta rutas absolutas Windows);
// webpack usa la ruta absoluta resuelta.
const nextAuthShimRel = "./src/lib/next-auth-react-shim.tsx";
const nextAuthShimAbs = path.resolve(__dirname, "src/lib/next-auth-react-shim.tsx");

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "next-auth/react": nextAuthShimRel,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "next-auth/react": nextAuthShimAbs,
    };
    return config;
  },
  ...(isTauriBuild
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
