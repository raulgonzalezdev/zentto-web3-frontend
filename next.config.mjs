/** @type {import('next').NextConfig} */

// Para empaquetar con Tauri se usa export estatico (output: 'export').
// En `next dev` el export se ignora, asi que el dev server funciona normal.
// Para generar el bundle de Tauri: TAURI_BUILD=1 npm run build  ->  carpeta ./out
const isTauriBuild = process.env.TAURI_BUILD === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isTauriBuild
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
