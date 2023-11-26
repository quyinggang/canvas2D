<template>
  <div class="box" ref="boxElementRef">
    <span class="tip">全量渲染1万个图形，请选择图形进行拖动</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor, getNumberInRange } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()

  const shapeMap = new Map()
  const getUniqueColor = () => {
    let isLoop = true
    while (isLoop) {
      const color = getRandomColor()
      if (!shapeMap.has(color)) {
        isLoop = false
        return color
      }
      isLoop = true
    }
  }
  const rgbToHex = (r, g, b) => {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  class Circle {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.color = config.color
      this.radius = config.radius
      this.colorKey = getUniqueColor()
      shapeMap.set(this.colorKey, this)
    }
    update(config) {
      this.x = config.x
      this.y = config.y
    }
    render(ctx, isBuffer) {
      const { radius, color, x, y, colorKey } = this
      ctx.save()
      ctx.fillStyle = isBuffer ? colorKey : color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
      ctx.fill()
      ctx.closePath()
      ctx.restore()
    }
  }

  class Canvas {
    constructor(config) {
      this.domElement = document.createElement('canvas')
      this.ctx = this.domElement.getContext('2d', {
        willReadFrequently: !!config.willReadFrequently
      })
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
      domElement.style.cssText = `position:absolute;top:0;left:0;background:transparent;display:block;width:${styleWidth}px;height:${styleHeight}px;`
    }
  }

  class Scene {
    constructor(config) {
      const { container, width, height } = config
      this.content = container
      this.children = []
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width,
        height
      })
      this.bufferHitCanvas = new Canvas({
        pixel: 1,
        width,
        height,
        willReadFrequently: true
      })
      this.width = width
      this.height = height
      this.mountCanvas()
    }
    mountCanvas() {
      this.content.appendChild(this.canvas.domElement)
    }
    add(shape) {
      this.children.push(shape)
    }
    remove(shape) {
      const children = this.children
      const index = children.findIndex((item) => item === shape)
      if (index !== -1) {
        children.splice(index, 1)
      }
    }
    getSelectedShape(position) {
      const ctx = this.bufferHitCanvas.ctx
      const data = ctx.getImageData(Math.round(position.x), Math.round(position.y), 1, 1).data
      if (data[3] === 255) {
        const hex = rgbToHex(data[0], data[1], data[2])
        const targetColorKey = `#${hex}`.toUpperCase()
        if (shapeMap.has(targetColorKey)) {
          return shapeMap.get(targetColorKey)
        }
      }
    }
    render() {
      const { children, canvas, bufferHitCanvas, width, height } = this
      const { ctx: sceneCtx } = canvas
      const { ctx: hitCtx } = bufferHitCanvas
      sceneCtx.clearRect(0, 0, width, height)
      for (const shape of children) {
        shape.render(sceneCtx)
        shape.render(hitCtx, true)
      }
    }
  }

  const width = boxBounding.width
  const height = boxBounding.height
  const scene = new Scene({
    container: boxElement,
    width,
    height
  })
  for (let index = 0; index < 10000; index++) {
    scene.add(
      new Circle({
        x: getNumberInRange(0, width),
        y: getNumberInRange(0, height),
        radius: 20,
        color: getRandomColor()
      })
    )
  }
  scene.render()

  const dragScene = new Scene({
    container: boxElement,
    width,
    height
  })

  // 拖拽
  let oldPosition = null
  let isDragging = false
  let selectedShape = null

  const handleUp = () => {
    if (isDragging && selectedShape) {
      dragScene.remove(selectedShape)
      dragScene.render()
      scene.add(selectedShape)
      scene.render()
      console.log('---------end------')
      console.log(scene.children.length)
      console.log(dragScene.children.length)
    }
    isDragging = false
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
  }
  const handleMove = (event) => {
    if (!isDragging || !selectedShape) return
    const newPosition = { x: event.pageX - boxBounding.left, y: event.pageY - boxBounding.top }
    const diff = {
      x: newPosition.x - oldPosition.x,
      y: newPosition.y - oldPosition.y
    }
    selectedShape.update({
      x: selectedShape.x + diff.x,
      y: selectedShape.y + diff.y
    })
    dragScene.render()
    oldPosition = newPosition
  }
  boxElement.addEventListener('mousedown', (event) => {
    const { pageX, pageY } = event
    oldPosition = { x: pageX - boxBounding.left, y: pageY - boxBounding.top }
    isDragging = true
    const point = { ...oldPosition }
    const shape = scene.getSelectedShape(point)
    if (shape) {
      // 选中后将要拖拽的图形绘制到拖拽层，之后的拖动都是重绘拖拽层，1万个节点全量渲染会导致拖拽时卡顿，可以通过局部渲染来优化
      selectedShape = shape
      dragScene.add(shape)
      dragScene.render()
      scene.remove(shape)
      scene.render()
      console.log('-----start-------')
      console.log(scene.children.length)
      console.log(dragScene.children.length)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  })
})
</script>

<style scoped>
.box {
  position: relative;
}

.tip {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  user-select: none;
  pointer-events: none;
}
</style>
