<template>
  <aside class="panel layer-panel">
    <p class="panel-title">Layers</p>
    <label v-for="layer in localLayers" :key="layer.id">
      <input
        type="checkbox"
        :checked="layer.enabled"
        @change="toggleLayer(layer, $event.target.checked)"
      />
      <span>{{ layer.label }}</span>
    </label>
  </aside>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  layers: { type: Array, required: true }
})

const emit = defineEmits(['layer-change'])
const localLayers = reactive([])

watch(
  () => props.layers,
  (layers) => {
    localLayers.splice(0, localLayers.length, ...layers.map((layer) => ({ ...layer })))
  },
  { immediate: true, deep: true }
)

function toggleLayer(layer, enabled) {
  layer.enabled = enabled
  emit('layer-change', { id: layer.id, enabled })
}
</script>

<style scoped>
.layer-panel {
  width: min(280px, 100%);
  padding: 14px;
}

label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  color: #dbe4e8;
  font-size: 13px;
}

input {
  accent-color: #55c3a5;
}
</style>
