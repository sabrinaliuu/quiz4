<template>
  <section class="cesium-wrap">
    <section ref="containerRef" class="cesium-viewer" aria-label="Cesium 3D model viewer"></section>
    <div
      v-if="popup.visible"
      class="sensor-popup"
      :style="{ left: `${popup.x}px`, top: `${popup.y}px` }"
    >
      <strong>{{ popup.name }}</strong>
      <span>{{ popup.type }}</span>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { assetUrl } from '../core/paths'

const props = defineProps({
  models: {
    type: Array,
    default: null
  },
  selectedModelId: { type: String, default: '' },
  showLabels: { type: Boolean, default: true },
  autoZoom: { type: Boolean, default: true },
  activeTool: { type: String, default: '' },
  command: { type: Object, default: null },
  terrainExaggeration: { type: Number, default: 1 },
  layers: {
    type: Object,
    default: () => ({ models: true, buildings: false, sensors: true, terrain: true })
  }
})

const emit = defineEmits([
  'camera-change',
  'coordinate-change',
  'measurement-change',
  'model-click',
  'sensor-selected',
  'viewer-ready'
])
const containerRef = ref(null)
const entitiesById = new Map()
const modelsById = new Map()
let viewer
let clickHandler
let hoverHandler
let moveHandler
let osmBuildings
let cameraChangedUnsubscribe
let hoveredEntity
let isDestroyed = false
let hasZoomed = false
let terrainRequestId = 0
let terrainEnabled
let measurementPoints = []
let measurementEntities = []

const defaultView = {
  longitude: 121.5645,
  latitude: 25.0339,
  height: 1600
}

const popup = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  type: '',
  value: ''
})

onMounted(async () => {
  isDestroyed = false
  terrainEnabled = props.layers.terrain !== false
  const terrainProvider = await createTerrainProvider(terrainEnabled)
  if (isDestroyed) return

  viewer = new Cesium.Viewer(containerRef.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    terrainProvider
  })

  viewer.scene.globe.enableLighting = true
  viewer.scene.globe.depthTestAgainstTerrain = true
  viewer.scene.globe.terrainExaggeration = props.terrainExaggeration
  viewer.scene.skyAtmosphere.show = true

  loadModels(props.models)
  applyLayers(props.layers)
  bindClickHandler()
  bindHoverHandler()
  bindMoveHandler()
  bindCameraHandler()
  emit('viewer-ready', viewer)
})

watch(
  () => props.models,
  (models) => {
    if (!viewer) return
    loadModels(models, { zoom: false })
    applyLayers(props.layers)
  },
  { deep: true }
)

watch(
  () => props.layers,
  (layers) => {
    if (!viewer) return
    applyLayers(layers)
  },
  { deep: true }
)

watch(
  () => props.selectedModelId,
  (modelId) => {
    if (!viewer || !modelId) return
    const entity = entitiesById.get(modelId)
    if (entity) viewer.flyTo(entity, { duration: 0.8 })
  }
)

watch(
  () => props.command,
  (command) => {
    if (!viewer || !command) return
    runCommand(command.type)
  }
)

watch(
  () => props.activeTool,
  () => {
    measurementPoints = []
    clearMeasurementEntities()
    emit('measurement-change', null)
  }
)

watch(
  () => props.terrainExaggeration,
  (value) => {
    if (!viewer || viewer.isDestroyed()) return
    viewer.scene.globe.terrainExaggeration = value
  }
)

onBeforeUnmount(() => {
  isDestroyed = true
  cameraChangedUnsubscribe?.()
  clickHandler?.destroy()
  hoverHandler?.destroy()
  moveHandler?.destroy()
  viewer?.destroy()
  entitiesById.clear()
  modelsById.clear()
})

function loadModels(models, options = {}) {
  const { zoom = props.autoZoom && !hasZoomed } = options
  const activeIds = new Set(models.map((model) => model.id))

  for (const [id, entity] of entitiesById) {
    if (!activeIds.has(id)) {
      viewer.entities.remove(entity)
      entitiesById.delete(id)
      modelsById.delete(id)
    }
  }

  const entities = models.map((model) => {
    modelsById.set(model.id, model)
    const existing = entitiesById.get(model.id)

    if (existing) {
      updateModelEntity(existing, model)
      return existing
    }

    const entity = viewer.entities.add({
      id: model.id,
      name: model.metadata?.name ?? model.id,
      position: Cesium.Cartesian3.fromDegrees(model.longitude, model.latitude, model.height ?? 0),
      heightReference: getHeightReference(model),
      model: {
        uri: model.url,
        show: props.layers.models !== false,
        color: statusColor(model.statusValue),
        colorBlendMode: Cesium.ColorBlendMode.MIX,
        colorBlendAmount: 0.25,
        silhouetteColor: Cesium.Color.fromCssColorString('#f8fafb'),
        silhouetteSize: 0,
        minimumPixelSize: model.minimumPixelSize ?? 72,
        maximumScale: model.maximumScale ?? 240,
        scale: model.scale ?? 1
      },
      point: {
        show: props.layers.sensors !== false,
        pixelSize: pulsingSize(model),
        color: pulsingColor(model),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: getHeightReference(model)
      },
      label: props.showLabels
        ? {
            show: props.layers.sensors !== false,
            text: model.metadata?.name ?? model.id,
            font: '13px Inter, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -44),
            heightReference: getHeightReference(model),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000)
          }
        : undefined,
      properties: {
        modelId: model.id,
        sensorId: getSensorId(model),
        metadata: model.metadata ?? {}
      }
    })

    entitiesById.set(model.id, entity)
    return entity
  })

  if (zoom && entities.length) {
    hasZoomed = true
    void viewer.zoomTo(entities, new Cesium.HeadingPitchRange(0, -0.65, 7000)).catch((error) => {
      if (!isDestroyed) console.warn('Unable to zoom to Cesium models', error)
    })
  }
}

function updateModelEntity(entity, model) {
  entity.name = model.metadata?.name ?? model.id
  entity.position = Cesium.Cartesian3.fromDegrees(model.longitude, model.latitude, model.height ?? 0)
  entity.heightReference = getHeightReference(model)

  if (entity.model) {
    entity.model.uri = model.url
    entity.model.show = props.layers.models !== false
    entity.model.color = statusColor(getModelStatusValue(model))
    entity.model.minimumPixelSize = model.minimumPixelSize ?? 72
    entity.model.maximumScale = model.maximumScale ?? 240
    entity.model.scale = model.scale ?? 1
    entity.model.heightReference = getHeightReference(model)
  }

  if (entity.point) {
    entity.point.show = props.layers.sensors !== false
    entity.point.pixelSize = entity === hoveredEntity ? 14 : pulsingSize(model)
    entity.point.color = pulsingColor(model)
  }

  if (entity.label) {
    entity.label.show = props.layers.sensors !== false && props.showLabels
    entity.label.text = model.metadata?.name ?? model.id
    entity.label.heightReference = getHeightReference(model)
  }

  entity.properties = {
    modelId: model.id,
    sensorId: getSensorId(model),
    metadata: model.metadata ?? {}
  }
}

function bindHoverHandler() {
  hoverHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  hoverHandler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.endPosition)
    const entity = picked?.id
    const modelId = entity?.properties?.modelId?.getValue()
    const model = modelsById.get(modelId)

    if (!model || !entity) {
      clearHover()
      return
    }

    if (hoveredEntity !== entity) {
      clearHover()
      setHover(entity)
    }

    updatePopup(movement.endPosition, model)
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

function bindMoveHandler() {
  moveHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  moveHandler.setInputAction((movement) => {
    const coordinate = pickCoordinate(movement.endPosition)
    if (coordinate) emit('coordinate-change', coordinate)
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

function setHover(entity) {
    hoveredEntity = entity
    if (entity.model) {
      entity.model.silhouetteSize = 3
      entity.model.colorBlendAmount = 0.45
    }
    if (entity.point) entity.point.pixelSize = 14

    viewer.canvas.style.cursor = 'pointer'
}

function clearHover() {
  if (!hoveredEntity) return
  const modelId = hoveredEntity.properties?.modelId?.getValue()
  const model = modelsById.get(modelId)
  if (hoveredEntity.model) {
    hoveredEntity.model.silhouetteSize = 0
    hoveredEntity.model.colorBlendAmount = 0.25
  }
  if (hoveredEntity.point && model) hoveredEntity.point.pixelSize = pulsingSize(model)
  hoveredEntity = undefined
  popup.visible = false
  if (viewer && !viewer.isDestroyed()) viewer.canvas.style.cursor = ''
}

function updatePopup(position, model) {
  const bounds = containerRef.value?.getBoundingClientRect()
  const maxX = Math.max((bounds?.width ?? 0) - 180, 8)
  const maxY = Math.max((bounds?.height ?? 0) - 90, 8)
  popup.visible = true
  popup.x = Math.min(position.x + 14, maxX)
  popup.y = Math.min(position.y + 14, maxY)
  popup.name = model.metadata?.name ?? model.id
  popup.type = model.metadata?.type ?? 'IoT Sensor'
  popup.value = formatSensorValue(model)
}

async function applyLayers(layers) {
  if (isDestroyed || !viewer || viewer.isDestroyed()) return
  const showModels = layers.models !== false
  const showSensors = layers.sensors !== false

  await setTerrainEnabled(layers.terrain !== false)

  viewer.entities.values.forEach((entity) => {
    if (entity.model) entity.model.show = showModels
    if (entity.point) entity.point.show = showSensors
    if (entity.label) entity.label.show = showSensors && props.showLabels
  })

  if (layers.buildings) {
    if (!osmBuildings) {
      try {
        const buildings = await Cesium.createOsmBuildingsAsync()
        if (isDestroyed || !viewer || viewer.isDestroyed()) return
        osmBuildings = buildings
        viewer.scene.primitives.add(osmBuildings)
      } catch (error) {
        console.warn('Unable to load Cesium OSM buildings', error)
      }
    }
    if (osmBuildings) osmBuildings.show = true
  } else if (osmBuildings) {
    osmBuildings.show = false
  }
}

async function setTerrainEnabled(enabled) {
  if (terrainEnabled === enabled) return
  terrainEnabled = enabled
  const requestId = ++terrainRequestId
  const provider = await createTerrainProvider(enabled)
  if (requestId !== terrainRequestId || isDestroyed || !viewer || viewer.isDestroyed()) return
  viewer.terrainProvider = provider
}

async function createTerrainProvider(enabled) {
  if (!enabled) return new Cesium.EllipsoidTerrainProvider()

  try {
    return await Cesium.createWorldTerrainAsync({
      requestVertexNormals: true,
      requestWaterMask: true
    })
  } catch (error) {
    console.warn('Unable to load Cesium World Terrain; using ellipsoid terrain', error)
    return new Cesium.EllipsoidTerrainProvider()
  }
}

function bindClickHandler() {
  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((movement) => {
    if (props.activeTool === 'distance' || props.activeTool === 'area') {
      addMeasurementPoint(movement.position)
      return
    }

    const picked = viewer.scene.pick(movement.position)
    const entity = picked?.id
    const modelId = entity?.properties?.modelId?.getValue()
    const sensorId = entity?.properties?.sensorId?.getValue()
    const model = modelsById.get(modelId)

    if (model && sensorId) {
      emit('sensor-selected', sensorId)
      emit('model-click', {
        id: model.id,
        sensor_id: sensorId,
        metadata: model.metadata ?? {},
        model,
        entity
      })
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function bindCameraHandler() {
  const emitHeading = () => {
    const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC)
    const heading = Cesium.Math.toDegrees(viewer.camera.heading)
    emit('camera-change', {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
      heading: normalizeDegrees(heading),
      pitch: Cesium.Math.toDegrees(viewer.camera.pitch)
    })
  }

  emitHeading()
  viewer.camera.changed.addEventListener(emitHeading)
  cameraChangedUnsubscribe = () => viewer?.camera.changed.removeEventListener(emitHeading)
}

function runCommand(type) {
  if (type === 'zoom-in') viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35)
  if (type === 'zoom-out') viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.35)
  if (type === 'home') flyHome()
  if (type === 'north') resetNorth()
}

function flyHome() {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(defaultView.longitude, defaultView.latitude, defaultView.height),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-45),
      roll: 0
    },
    duration: 0.8
  })
}

function resetNorth() {
  const cartographic = viewer.camera.positionCartographic
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height
    ),
    orientation: {
      heading: 0,
      pitch: viewer.camera.pitch,
      roll: 0
    },
    duration: 0.5
  })
}

function addMeasurementPoint(position) {
  const coordinate = pickCoordinate(position)
  if (!coordinate) return
  measurementPoints.push(coordinate)
  drawMeasurement()
}

function drawMeasurement() {
  clearMeasurementEntities()
  const positions = measurementPoints.map((point) =>
    Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height)
  )

  positions.forEach((position) => {
    measurementEntities.push(
      viewer.entities.add({
        position,
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString('#f0c85a'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        }
      })
    )
  })

  if (positions.length >= 2) {
    measurementEntities.push(
      viewer.entities.add({
        polyline: {
          positions: props.activeTool === 'area' && positions.length > 2 ? [...positions, positions[0]] : positions,
          width: 3,
          material: Cesium.Color.fromCssColorString('#f0c85a')
        }
      })
    )
  }

  if (props.activeTool === 'area' && positions.length >= 3) {
    measurementEntities.push(
      viewer.entities.add({
        polygon: {
          hierarchy: positions,
          material: Cesium.Color.fromCssColorString('#f0c85a').withAlpha(0.24)
        }
      })
    )
    emit('measurement-change', { type: 'area', value: calculateAreaSqKm(measurementPoints) })
  } else if (props.activeTool === 'distance' && positions.length >= 2) {
    emit('measurement-change', { type: 'distance', value: calculateDistanceKm(measurementPoints) })
  }
}

function clearMeasurementEntities() {
  measurementEntities.forEach((entity) => viewer?.entities.remove(entity))
  measurementEntities = []
}

function pickCoordinate(windowPosition) {
  const picked = viewer.scene.pickPositionSupported ? viewer.scene.pickPosition(windowPosition) : undefined
  const cartesian = picked ?? viewer.camera.pickEllipsoid(windowPosition, viewer.scene.globe.ellipsoid)
  if (!cartesian) return null

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height
  }
}

function calculateDistanceKm(points) {
  let meters = 0
  for (let index = 1; index < points.length; index += 1) {
    const start = Cesium.Cartographic.fromDegrees(points[index - 1].longitude, points[index - 1].latitude)
    const end = Cesium.Cartographic.fromDegrees(points[index].longitude, points[index].latitude)
    meters += new Cesium.EllipsoidGeodesic(start, end).surfaceDistance
  }
  return meters / 1000
}

function calculateAreaSqKm(points) {
  const radians = points.map((point) => ({
    lon: Cesium.Math.toRadians(point.longitude),
    lat: Cesium.Math.toRadians(point.latitude)
  }))
  let total = 0
  for (let index = 0; index < radians.length; index += 1) {
    const current = radians[index]
    const next = radians[(index + 1) % radians.length]
    total += (next.lon - current.lon) * (2 + Math.sin(current.lat) + Math.sin(next.lat))
  }
  return Math.abs((total * Cesium.Ellipsoid.WGS84.maximumRadius ** 2) / 2) / 1000000
}

function getSensorId(model) {
  return model.sensor_id ?? model.sensorId ?? model.metadata?.sensor_id ?? model.metadata?.sensorId ?? model.id
}

function getHeightReference(model) {
  return model.heightReference ?? Cesium.HeightReference.RELATIVE_TO_GROUND
}

function getStatusLevel(value = 0) {
  if (value >= 80) return 'critical'
  if (value >= 55) return 'warning'
  return 'normal'
}

function statusColor(value = 0) {
  const level = getStatusLevel(value)
  if (level === 'critical') return Cesium.Color.fromCssColorString('#ee6b5f')
  if (level === 'warning') return Cesium.Color.fromCssColorString('#f0c85a')
  return Cesium.Color.fromCssColorString('#55c3a5')
}

function pulsingColor(model) {
  return new Cesium.CallbackProperty(() => {
    const alpha = 0.72 + Math.sin(Date.now() / 260) * 0.22
    return statusColor(getModelStatusValue(model)).withAlpha(alpha)
  }, false)
}

function pulsingSize(model) {
  return new Cesium.CallbackProperty(() => {
    const amplitude = getStatusLevel(getModelStatusValue(model)) === 'normal' ? 1 : 2.4
    return 10 + Math.sin(Date.now() / 220) * amplitude
  }, false)
}

function formatSensorValue(model) {
  const value = model.metadata?.value ?? model.statusValue
  const unit = model.metadata?.unit ?? ''
  if (value === undefined || value === null) return 'No value'
  return `${value} ${unit}`.trim()
}

function getModelStatusValue(model) {
  const value = Number(model.metadata?.value ?? model.statusValue)
  return Number.isFinite(value) ? value : 0
}

function normalizeDegrees(value) {
  return Math.round((value + 360) % 360)
}
</script>

<style scoped>
.cesium-wrap,
.cesium-viewer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sensor-popup {
  position: absolute;
  z-index: 20;
  display: grid;
  min-width: 150px;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 8px;
  color: #f8fafb;
  background: rgb(17 24 28 / 92%);
  box-shadow: 0 14px 34px rgb(0 0 0 / 30%);
  pointer-events: none;
}

.sensor-popup span {
  color: #b9c2c7;
  font-size: 12px;
}

.sensor-popup b {
  color: #55c3a5;
  font-size: 14px;
}
</style>
