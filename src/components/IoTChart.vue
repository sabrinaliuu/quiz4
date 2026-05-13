<template>
  <div class="iot-chart-shell">
    <div ref="chartRef" class="iot-chart"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { generateStationMetrics } from '../data/iotDataGenerator'

const props = defineProps({
  sensorId: { type: String, default: '' },
  yAxisName: { type: String, default: 'value' }
})

const emit = defineEmits(['data-change'])
const chartRef = ref(null)
const currentData = ref([])
const generatedDataBySensor = new Map()
let chart

onMounted(async () => {
  chart = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch(() => props.sensorId, renderChart)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})

async function renderChart() {
  await nextTick()
  if (!chart) return

  currentData.value = createRandomData(props.sensorId)
  drawChart(currentData.value)
  emit('data-change', currentData.value.at(-1) ?? null)
}

function drawChart(data) {
  if (!chart) return

  const seriesDefs = [
    { key: 'temperature', name: 'Temperature', color: '#55c3a5', unit: 'C' },
    { key: 'energy', name: 'Energy', color: '#f0c85a', unit: 'kW' },
    { key: 'windSpeed', name: 'Wind Speed', color: '#7aa2ff', unit: 'm/s' },
    { key: 'pressure', name: 'Pressure', color: '#ee6b5f', unit: 'hPa' },
    { key: 'aqi', name: 'AQI', color: '#c47dff', unit: '' }
  ]

  chart.setOption({
    grid: { left: 52, right: 20, top: 42, bottom: 34 },
    legend: {
      top: 8,
      left: 8,
      textStyle: { color: '#dbe4e8' },
      itemWidth: 14,
      itemHeight: 8
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'time',
      axisLabel: { color: '#b9c2c7' },
      axisLine: { lineStyle: { color: '#617079' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '',
      nameTextStyle: { color: '#b9c2c7' },
      axisLabel: { color: '#b9c2c7' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
    },
    series: seriesDefs.map((series) => ({
      name: series.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2.5, color: series.color },
      itemStyle: {
        color: series.color, // 設定點的填充顏色
        borderColor: '#fff', // 選擇性：增加白邊讓點更清晰
        borderWidth: 1
      },
      areaStyle: undefined,
      data: data.map((point) => [toChartTime(point.time), normalizeSeriesValue(point[series.key], series.key)])
    }))
  })
}

function createRandomData(sensorId) {
  const key = sensorId || 'sensor'
  if (!generatedDataBySensor.has(key)) {
    generatedDataBySensor.set(key, generateStationMetrics(key))
  }

  return generatedDataBySensor.get(key)
}

function normalizeSeriesValue(value, key) {
  if (key === 'pressure') return (value / 100).toFixed(4)
  return value
}

function toChartTime(time) {
  if (/^\d{2}:\d{2}$/.test(time)) {
    const date = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    date.setHours(hours, minutes, 0, 0)
    return date.toISOString()
  }

  return time
}

function resizeChart() {
  chart?.resize()
}
</script>

<style scoped>
.iot-chart {
  width: 100%;
  height: 100%;
  min-height: 180px;
}

.iot-chart-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.play-button {
  position: absolute;
  top: 0;
  right: 2px;
  z-index: 2;
  min-width: 72px;
  height: 30px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 6px;
  color: #f8fafb;
  background: rgb(85 195 165 / 22%);
  cursor: pointer;
}

.play-button:hover {
  background: rgb(85 195 165 / 32%);
}
</style>
