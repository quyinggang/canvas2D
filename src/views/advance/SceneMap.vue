<template>
  <div class="box" ref="boxElementRef">
    <div class="view" ref="viewElementRef"></div>
    <ul class="btn-container">
      <li id="follow" class="btn">跟随</li>
      <li id="locate" class="btn">定位</li>
      <li id="reset" class="btn">重置</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor, getNumberInRange, loadImage } from '@/utils'
import robotImage from '@/assets/robot.png'

const viewElementRef = ref(null)
const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const viewElement = viewElementRef.value

  const SETTING = {
    mapBackground: '#161c22',
    textColor: '#fff',
    maxZoom: 10,
    minZoom: 0.1,
    shapeCount: 100,
    sceneOffset: 60,
    robotId: -1
  }

  class Transform {
    constructor(matrix = [1, 0, 0, 1, 0, 0]) {
      this.matrix = [...matrix]
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

  class MouseController {
    constructor(config) {
      this.element = config.element
      this.offset = config.offset
      this.visible = true
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
      const transform = this.transform
      transform.changeTranslation({ x, y })
    }
    zoomTo(scale) {
      const transform = this.transform
      transform.changeScaler(scale)
    }
    onWheel(event) {
      if (!this.visible) return
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
    }
    onMoveDown(event) {
      if (!this.visible) return
      event.stopPropagation()
      let isDragging = true
      const { left, top } = this.offset
      const transform = this.transform
      let oldPosition = { x: event.pageX - left, y: event.pageY - top }
      const onMouseMove = (ev) => {
        if (!isDragging) return
        const current = {
          x: ev.pageX - left,
          y: ev.pageY - top
        }
        const translation = transform.getTranslation()
        this.panTo({
          x: current.x - oldPosition.x + translation.x,
          y: current.y - oldPosition.y + translation.y
        })
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
    setVisible(value) {
      this.visible = !!value
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

  class Robot {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.width = config.width
      this.height = config.height
      this.image = config.image
      this.angle = config.angle
      this.originPosition = { x: config.x, y: config.y }
    }
    moveTo({ x, y }) {
      this.x = x
      this.y = y
    }
    render(ctx) {
      const { x, y, width, height, image, angle } = this
      ctx.save()
      ctx.rotate(angle)
      ctx.drawImage(image, x - width * 0.5, y - height * 0.5, width, height)
      ctx.restore()
    }
    reset() {
      const originPosition = this.originPosition
      this.x = originPosition.x
      this.y = originPosition.y
    }
  }

  class MapManager {
    constructor(config) {
      this.container = config.container
      this.following = false
      this.createMapLayer()
      this.createMouseController()
      this.createScene()
      this.changeToCenter()
      this.computeDisplayAllScaler()
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
    createScene() {
      const shapes = []
      const sceneRange = {
        sx: -1000,
        sy: -1000,
        ex: 1000,
        ey: 1000
      }
      const count = SETTING.shapeCount
      // 图形的坐标时按照默认canvas坐标系定义的，其中原点位置使用大的圆形标识
      for (let index = 0; index < count; index++) {
        const config = {
          x: getNumberInRange(sceneRange.sx, sceneRange.ex),
          y: getNumberInRange(sceneRange.sy, sceneRange.ey),
          color: getRandomColor(),
          radius: 10,
          text: index
        }
        // 原点
        if (index === count - 1) {
          config.x = 0
          config.y = 0
          config.radius = 20
        }
        shapes.push(new Circle(config))
      }

      const start = { x: 0, y: 0 }
      this.shapes = shapes
      this.sceneRange = sceneRange

      // 简单设置机器人路径
      const end = { x: sceneRange.ex, y: sceneRange.ey }
      const robotPath = []
      for (let t = 0; t <= 1; t += 0.001) {
        robotPath.push({
          x: (1 - t) * start.x + t * end.x,
          y: (1 - t) * start.y + t * end.y
        })
      }
      this.robotDirection = 1
      this.robotPathIndex = 0
      this.robotPath = robotPath
    }
    createRobot(image) {
      this.robot = new Robot({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        image,
        angle: 0
      })
      this.shapes.push(this.robot)
    }
    changeToCenter() {
      // 初始设置将画布坐标原点移到可视区域中心
      this.mouseController.panTo(this.clientCenter)
    }
    computeDisplayAllScaler() {
      const { boundingClient, sceneRange, mouseController } = this
      const transform = mouseController.transform
      const oldScale = transform.getScaler()
      const translation = transform.getTranslation()

      // 计算显示全部场景的缩放值
      const offset = SETTING.sceneOffset
      const { sx, sy, ex, ey } = sceneRange
      const sceneWidth = ex - sx
      const sceneHeight = ey - sy
      let nextScale = Math.min(
        (boundingClient.width - offset) / sceneWidth,
        (boundingClient.height - offset) / sceneHeight
      )
      nextScale = Math.max(Math.min(nextScale, SETTING.maxZoom), SETTING.minZoom)

      // 坐标原点在当前矩阵下的转换后的坐标值
      const { x, y } = transform.point({ x: 0, y: 0 })
      const offsetSize = {
        x: (x - translation.x) / oldScale,
        y: (y - translation.y) / oldScale
      }
      const nextTranslation = {
        x: -offsetSize.x * nextScale + x,
        y: -offsetSize.y * nextScale + y
      }

      mouseController.panTo(nextTranslation)
      mouseController.zoomTo(nextScale)
      this.originMatrix = mouseController.transform.clone()
    }
    startMove() {
      if (!this.following) return

      // 简单处理机器人运动路径
      const { robot, robotPath, robotPathIndex, robotDirection } = this
      const maxIndex = robotPath.length - 1
      let nextPathIndex = 0
      let nextDirection = robotDirection
      if (robotDirection >= 0) {
        const nextIndex = robotPathIndex + 1
        nextPathIndex = Math.min(nextIndex, maxIndex)
        nextDirection = nextPathIndex >= maxIndex ? -1 : 1
      } else {
        const nextIndex = robotPathIndex - 1
        nextPathIndex = Math.max(nextIndex, 0)
        nextDirection = nextPathIndex <= 0 ? 1 : -1
      }

      robot.moveTo(robotPath[nextPathIndex])
      this.robotDirection = nextDirection
      this.robotPathIndex = nextPathIndex

      this.transformShapeToCenter({
        x: robot.x,
        y: robot.y,
        width: robot.width,
        height: robot.height
      })
    }
    followShape() {
      this.mouseController.setVisible(false)
      this.following = !this.following
    }
    transformShapeToCenter(shapeInfo) {
      const { x, y, width, height } = shapeInfo
      const { mouseController, boundingClient, originMatrix } = this

      // 因为shape的坐标是canvas的默认坐标系下定义的吗，每次定位依据原始状态进行
      // 所以需要使用自定义的最初坐标系矩阵进行每次变换，而不是前一个变换下的矩阵
      const originTransform = new Transform(originMatrix)
      const oldScale = originTransform.getScaler()
      const translation = originTransform.getTranslation()

      // 当前元素最大扩充到可视区域大小的1/2
      let nextScale = Math.min(
        (boundingClient.width * 0.5) / width,
        (boundingClient.height * 0.5) / height
      )
      nextScale = Math.max(Math.min(nextScale, SETTING.maxZoom), SETTING.minZoom)

      // shape原始坐标在当前场景矩阵下的最新坐标值
      const shapePoint = originTransform.point({ x, y })

      // 计算其与坐标系原点的偏移值（translation值就是坐标系原点在当前矩阵下的位置坐标）
      const offsetSize = {
        x: (shapePoint.x - translation.x) / oldScale,
        y: (shapePoint.y - translation.y) / oldScale
      }
      // 移动到可视中心位置的translate
      const centerTranslation = {
        x: -offsetSize.x * nextScale + translation.x,
        y: -offsetSize.y * nextScale + translation.y
      }
      mouseController.panTo(centerTranslation)
      mouseController.zoomTo(nextScale)
    }
    locateShape() {
      const shapes = this.shapes
      // 简单处理：随机定位对应的元素
      const randomIndex = Math.floor(Math.random() * SETTING.shapeCount)
      const shape = shapes[randomIndex || 0]
      const size = shape.radius * 2
      this.transformShapeToCenter({
        x: shape.x,
        y: shape.y,
        width: size,
        height: size
      })
      this.following = false
      this.mouseController.setVisible(true)
    }
    resetScene() {
      this.following = false
      this.robot.reset()
      this.mouseController.setVisible(true)
      this.mouseController.transform = new Transform(this.originMatrix)
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
      this.viewTargetSize = config.viewTargetSize
      this.createThumbElement()
      this.createViewerLayer()
      this.zoomSceneToThumb()
    }
    createThumbElement() {
      const thumbElement = document.createElement('div')
      this.thumbElement = thumbElement
      this.container.appendChild(thumbElement)
    }
    createViewerLayer() {
      const { width, height } = this.viewTargetSize

      this.canvas = new Canvas({
        width,
        height,
        pixel: 1
      })
    }
    zoomSceneToThumb() {
      const { container, viewTargetSize } = this
      const { width, height } = container.getBoundingClientRect()
      const { width: mapWidth, height: mapHeight } = viewTargetSize
      // 计算出鸟瞰图视口大小显示地图场景需要的缩放值
      const zoomToFit = Math.min(width / mapWidth, height / mapHeight)
      // 计算出鸟瞰图剩余空间从而计算出居中偏移量
      const translation = {
        x: (width - mapWidth * zoomToFit) * 0.5,
        y: (height - mapHeight * zoomToFit) * 0.5
      }
      const sizeCssText = `width:${mapWidth}px;height:${mapHeight}px;`
      const transformCssText = `transform-origin:0 0;transform:translate(${translation.x}px,${translation.y}px) scale(${zoomToFit});`
      this.thumbElement.style.cssText = `${sizeCssText}${transformCssText}`
      this.zoomToFit = zoomToFit
    }
    mountCanvas() {
      this.thumbElement.appendChild(this.canvas.domElement)
    }
    destroy() {
      this.container = null
    }
  }

  class ToolManager {
    constructor(tools) {
      this.tools = tools
      this.bindEvents()
    }
    bindEvents() {
      const tools = this.tools
      if (Array.isArray(tools)) {
        tools.forEach((config) => {
          const { element, callback } = config
          element.addEventListener('click', callback)
        })
      }
    }
    destroy() {
      const tools = this.tools
      if (Array.isArray(tools)) {
        tools.forEach((config) => {
          const { element, callback } = config
          element.removeEventListener('click', callback)
        })
      }
      this.tools = null
    }
  }

  class SceneMap {
    constructor(config) {
      this.raf = null
      this.isRenderedViewer = false
      this.createManager(config)
      this.mount()
    }
    createManager(config) {
      const { viewer, container } = config
      const mapManager = new MapManager({
        container
      })
      const mapCanvas = mapManager.canvas
      this.viewManager = new ViewManager({
        container: viewer,
        viewTargetSize: { width: mapCanvas.width, height: mapCanvas.height }
      })
      this.toolManager = new ToolManager([
        {
          element: document.getElementById('follow'),
          callback: () => mapManager.followShape()
        },
        {
          element: document.getElementById('locate'),
          callback: () => mapManager.locateShape()
        },
        {
          element: document.getElementById('reset'),
          callback: () => mapManager.resetScene()
        }
      ])
      this.mapManager = mapManager
    }
    renderView() {
      const { mapManager, viewManager, isRenderedViewer } = this
      if (isRenderedViewer) return
      const { ctx, width, height } = viewManager.canvas
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(mapManager.canvas.domElement, 0, 0)
      this.isRenderedViewer = true
    }
    createRobot(image) {
      this.mapManager.createRobot(image)
    }
    renderFrame() {
      const mapManager = this.mapManager
      const { canvas, mouseController, shapes } = mapManager
      const { ctx: mapContext, width, height } = canvas
      const m = mouseController.transform.matrix

      mapContext.clearRect(0, 0, width, height)
      mapContext.save()
      mapContext.fillStyle = SETTING.mapBackground
      mapContext.fillRect(0, 0, width, height)
      // 镜头跟随机器人运动
      mapManager.startMove()
      // 需要使用transform而不是setTransform，注意二者的区别
      mapContext.transform(m[0], m[1], m[2], m[3], m[4], m[5])
      for (const shape of shapes) {
        shape.render(mapContext)
      }
      mapContext.restore()
      this.renderView()
    }
    renderLoop() {
      this.renderFrame()
      this.raf = window.requestAnimationFrame(this.renderLoop.bind(this))
    }
    mount() {
      const { viewManager, mapManager } = this
      viewManager.mountCanvas()
      mapManager.mountCanvas()
    }
    destroy() {
      this.viewManager.destroy()
      this.mapManager.destroy()
      this.toolManager.destroy()
    }
  }

  const map = new SceneMap({
    container: boxElement,
    viewer: viewElement
  })
  // 异步加载的资源影响鸟瞰图渲染内容的完整性，这里简单处理
  loadImage(robotImage).then((image) => {
    map.createRobot(image)
    map.renderLoop()
  })

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

.view {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 1;
  width: 200px;
  height: 100px;
  background: #909399;
}

.btn-container {
  position: absolute;
  bottom: 120px;
  right: 10px;
  z-index: 1;
  color: #fff;
  margin: 0;
  padding: 0;
  font-size: 12px;
  list-style: none;
}

.btn {
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #909399;
  border-radius: 50%;
  cursor: pointer;
}

.btn + .btn {
  margin-top: 10px;
}
</style>
