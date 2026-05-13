<template>
  <main class="app-shell">
    <CesiumViewer
      :models="cesiumModels"
      :selected-model-id="selectedDevice?.id"
      :layers="layerState"
      :active-tool="activeTool"
      :command="viewerCommand"
      @sensor-selected="selectSensor"
      @model-click="selectModel"
      @camera-change="updateCamera"
      @coordinate-change="cursorCoordinate = $event"
      @measurement-change="measurement = $event"
    />

    <section class="dashboard-overlay">
      <div class="panel-column left-panels">
        <LayerControlPanel :layers="layers" @layer-change="updateLayer" />
        <MeasurementPanel
          :active-tool="activeTool"
          :measurement="measurement"
          @tool-change="setActiveTool"
        />
        <NavigationPanel @command="sendViewerCommand" />
        <MiniMap :devices="devices" :selected-device="selectedDevice" @device-selected="selectDevice" />
      </div>

      <div class="panel-column right-panels">
        <CameraInfoPanel :camera="cameraInfo" />
        <CompassPanel :heading="cameraHeading" @reset-north="sendViewerCommand('north')" />
      </div>

      <CoordinateDisplay :coordinate="cursorCoordinate" />
      <IotChartPanel v-if="isChartOpen" :device="selectedDevice" />
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import CesiumViewer from './components/CesiumViewer.vue'
import CompassPanel from './components/CompassPanel.vue'
import IotChartPanel from './components/IotChartPanel.vue'
import LayerControlPanel from './components/LayerControlPanel.vue'
import CameraInfoPanel from './components/CameraInfoPanel.vue'
import CoordinateDisplay from './components/CoordinateDisplay.vue'
import MeasurementPanel from './components/MeasurementPanel.vue'
import MiniMap from './components/MiniMap.vue'
import NavigationPanel from './components/NavigationPanel.vue'
import { devices } from './data/devices'
import { generateSensorSeries } from './data/iotDataGenerator'

const selectedDevice = ref(devices[0])
const cameraHeading = ref(0)
const cameraInfo = ref({})
const cursorCoordinate = ref(null)
const activeTool = ref('')
const measurement = ref(null)
const viewerCommand = ref(null)
const isChartOpen = ref(true)
const layers = ref([
  { id: 'models', label: 'IoT models', enabled: true },
  { id: 'buildings', label: 'Buildings', enabled: false },
  { id: 'sensors', label: 'Sensors', enabled: true },
  { id: 'terrain', label: 'Terrain', enabled: true }
])

const cesiumModels = computed(() =>
  devices.map((device) => ({
    id: device.id,
    sensor_id: device.id,
    url: device.modelUrl,
    longitude: device.position.longitude,
    latitude: device.position.latitude,
    height: device.position.height,
    statusValue: getLatestSensorValue(device.id),
    metadata: {
      name: device.name,
      value: getLatestSensorValue(device.id)
    }
  }))
)

const layerState = computed(() =>
  Object.fromEntries(layers.value.map((layer) => [layer.id, layer.enabled]))
)

function selectDevice(device) {
  selectedDevice.value = device
}

function selectModel(selection) {
  const device = devices.find((item) => item.id === selection.sensor_id)
  if (device) {
    selectDevice(device)
    isChartOpen.value = true
  }
}

function selectSensor(sensorId) {
  const device = devices.find((item) => item.id === sensorId)
  if (device) {
    selectDevice(device)
    isChartOpen.value = true
  }
}

function updateLayer(layer) {
  const target = layers.value.find((item) => item.id === layer.id)
  if (target) target.enabled = layer.enabled
}

function getLatestSensorValue(sensorId) {
  return generateSensorSeries(sensorId, { hours: 24 }).at(-1)?.value ?? 0
}

function updateCamera(camera) {
  cameraHeading.value = camera.heading
  cameraInfo.value = camera
}

function sendViewerCommand(type) {
  viewerCommand.value = { type, id: Date.now() }
}

function setActiveTool(tool) {
  activeTool.value = activeTool.value === tool ? '' : tool
  measurement.value = null
}
</script>
