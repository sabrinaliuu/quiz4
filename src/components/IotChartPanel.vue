<template>
  <aside class="panel chart-panel">
    <div class="chart-header">
        <h1>{{ device?.name ?? 'No device selected' }}</h1>
    </div>
    <div class="metric-strip">
      <span v-for="metric in metricValues" :key="metric.key">
        <b :style="{ color: metric.color }">{{ metric.label }}</b>
        {{ metric.value }}
      </span>
    </div>
    <IoTChart
      class="chart"
      :sensor-id="device?.id"
      @data-change="updateVisibleSeries"
    />
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import IoTChart from './IoTChart.vue'

const props = defineProps({
  device: { type: Object, default: null }
})

const visiblePoint = ref(null)

const metricMeta = [
  { key: 'temperature', label: 'Temp', color: '#55c3a5', unit: 'C' },
  { key: 'energy', label: 'Energy', color: '#f0c85a', unit: 'kW' },
  { key: 'windSpeed', label: 'Wind', color: '#7aa2ff', unit: 'm/s' },
  { key: 'pressure', label: 'Pressure', color: '#ee6b5f', unit: 'hPa' },
  { key: 'aqi', label: 'AQI', color: '#c47dff', unit: '' }
]

const metricValues = computed(() => {
  if (!visiblePoint.value) return []

  return metricMeta.map((metric) => ({
    ...metric,
    key: metric.key,
    value: formatMetric(visiblePoint.value[metric.key], metric.unit)
  }))
})

function updateVisibleSeries(data) {
  visiblePoint.value = data
}

function formatMetric(value, unit) {
  if (!Number.isFinite(value)) return '--';

  let displayValue = value;
  let displayUnit = unit;

  // 1. 處理單位轉換：如果是 100hPa，先除以 100
  if (unit === 'hPa') {
    displayValue = value / 100;
    displayUnit = "100hPa";
  }

  const precision = typeof metricPrecision === 'function' ? metricPrecision(unit) : 3;

  const rendered = Number.isInteger(displayValue) 
    ? displayValue.toString() 
    : displayValue.toFixed(precision);

  return displayUnit ? `${rendered} ${displayUnit}` : rendered;
}

function metricPrecision(unit) {
  return unit ? 2 : 2
}
</script>

<style scoped>
.chart-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(520px, 100%);
  height: 320px;
  padding: 16px;
  pointer-events: auto;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 5px;
  min-height: 40px;
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

.metric-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin: 0 0 10px;
}

.metric-strip span {
  display: grid;
  gap: 2px;
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 6px;
  background: rgb(255 255 255 / 4%);
  color: #dbe4e8;
  font-size: 11px;
}

.metric-strip b {
  font-size: 11px;
  font-weight: 700;
}

.chart {
  width: 100%;
  height: 170px;
}
</style>
