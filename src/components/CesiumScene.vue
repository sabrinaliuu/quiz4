<template>
  <section ref="containerRef" class="cesium-scene" aria-label="3D IoT device map"></section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { addDeviceEntity, createViewer } from '../core/cesiumViewer'

const props = defineProps({
  devices: { type: Array, required: true },
  selectedDeviceId: { type: String, default: '' }
})

const emit = defineEmits(['device-selected'])
const containerRef = ref(null)
let viewer
let clickHandler

onMounted(async () => {
  viewer = createViewer(containerRef.value)
  const entities = await Promise.all(props.devices.map((device) => addDeviceEntity(viewer, device)))

  if (entities.length) {
    viewer.zoomTo(entities, new Cesium.HeadingPitchRange(0, -0.65, 1400))
  }

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position)
    const entity = picked?.id
    const deviceId = entity?.properties?.deviceId?.getValue()
    const device = props.devices.find((item) => item.id === deviceId)
    if (device) emit('device-selected', device)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  window.addEventListener('iot-layer-change', handleLayerChange)
})

watch(
  () => props.selectedDeviceId,
  (deviceId) => {
    if (!viewer || !deviceId) return
    const entity = viewer.entities.getById(deviceId)
    if (entity) viewer.flyTo(entity, { duration: 0.8 })
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('iot-layer-change', handleLayerChange)
  clickHandler?.destroy()
  viewer?.destroy()
})

async function handleLayerChange(event) {
  if (!viewer) return
  const { id, enabled } = event.detail

  if (id === 'models') {
    viewer.entities.values.forEach((entity) => {
      if (entity.model) entity.show = enabled
    })
  }

  if (id === 'labels') {
    viewer.entities.values.forEach((entity) => {
      if (entity.label) entity.label.show = enabled
    })
  }

  if (id === 'terrain' && enabled) {
    try {
      viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
        requestVertexNormals: true
      })
    } catch (error) {
      console.warn('Unable to enable Cesium world terrain', error)
    }
  }

  if (id === 'terrain' && !enabled) {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  }
}
</script>

<style scoped>
.cesium-scene {
  position: absolute;
  inset: 0;
}
</style>
