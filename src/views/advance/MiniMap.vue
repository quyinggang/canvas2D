<template>
  <div class="box" ref="boxElementRef">
    <div class="viewer" ref="viewElementRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor, EventEmitter } from '@/utils'

const boxElementRef = ref(null)
const viewElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const viewElement = viewElementRef.value

  const SETTING = {
    mapBackground: '#161c22',
    textColor: '#fff',
    maxZoom: 10,
    minZoom: 0.1
  }

  class Transform {
    constructor(matrix = [1, 0, 0, 1, 0, 0]) {
      this.matrix = [...matrix]
    }
    invert() {
      const m = this.matrix
      const d = 1 / (m[0] * m[3] - m[1] * m[2])
      const m0 = m[3] * d
      const m1 = -m[1] * d
      const m2 = -m[2] * d
      const m3 = m[0] * d
      const m4 = d * (m[2] * m[5] - m[3] * m[4])
      const m5 = d * (m[1] * m[4] - m[0] * m[5])
      return new Transform([m0, m1, m2, m3, m4, m5])
    }
    multiply(matrix) {
      const m = this.matrix
      var m11 = m[0] * matrix[0] + m[2] * matrix[1]
      var m12 = m[1] * matrix[0] + m[3] * matrix[1]
      var m21 = m[0] * matrix[2] + m[2] * matrix[3]
      var m22 = m[1] * matrix[2] + m[3] * matrix[3]
      var dx = m[0] * matrix[4] + m[2] * matrix[5] + m[4]
      var dy = m[1] * matrix[4] + m[3] * matrix[5] + m[5]
      m[0] = m11
      m[1] = m12
      m[2] = m21
      m[3] = m22
      m[4] = dx
      m[5] = dy
    }
    changeScaler(scale) {
      const matrix = this.matrix
      matrix[0] = scale
      matrix[3] = scale
    }
    changeTranslation({ x, y }) {
      const matrix = this.matrix
      matrix[4] = x
      matrix[5] = y
    }
    getScaler() {
      return this.matrix[0]
    }
    getTranslation() {
      const matrix = this.matrix
      return {
        x: matrix[4],
        y: matrix[5]
      }
    }
    clone() {
      return [...this.matrix]
    }
    point(point) {
      const m = this.matrix
      return {
        x: m[0] * point.x + m[2] * point.y + m[4],
        y: m[1] * point.x + m[3] * point.y + m[5]
      }
    }
  }

  class MouseController extends EventEmitter {
    constructor(config) {
      super()
      this.element = config.element
      this.offset = config.offset
      this.scale = config.scale || 1
      this.zoomVisible = true
      this.scaleStep = 1.04
      this.transform = new Transform()
      this.handleMoveDown = this.onMoveDown.bind(this)
      this.handleWheel = this.onWheel.bind(this)
      this.bindEvents()
    }
    bindEvents() {
      const element = this.element
      element.addEventListener('mousedown', this.handleMoveDown)
      element.addEventListener('wheel', this.handleWheel, { passive: false })
    }
    panTo({ x, y }) {
      this.transform.changeTranslation({ x, y })
    }
    zoomTo(scale) {
      this.transform.changeScaler(scale)
    }
    moveBy({ x, y }) {
      const transform = this.transform
      const currentTranslation = transform.getTranslation()
      const newTranslation = {
        x: currentTranslation.x + x,
        y: currentTranslation.y + y
      }
      transform.changeTranslation(newTranslation)
    }
    onWheel(event) {
      if (!this.zoomVisible) return
      event.stopPropagation()
      event.preventDefault()
      const { transform, offset, scaleStep } = this
      const { pageX, pageY, deltaY } = event
      const x = pageX - offset.left
      const y = pageY - offset.top
      const oldScale = transform.getScaler()
      const translation = transform.getTranslation()
      const nextScale = deltaY > 0 ? oldScale * scaleStep : oldScale / scaleStep
      if (nextScale > SETTING.maxZoom || nextScale < SETTING.minZoom) {
        return
      }
      // 此处具体的逻辑说明请查看panzoom
      const offsetSize = {
        x: (x - translation.x) / oldScale,
        y: (y - translation.y) / oldScale
      }
      const nextTranslation = {
        x: -offsetSize.x * nextScale + x,
        y: -offsetSize.y * nextScale + y
      }
      this.panTo(nextTranslation)
      this.zoomTo(nextScale)
      this.emit('onZoom')
    }
    onMoveDown(event) {
      event.stopPropagation()
      let isDragging = true
      const scale = this.scale
      const { left, top } = this.offset
      const transform = this.transform
      let oldPosition = { x: (event.pageX - left) / scale , y: (event.pageY - top) / scale }
      const onMouseMove = (ev) => {
        if (!isDragging) return
        const current = {
          x: (ev.pageX - left) / scale,
          y: (ev.pageY - top) / scale
        }
        const translation = transform.getTranslation()
        const diff = {
          x: current.x - oldPosition.x,
          y: current.y - oldPosition.y
        }
        this.panTo({
          x: diff.x + translation.x,
          y: diff.y + translation.y
        })
        this.emit('onMove', { ...diff })
        this.emit('onPan')
        oldPosition = current
      }
      const onMouseUp = () => {
        isDragging = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    setZoomVisible(value) {
      this.zoomVisible = !!value
    }
    destroy() {
      const element = this.element
      element.removeEventListener('wheel', this.handleWheel)
      element.removeEventListener('mousedown', this.handleMoveDown)
      this.element = null
    }
  }

  class Canvas {
    constructor(config) {
      this.domElement = document.createElement('canvas')
      this.ctx = this.domElement.getContext('2d')
      this.setCanvasSize(config)
      this.setCanvasAttrs()
      // 会对画布内容放大pixel，用于高分辨率下的图形绘制
      this.ctx.scale(config.pixel, config.pixel)
    }
    setCanvasSize(config) {
      const { width, height, pixel } = config
      this.width = width * pixel
      this.height = height * pixel
      this.styleWidth = width
      this.styleHeight = height
    }
    setCanvasAttrs() {
      const { width, height, styleWidth, styleHeight, domElement } = this
      domElement.width = width
      domElement.height = height
      domElement.style.cssText = `width:${styleWidth}px;height:${styleHeight}px;`
    }
  }

  class Circle {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.radius = config.radius
      this.color = config.color
      this.text = config.text
    }
    render(ctx) {
      const { x, y, radius, color, text } = this
      const textInfo = ctx.measureText(text)

      ctx.save()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
      ctx.fill()

      ctx.fillStyle = SETTING.textColor
      ctx.beginPath()
      ctx.fillText(text, x - textInfo.width * 0.5, y + 4)
      ctx.restore()
    }
  }

  class MapManager {
    constructor(config) {
      this.container = config.container
      this.createMapLayer()
      this.createScene()
      this.createMouseController()
    }
    createMapLayer() {
      const container = this.container
      const boundingClient = container.getBoundingClientRect()
      const { width, height } = boundingClient
      this.canvas = new Canvas({
        width,
        height,
        pixel: window.devicePixelRatio
      })
      this.clientCenter = { x: width * 0.5, y: height * 0.5 }
      this.boundingClient = boundingClient
    }
    createScene() {
      const clientCenter = this.clientCenter
      this.shapes = [
        new Circle({
          x: clientCenter.x * 0.5,
          y: clientCenter.y * 0.5,
          color: getRandomColor(),
          radius: 20,
          text: '左上'
        }),
        new Circle({
          x: clientCenter.x,
          y: clientCenter.y,
          color: getRandomColor(),
          radius: 40,
          text: '中心'
        }),
        new Circle({
          x: clientCenter.x * 1.5,
          y: clientCenter.y * 1.5,
          color: getRandomColor(),
          radius: 20,
          text: '右下'
        })
      ]
    }
    createMouseController() {
      const { boundingClient, canvas } = this
      const mouseController = new MouseController({
        element: canvas.domElement,
        offset: {
          top: boundingClient.top,
          left: boundingClient.left
        }
      })
      this.mouseController = mouseController
    }
    getTransform() {
      return this.mouseController.transform
    }
    resetScene() {
      this.mouseController.setVisible(true)
      this.mouseController.transform = new Transform(this.originMatrix)
    }
    renderMap() {
      const { canvas, mouseController, shapes } = this
      const { ctx, width, height } = canvas
      const m = mouseController.transform.matrix

      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.fillStyle = SETTING.mapBackground
      ctx.fillRect(0, 0, width, height)
      // 需要使用transform而不是setTransform，注意二者的区别
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
      for (const shape of shapes) {
        shape.render(ctx)
      }
      ctx.restore()
    }
    mountCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    destroy() {
      this.container = null
      this.mouseController.destroy()
    }
  }

  class ViewManager {
    constructor(config) {
      this.container = config.container
      this.boundingClient = this.container.getBoundingClientRect()
      this.mapManager = config.mapManager
      this.isRendered = false
      this.createThumb()
      this.createViewerLayer()
      this.zoomSceneToThumb()
      this.calcDragBoxRect()
      this.createMouseController()
      this.bindEvents()
    }
    createThumb() {
      const thumbElement = document.createElement('div')
      const dragElement = document.createElement('div')
      thumbElement.appendChild(dragElement)
      this.container.appendChild(thumbElement)
      this.dragElement = dragElement
      this.thumbElement = thumbElement
    }
    createViewerLayer() {
      const { width, height } = this.mapManager.canvas

      this.canvas = new Canvas({
        width,
        height,
        pixel: 1
      })
    }
    createMouseController() {
      const { zoomToFit, dragElement } = this
      const mouseController = new MouseController({
        element: dragElement,
        offset: { top: 0, left: 0 },
        // 调节拖动差值大小使得拖动平滑自然，小地图zoomToFit非常小会导致差值较大，从而导致拖动不平滑
        scale: zoomToFit * 9.6
      })
      mouseController.setZoomVisible(false)
      this.mouseController = mouseController
    }
    zoomSceneToThumb() {
      const { width, height } = this.boundingClient
      const { width: mapWidth, height: mapHeight } = this.mapManager.canvas
      // 计算出鸟瞰图视口大小显示地图场景需要的缩放值
      const zoomToFit = Math.min(width / mapWidth, height / mapHeight)
      // 计算出鸟瞰图剩余空间从而计算出居中偏移量
      const translation = {
        x: (width - mapWidth * zoomToFit) * 0.5,
        y: (height - mapHeight * zoomToFit) * 0.5
      }
      const positionCssText = `position:absolute;top:0;left:0;width:${mapWidth}px;height:${mapHeight}px;z-index:1;`
      const transformCssText = `transform-origin:0 0;transform:translate(${translation.x}px,${translation.y}px) scale(${zoomToFit});`
      this.thumbElement.style.cssText = `${positionCssText}${transformCssText}`
      this.zoomToFit = zoomToFit
    }
    calcDragBoxRect() {
      const { mapManager, zoomToFit } = this
      const { width: clientWidth, height: clientHeight } = mapManager.boundingClient
      const dpr = window.devicePixelRatio

      /*
        计算可视区域的范围
        - 将屏幕可视范围通过逆矩阵转换乘canvas坐标
        - 根据canvas坐标计算出范围大小以及开始点
      */
      const invertTransform = mapManager.getTransform().invert()
      const start = invertTransform.point({ x: 0, y: 0 })
      const end = invertTransform.point({ x: clientWidth, y: clientHeight })

      /*
        小地图的scale是依据canvas绘图面积计算出来的，所以屏幕可视范围对应canvas坐标计算的大小和位置可以作为拖拽框的定位以及大小设置
        需要注意的是最后转换的canvas坐标需要乘以dpr
      */
      const viewport = {
        x: start.x * dpr,
        y: start.y * dpr,
        width: (end.x - start.x) * dpr,
        height: (end.y - start.y) * dpr
      }
      const positionCssText = `position:absolute;top:0px;left:0px;z-index:2;box-sizing:border-box;`
      const sizeCssText = `width:${viewport.width}px;height:${viewport.height}px;`
      const transformCssText = `transform-origin:top left;transform:translate(${viewport.x}px,${viewport.y}px);`
      const borderCssText = `border: ${Math.round(1 / zoomToFit)}px solid #fff;`
      this.dragElement.style.cssText = `${positionCssText}${sizeCssText}${transformCssText}${borderCssText}`
    }
    renderViewer() {
      if (this.isRendered) return
      const { canvas, mapManager } = this
      const ctx = canvas.ctx
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.drawImage(mapManager.canvas.domElement, 0, 0)
      ctx.restore()
      this.isRendered = true
    }
    bindEvents() {
      const { mapManager, mouseController } = this
      const mapMouseController = mapManager.mouseController
      mapMouseController.on('onPan', () => {
        this.calcDragBoxRect()
      })
      mapMouseController.on('onZoom', () => {
        this.calcDragBoxRect()
      })
      mouseController.on('onMove', (diff) => {
        const scale = mapManager.getTransform().getScaler()
         // 最好处理逻辑是场景的缩放值动态调节，需要配合mouseController的scale同时处理，使得不同缩放值下拖动的平滑
        const targetDiff = {
          x: -diff.x * scale,
          y: -diff.y * scale
        }
        mapMouseController.moveBy(targetDiff)
        this.calcDragBoxRect()
      })
    }
    mountCanvas() {
      this.thumbElement.appendChild(this.canvas.domElement)
    }
    destroy() {
      this.container = null
    }
  }

  class SceneMap {
    constructor(config) {
      this.raf = null
      this.createManager(config)
      this.mount()
    }
    createManager(config) {
      const { container, viewer } = config
      const mapManager = new MapManager({ container })
      this.viewManager = new ViewManager({ container: viewer, mapManager })
      this.mapManager = mapManager
    }
    renderFrame() {
      this.mapManager.renderMap()
      this.viewManager.renderViewer()
    }
    renderLoop() {
      this.renderFrame()
      this.raf = window.requestAnimationFrame(this.renderLoop.bind(this))
    }
    mount() {
      this.mapManager.mountCanvas()
      this.viewManager.mountCanvas()
    }
    destroy() {
      this.mapManager.destroy()
      this.viewManager.destroy()
    }
  }

  const map = new SceneMap({
    container: boxElement,
    viewer: viewElement
  })
  map.renderLoop()

  onBeforeUnmount(() => map.destroy())
})
</script>

<style scoped>
.box {
  position: relative;
  width: 100%;
  height: 100%;
  user-select: none;
}

.viewer {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 1;
  width: 200px;
  height: 100px;
  background-color: rgb(153, 148, 150);
  overflow: hidden;
}
</style>
