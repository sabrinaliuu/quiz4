# Quiz 4

使用以下AI工具協助完成此專案
* ChatGPT
* Codex CLI: gpt-5.5-low, gpt-5.4-mini medium

## Step 1
請ChatGPT先規劃專案以及撰寫給Codex的Prompt

* Prompt to ChatGPT
```
請幫我規劃以下專案，幫我寫一套Codex專用prompt: 
- 可以讀取glb 3d. 文件。
- 可以顯示指南針、google小地圖、等相關畫面panel 可以自行設計。越多越加分
- 點擊某一個3d 物件 可以show 出他的IOT數據 。 
- 數據以折線圖方式 x為時間，Ｙ為數值。（數據可以是任意產生或是讀取CSV 或是任何網路上的open data)
- 可以部署到github
```

## Step 2
把ChatGPT的Response依序請Codex CLI執行

1. 第一個 Prompt（生成整個專案架構）
```
Create a web project with the following requirements.

Tech stack:
- Vue 3
- Vite
- Cesium for 3D visualization
- ECharts for time-series charts

Project features:
1. Load and display GLB / glTF 3D models in a Cesium scene.
2. Each model represents an IoT device.
3. When clicking a 3D model, display IoT sensor data.
4. IoT data should be shown as a line chart.
5. X-axis = time
6. Y-axis = sensor value.

UI Panels:
- Compass
- Mini map
- Layer control panel
- IoT data chart panel

Project structure should include:

src/
components/
core/
data/
public/models/
public/data/

Prepare the project to be deployed to GitHub Pages.

Generate all necessary files.
```

2. 第二個 Prompt（3D GLB 載入）
```
Implement a Cesium viewer component.

Requirements:
- Initialize Cesium viewer
- Load glb models from /public/models
- Place models using longitude, latitude, height
- Allow multiple models
- Each model should have an id and metadata

Example models:
sensor1.glb
sensor2.glb

Create a reusable component called CesiumViewer.vue.
```

3. 第三個 Prompt（點擊 3D 物件）
```
Add click interaction to the Cesium viewer.

When a user clicks a glb model:
- Identify which model was clicked
- Retrieve the sensor id
- Emit an event with the sensor id

Example:

click model -> sensor_id -> show IoT data
```

4. 第四個 Prompt（IoT 折線圖）
```
Create an IoTChart component using ECharts.

Requirements:
- Line chart
- X-axis = time
- Y-axis = value

Data sources:
1. Random generated data
2. CSV file from /public/data/iot.csv

The chart should update when a sensor id is selected.
```

5. 第五個 Prompt（UI Panels）
```
Create a dashboard layout for the app.

Panels required:

1. Compass panel
Display the camera heading.

2. Mini map panel
Use Leaflet to show a small map.

3. Layer control panel
Allow toggling:
- IoT models
- Buildings
- Sensors

4. IoT data panel
Display the ECharts time-series chart.

Design a responsive layout with panels around the 3D scene.
```

6. 第六個 Prompt（假 IoT 數據）
```
Create a fake IoT data generator.

For each sensor:
generate time-series data for 24 hours.

Example:

time,value
00:00,20
01:00,22
02:00,19

Return data as JSON for chart visualization.
```

7. 第七個 Prompt（加分功能）
```
Add visual enhancements:

1. Highlight model when hovered.
2. Show popup with sensor information.
3. Animate sensor status color depending on value.
4. Add play/pause time animation for IoT data.
```

8. 第八個 Prompt（GitHub deploy）
```
Prepare the project for GitHub Pages deployment.

Requirements:

- Build with Vite
- Output to /dist
- Configure base path
- Add GitHub Actions workflow to deploy automatically

Generate:

.github/workflows/deploy.yml
```

## Step 3
* Debug 1: 請Codex檢查生成完的結果
```
Explain this repository structure.
Find bugs in the Cesium viewer component.
Refactor the Cesium code to improve performance.
```

* Debug 2: 執行完Debug 1後，發現專案無法執行 -> 複製console error 給ChatGPT -> 生成給Codex的Prompt (如下)

```
The Cesium viewer fails to load in a Vite project.

Error:

Unexpected token '<', "<!doctype"... is not valid JSON
Failed to load module script:
non-JavaScript MIME type "text/html"

Paths failing:
/cesium/Workers/createVerticesFromHeightmap.js
/cesium/Workers/transferTypedArrayTest.js

This usually happens when Cesium static assets are not copied correctly.

Please fix the Vite configuration so that Cesium Workers, Assets,
ThirdParty, and Widgets are served correctly.

Update vite.config.js accordingly.
```

## Step 4
新增其他附加功能
* Add terrain layer
```
Add a DEM terrain layer to the Cesium viewer in this Vue + Vite project.

Requirements:

1. Enable terrain in the Cesium viewer.
2. Use CesiumWorldTerrain as the default terrain provider.
3. Enable terrain lighting and depth testing against terrain.
4. Ensure 3D models (glb) correctly follow the terrain height.

Implementation details:

- Modify CesiumViewer.vue
- When initializing the viewer, add a terrain provider.

Example:

viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: await Cesium.createWorldTerrainAsync(),
})

viewer.scene.globe.enableLighting = true
viewer.scene.globe.depthTestAgainstTerrain = true

5. When loading glb models, ensure they are clamped to terrain height
using Cesium.HeightReference.RELATIVE_TO_GROUND or CLAMP_TO_GROUND.

6. Add a UI toggle in the layer control panel:

Terrain ON/OFF

When OFF:
viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()

When ON:
viewer.terrainProvider = Cesium.createWorldTerrain()

7. Ensure the solution works both in dev mode and after build.

Modify the existing Cesium viewer component accordingly.
```

* Add more tools for map
```
Enhance the existing 3D IoT WebGIS application by adding common navigation
and visualization helper tools used in professional WebGIS systems.

Tech stack:
Vue 3 + Vite + Cesium + ECharts

Add the following UI tools and interaction features.

1. Compass
Display a compass showing the camera heading.
Allow clicking the compass to reset the camera orientation to north.

2. Navigation controls
Add zoom in, zoom out, and reset camera buttons.

3. Home button
Return the camera to the default location.


5. Layer control panel
Allow toggling layers on/off:
- terrain
- 3D models
- IoT sensors
- buildings

6. Coordinate display
Show the mouse cursor geographic coordinates
(longitude, latitude, height).

7. Distance measurement tool
Allow users to click two or more points to measure distance.

8. Area measurement tool
Allow users to draw a polygon and calculate area.

9. Model highlight interaction
When the user hovers over a 3D IoT model:
- highlight the model
- show a tooltip with sensor ID.

10. Model click interaction
When clicking a model:
- open the IoT chart panel
- display the 24-hour sensor data.

11. Camera information panel
Display:
- camera longitude
- camera latitude
- camera height
- heading and pitch.

12. Terrain control
Add controls for:
- enable/disable terrain
- terrain exaggeration slider.

Organize these tools into UI panels around the 3D viewer.

Suggested layout:
- left panel: layer controls
- bottom panel: IoT chart
- top-right: compass
- bottom-left: coordinate display

Ensure the features work smoothly with the Cesium viewer component.
```

## Step 5
人工Debug、修改排版與功能、調整數據、刪除重覆程式碼等

## Notes
* 把複雜任務分割為多個小任務給Codex執行效果較好
* Prompt 結構建議
  * Goal: 一句話說明任務目標
  * Context: 詳細說明， 如: Requirements, Tools, Details, Example, Data source等
  * Constraints: 必須遵守的規則與限制，如: Return..., Do not use XX tool, Do not/Only modify XX file
  * Completion: 說明完成任務條件

## References
* https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide#recommended-starter-prompt
* https://developers.openai.com/codex/workflows
