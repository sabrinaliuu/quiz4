<template>
  <main class="app-shell">
    <CesiumViewer
      :models="cesiumModels"
      :selected-model-id="selectedDevice?.id"
      :layers="layerState"
      @sensor-selected="selectSensor"
      @model-click="selectModel"
      @camera-change="cameraHeading = $event.heading"
    />

    <section class="dashboard-overlay">
      <div class="panel-column left-panels">
        <CompassPanel :heading="cameraHeading" />
        <MiniMap :devices="devices" :selected-device="selectedDevice" @device-selected="selectDevice" />
      </div>

      <div class="panel-column right-panels">
        <LayerControlPanel :layers="layers" @layer-change="updateLayer" />
        <IotChartPanel :device="selectedDevice" source="csv" />
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import CesiumViewer from './components/CesiumViewer.vue'
import CompassPanel from './components/CompassPanel.vue'
import IotChartPanel from './components/IotChartPanel.vue'
import LayerControlPanel from './components/LayerControlPanel.vue'
import MiniMap from './components/MiniMap.vue'
import { devices } from './data/devices'
import { generateSensorSeries } from './data/iotDataGenerator'

const selectedDevice = ref(devices[0])
const cameraHeading = ref(0)
const layers = ref([
  { id: 'models', label: 'IoT models', enabled: true },
  { id: 'buildings', label: 'Buildings', enabled: false },
  { id: 'sensors', label: 'Sensors', enabled: true }
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
      type: device.type,
      sensor: device.sensor,
      value: getLatestSensorValue(device.id),
      unit: device.sensor.unit
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
  if (device) selectDevice(device)
}

function selectSensor(sensorId) {
  const device = devices.find((item) => item.id === sensorId)
  if (device) selectDevice(device)
}

function updateLayer(layer) {
  const target = layers.value.find((item) => item.id === layer.id)
  if (target) target.enabled = layer.enabled
}

function getLatestSensorValue(sensorId) {
  return generateSensorSeries(sensorId, { hours: 24 }).at(-1)?.value ?? 0
}
</script>
