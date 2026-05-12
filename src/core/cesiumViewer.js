import * as Cesium from 'cesium'

export function createViewer(container) {
  const viewer = new Cesium.Viewer(container, {
    animation: false,
    baseLayerPicker: true,
    fullscreenButton: false,
    geocoder: false,
    homeButton: true,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false
  })

  viewer.scene.globe.depthTestAgainstTerrain = true
  viewer.scene.skyAtmosphere.show = true
  return viewer
}

export async function addDeviceEntity(viewer, device) {
  const position = Cesium.Cartesian3.fromDegrees(
    device.position.longitude,
    device.position.latitude,
    device.position.height
  )

  return viewer.entities.add({
    id: device.id,
    name: device.name,
    position,
    model: {
      uri: device.modelUrl,
      minimumPixelSize: 84,
      maximumScale: 220,
      scale: 1
    },
    label: {
      text: device.name,
      font: '13px Inter, sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -46),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6000)
    },
    properties: {
      deviceId: device.id
    }
  })
}
