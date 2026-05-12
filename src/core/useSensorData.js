import { onMounted, ref } from 'vue'

export function useSensorData(devices) {
  const sensorDataByDevice = ref({})

  onMounted(async () => {
    const entries = await Promise.all(
      devices.map(async (device) => {
        try {
          const response = await fetch(device.dataUrl)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json()
          return [device.id, data.points ?? []]
        } catch (error) {
          console.warn(`Unable to load IoT data for ${device.id}`, error)
          return [device.id, []]
        }
      })
    )

    sensorDataByDevice.value = Object.fromEntries(entries)
  })

  return { sensorDataByDevice }
}
