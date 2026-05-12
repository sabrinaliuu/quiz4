<template>
  <aside class="panel compass-panel" aria-label="Compass">
    <p class="panel-title">Compass</p>
    <div class="compass-face">
      <div class="needle" :style="{ transform: `translateX(-50%) rotate(${heading}deg)` }"></div>
      <span>N</span>
    </div>
    <strong>{{ normalizedHeading }}°</strong>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  heading: { type: Number, default: 0 }
})

const normalizedHeading = computed(() => Math.round((props.heading + 360) % 360))
</script>

<style scoped>
.compass-panel {
  display: grid;
  gap: 10px;
  width: 150px;
  padding: 14px;
  justify-items: center;
}

.compass-face {
  position: relative;
  width: 74px;
  height: 74px;
  border: 2px solid rgb(255 255 255 / 24%);
  border-radius: 50%;
  background: rgb(255 255 255 / 5%);
}

.needle {
  position: absolute;
  top: 9px;
  left: 50%;
  width: 3px;
  height: 28px;
  border-radius: 999px;
  background: #ee6b5f;
  transform-origin: 50% 28px;
}

span {
  position: absolute;
  top: 6px;
  left: 50%;
  color: #f8fafb;
  font-size: 12px;
  font-weight: 800;
  transform: translateX(-50%);
}

strong {
  color: #55c3a5;
  font-size: 18px;
}
</style>
