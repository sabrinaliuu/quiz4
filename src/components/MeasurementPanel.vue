<template>
  <aside class="panel measurement-panel">
    <p class="panel-title">Measure</p>
    <div class="measure-actions">
      <button type="button" :class="{ active: activeTool === 'distance' }" @click="$emit('tool-change', 'distance')">
        Distance
      </button>
      <button type="button" :class="{ active: activeTool === 'area' }" @click="$emit('tool-change', 'area')">
        Area
      </button>
    </div>
    <span>{{ resultText }}</span>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTool: { type: String, default: '' },
  measurement: { type: Object, default: null }
})

defineEmits(['tool-change'])

const resultText = computed(() => {
  if (!props.activeTool) return 'Select a tool, then click the map.'
  if (!props.measurement?.value) return 'Click two or more points.'
  if (props.measurement.type === 'area') return `Area ${props.measurement.value.toFixed(2)} sq km`
  return `Distance ${props.measurement.value.toFixed(2)} km`
})
</script>

<style scoped>
.measurement-panel {
  width: min(280px, 100%);
  padding: 14px;
}

.measure-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

button {
  flex: 1;
  min-height: 32px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 6px;
  color: #dbe4e8;
  background: rgb(255 255 255 / 7%);
  cursor: pointer;
}

button.active {
  color: #f8fafb;
  background: rgb(85 195 165 / 24%);
}

span {
  color: #b9c2c7;
  font-size: 12px;
}
</style>
