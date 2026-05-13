<template>
  <aside class="panel camera-panel">
    <p class="panel-title">Camera</p>
    <dl>
      <div><dt>Lon</dt><dd>{{ format(camera.longitude) }}</dd></div>
      <div><dt>Lat</dt><dd>{{ format(camera.latitude) }}</dd></div>
      <div><dt>Height</dt><dd>{{ format(camera.height, 0) }} m</dd></div>
      <div><dt>Heading</dt><dd>{{ format(camera.heading, 0) }} deg</dd></div>
      <div><dt>Pitch</dt><dd>{{ format(camera.pitch, 0) }} deg</dd></div>
    </dl>
  </aside>
</template>

<script setup>
defineProps({
  camera: { type: Object, default: () => ({}) }
})

function format(value, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : '--'
}
</script>

<style scoped>
.camera-panel {
  width: 140px;
  padding: 14px;
}

dl {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 12px;
}

div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

dt {
  color: #b9c2c7;
}

dd {
  margin: 0;
  color: #f8fafb;
}
</style>
