<template>
  <aside class="panel minimap-panel">
    <p class="panel-title">Mini Map</p>
    <div ref="mapRef" class="leaflet-map"></div>
  </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  devices: { type: Array, required: true },
  selectedDevice: { type: Object, default: null }
})

const emit = defineEmits(['device-selected'])
const mapRef = ref(null)
const markers = new Map()
let map
let markerLayer

onMounted(() => {
  const center = getCenter()
  map = L.map(mapRef.value, {
    attributionControl: false,
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: false
  }).setView(center, 15)

  L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
      maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3']
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  renderMarkers()
})

watch(
  () => [props.devices, props.selectedDevice?.id],
  () => renderMarkers(),
  { deep: true }
)

onBeforeUnmount(() => {
  map?.remove()
  markers.clear()
})

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  markers.clear()

  props.devices.forEach((device) => {
    const marker = L.circleMarker([device.position.latitude, device.position.longitude], {
      radius: props.selectedDevice?.id === device.id ? 8 : 6,
      color: '#f8fafb',
      weight: 2,
      fillColor: props.selectedDevice?.id === device.id ? '#ee6b5f' : '#55c3a5',
      fillOpacity: 1
    })
      .bindTooltip(device.name, { direction: 'top' })
      .on('click', () => emit('device-selected', device))
      .addTo(markerLayer)

    markers.set(device.id, marker)
  })

  if (props.devices.length) {
    map.fitBounds(
      props.devices.map((device) => [device.position.latitude, device.position.longitude]),
      { padding: [22, 22], maxZoom: 16 }
    )
  }
}

function getCenter() {
  if (!props.devices.length) return [25.033, 121.5654]
  const latitude = props.devices.reduce((total, device) => total + device.position.latitude, 0) / props.devices.length
  const longitude =
    props.devices.reduce((total, device) => total + device.position.longitude, 0) / props.devices.length
  return [latitude, longitude]
}
</script>

<style scoped>
.minimap-panel {
  width: min(280px, 100%);
  padding: 14px;
}

.leaflet-map {
  height: 180px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  background: #172125;
}
</style>
