# Cesium IoT Dashboard

<b>This is Codex-generated README.</b>

<b>For understanding how to generate this website by collaborating with Codex, please see <a href="./README_RECORD.md">README_RECORD</a>.</b>

<hr>

🔗 https://sabrinaliuu.github.io/quiz4/

Vue 3 + Vite project for displaying IoT devices as GLB/glTF models in a Cesium 3D scene with ECharts time-series sensor panels.


## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

For GitHub Actions, set `GITHUB_PAGES=true` during the build so Vite uses the repository name as the base path:

```bash
GITHUB_PAGES=true npm run build
```

Static assets live in `public/` and are copied to `dist/`.

## Models and data

- Put GLB/glTF files in `public/models/`.
- Put IoT data JSON files in `public/data/`.
- Edit `src/data/devices.js` to add devices and point each device at its model and data file.

The sample device uses `/models/sample-device/device.gltf`.
