import { assetUrl } from '../core/paths'

export const devices = [
  {
    id: 'pump-01',
    name: 'Pump Station 01',
    type: 'Pressure Sensor',
    position: { longitude: 121.5654, latitude: 25.033, height: 40 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/pump-01.json'),
    sensor: { name: 'Pressure', unit: 'kPa' }
  },
  {
    id: 'meter-02',
    name: 'Power Meter 02',
    type: 'Energy Meter',
    position: { longitude: 121.568, latitude: 25.035, height: 55 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/meter-02.json'),
    sensor: { name: 'Power', unit: 'kW' }
  },
  {
    id: 'weather-03',
    name: 'Weather Node 03',
    type: 'Weather Station',
    position: { longitude: 121.5628, latitude: 25.0362, height: 65 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/weather-03.json'),
    sensor: { name: 'Temperature', unit: 'C' }
  }
]
