<template>
  <aside class="panel coordinate-panel">
    <span>Lon {{ format(coordinate?.longitude) }}</span>
    <span>Lat {{ format(coordinate?.latitude) }}</span>
    <span>H {{ format(coordinate?.height, 1) }} m</span>
  </aside>
</template>

<script setup>
defineProps({
  coordinate: { type: Object, default: null }
})

function format(value, digits = 5) {
  return Number.isFinite(value) ? value.toFixed(digits) : '--'
}
</script>

<style scoped>
.coordinate-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  color: #dbe4e8;
  font-size: 12px;
  pointer-events: auto;
}
</style>
