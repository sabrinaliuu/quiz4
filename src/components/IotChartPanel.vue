<template>
  <aside class="panel chart-panel">
    <div class="chart-header">
      <div>
        <p class="panel-title">IoT Data</p>
        <h1>{{ device?.name ?? 'No device selected' }}</h1>
        <span>{{ device?.sensor.name }} · {{ device?.type }}</span>
      </div>
      <strong>{{ latestValue }}</strong>
    </div>
    <IoTChart
      class="chart"
      :sensor-id="device?.id"
      :source="source"
      :series-name="device?.sensor.name ?? 'Sensor value'"
      :y-axis-name="device?.sensor.unit ?? 'value'"
      @data-change="updateVisibleSeries"
    />
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import IoTChart from './IoTChart.vue'

const props = defineProps({
  device: { type: Object, default: null },
  source: { type: String, default: 'csv' }
})

const visibleSeries = ref([])

const latestValue = computed(() => {
  const latest = visibleSeries.value.at(-1)
  if (!latest || !props.device) return '--'
  return `${latest.value} ${props.device.sensor.unit}`
})

function updateVisibleSeries(data) {
  visibleSeries.value = data
}
</script>

<style scoped>
.chart-panel {
  width: min(520px, 100%);
  height: 310px;
  padding: 16px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 70px;
}

h1 {
  margin: 0 0 4px;
  font-size: 18px;
  line-height: 1.2;
}

span {
  color: #b9c2c7;
  font-size: 12px;
}

strong {
  color: #55c3a5;
  font-size: 18px;
  white-space: nowrap;
}

.chart {
  width: 100%;
  height: 205px;
}
</style>
