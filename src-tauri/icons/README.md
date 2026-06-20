# Iconos de la app

Esta carpeta debe contener los iconos referenciados en `tauri.conf.json`
(`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`).

Generalos con un solo PNG fuente (mínimo 1024×1024) cuando tengas Rust instalado:

```bash
npm run tauri icon ./logo.png
```

Esto crea automáticamente todos los tamaños para Windows, macOS, Linux,
Android e iOS. No se versionan binarios aquí hasta tener el logo final.
