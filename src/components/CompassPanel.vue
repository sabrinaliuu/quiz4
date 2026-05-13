<template>
  <aside class="panel compass-panel" aria-label="Compass">
    <p class="panel-title">Compass</p>
    <button class="compass-face" type="button" title="Reset north" @click="$emit('reset-north')">
      <div class="needle" :style="{ transform: `translateX(-50%) rotate(${heading}deg)` }"></div>
      <span>N</span>
    </button>
    <strong>{{ normalizedHeading }} deg</strong>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  heading: { type: Number, default: 0 }
})

defineEmits(['reset-north'])

const normalizedHeading = computed(() => Math.round((props.heading + 360) % 360))
</script>

<style scoped>
.compass-panel {
  display: grid;
  gap: 8px;
  padding: 14px;
  justify-items: center;
}

.compass-face {
  position: relative;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 2px solid rgb(255 255 255 / 24%);
  border-radius: 50%;
  background: rgb(255 255 255 / 5%);
  cursor: pointer;
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
  font-size: 14px;
}
</style>
