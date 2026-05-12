<template>
  <div class="iot-chart-shell">
    <button class="play-button" type="button" @click="togglePlayback">
      {{ isPlaying ? 'Pause' : 'Play' }}
    </button>
    <div ref="chartRef" class="iot-chart"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { assetUrl } from '../core/paths'
import { generateSensorSeries } from '../data/iotDataGenerator'

const props = defineProps({
  sensorId: { type: String, default: '' },
  source: {
    type: String,
    default: 'csv',
    validator: (value) => ['csv', 'random'].includes(value)
  },
  csvUrl: { type: String, default: () => assetUrl('data/iot.csv') },
  yAxisName: { type: String, default: 'value' },
  seriesName: { type: String, default: 'Sensor value' }
})

const emit = defineEmits(['data-change'])
const chartRef = ref(null)
const csvRows = ref([])
const currentData = ref([])
const frameIndex = ref(0)
const isPlaying = ref(false)
let chart
let playbackTimer

onMounted(async () => {
  chart = echarts.init(chartRef.value)
  await loadCsv()
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch(
  () => [props.sensorId, props.source, props.csvUrl],
  async ([, source]) => {
    if (source === 'csv' && !csvRows.value.length) await loadCsv()
    renderChart()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  stopPlayback()
  chart?.dispose()
})

const visibleData = computed(() => {
  if (!isPlaying.value) return currentData.value
  return currentData.value.slice(0, Math.max(frameIndex.value, 1))
})

async function loadCsv() {
  if (props.source !== 'csv') return

  try {
    const response = await fetch(props.csvUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    csvRows.value = parseCsv(text)
  } catch (error) {
    console.warn('Unable to load IoT CSV data', error)
    csvRows.value = []
  }
}

async function renderChart() {
  await nextTick()
  if (!chart) return

  currentData.value = props.source === 'random' ? createRandomData(props.sensorId) : getCsvData(props.sensorId)
  frameIndex.value = currentData.value.length
  drawChart(visibleData.value)
  emit('data-change', visibleData.value)
}

function drawChart(data) {
  if (!chart) return

  chart.setOption({
    grid: { left: 46, right: 20, top: 28, bottom: 34 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'time',
      axisLabel: { color: '#b9c2c7' },
      axisLine: { lineStyle: { color: '#617079' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: props.yAxisName,
      nameTextStyle: { color: '#b9c2c7' },
      axisLabel: { color: '#b9c2c7' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
    },
    series: [
      {
        name: props.seriesName,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#55c3a5' },
        areaStyle: { color: 'rgba(85, 195, 165, 0.16)' },
        data: data.map((point) => [toChartTime(point.time), point.value])
      }
    ]
  })
}

function togglePlayback() {
  if (isPlaying.value) {
    stopPlayback()
    frameIndex.value = currentData.value.length
    drawChart(currentData.value)
    emit('data-change', currentData.value)
    return
  }

  if (!currentData.value.length) renderChart()
  isPlaying.value = true
  frameIndex.value = 1
  drawChart(visibleData.value)
  emit('data-change', visibleData.value)

  playbackTimer = window.setInterval(() => {
    frameIndex.value += 1
    if (frameIndex.value > currentData.value.length) frameIndex.value = 1
    drawChart(visibleData.value)
    emit('data-change', visibleData.value)
  }, 650)
}

function stopPlayback() {
  isPlaying.value = false
  if (playbackTimer) {
    window.clearInterval(playbackTimer)
    playbackTimer = undefined
  }
}

function getCsvData(sensorId) {
  return csvRows.value
    .filter((row) => row.sensor_id === sensorId)
    .map((row) => ({ time: row.time, value: Number(row.value) }))
    .filter((point) => point.time && Number.isFinite(point.value))
}

function createRandomData(sensorId) {
  return generateSensorSeries(sensorId || 'sensor', { hours: 24 })
}

function parseCsv(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)

  const headers = splitCsvLine(lines.shift() ?? '')
  return lines.map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
}

function splitCsvLine(line) {
  return line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''))
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
