import { assetUrl } from '../core/paths'

export const devices = [
  {
    id: 'weather-01',
    name: 'Taipei 101',
    position: { longitude: 121.5645, latitude: 25.0339, height: 400 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/pump-01.json')
  },
  {
    id: 'weather-02',
    name: 'SongShan Airport',
    position: { longitude: 121.5516, latitude: 25.0640, height: 35 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/meter-02.json')
  },
  {
    id: 'weather-03',
    name: 'Daan Park',
    position: { longitude: 121.5354, latitude: 25.0284, height: 30 },
    modelUrl: assetUrl('models/sample-device/device.gltf'),
    dataUrl: assetUrl('data/weather-03.json')
  }
]
