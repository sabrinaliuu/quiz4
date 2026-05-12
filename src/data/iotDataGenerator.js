export function generateSensorSeries(sensorId, options = {}) {
  const {
    hours = 24,
    startTime = startOfToday(),
    baseValue = getBaseValue(sensorId),
    variance = 6
  } = options

  return Array.from({ length: hours }, (_, hour) => {
    const time = new Date(startTime.getTime() + hour * 60 * 60 * 1000)
    const wave = Math.sin((hour / 24) * Math.PI * 2) * variance
    const noise = seededNoise(sensorId, hour) * variance * 0.7

    return {
      time: formatHour(time),
      value: Number((baseValue + wave + noise).toFixed(2))
    }
  })
}

export function generateIotData(sensorIds, options = {}) {
  return Object.fromEntries(
    sensorIds.map((sensorId) => [sensorId, generateSensorSeries(sensorId, options)])
  )
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function formatHour(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function getBaseValue(sensorId) {
  const seed = sensorId
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0)

  return 20 + (seed % 35)
}

function seededNoise(sensorId, hour) {
  const seed = sensorId
    .split('')
    .reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0)
  const value = Math.sin(seed * 12.9898 + hour * 78.233) * 43758.5453
  return value - Math.floor(value) - 0.5
}
