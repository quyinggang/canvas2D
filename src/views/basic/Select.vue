<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()

  const shapeMap = new Map()
  const getUniqueColor = () => {
    while (true) {
      const color = getRandomColor()
      if (!shapeMap.has(color)) {
        return color
      }
    }
  }
  const rgbToHex = (r, g, b) => {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  class Circle {
    constructor(config) {
      this.id = config.id
      this.x = config.x
      this.y = config.y
      this.color = config.color
      this.radius = config.radius
      this.colorKey = getUniqueColor()
      shapeMap.set(this.colorKey, this)
    }
    render(ctx, isBuffer) {
      const { radius, color, x, y, colorKey, id } = this
      ctx.save()
      ctx.fillStyle = isBuffer ? colorKey : color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
      ctx.fill()

      if (!isBuffer) {
        ctx.fillStyle = '#fff'
        ctx.font = '20px Georgia'
        ctx.fillText(id, x, y)
      }
      ctx.closePath()
      ctx.restore()
    }
  }

  class Rect {
    constructor(config) {
      this.id = config.id
      this.x = config.x
      this.y = config.y
      this.color = config.color
      this.width = config.width
      this.height = config.height
      this.colorKey = getUniqueColor()
      shapeMap.set(this.colorKey, this)
    }
    render(ctx, isBuffer = false) {
      const { color, x, y, width, height, colorKey, id } = this
      ctx.save()
      ctx.fillStyle = isBuffer ? colorKey : color
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.fill()

      if (!isBuffer) {
        ctx.fillStyle = '#fff'
        ctx.font = '20px Georgia'
        ctx.fillText(id, x + width / 3, y + height / 3)
      }
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
      domElement.style.cssText = `width:${styleWidth}px;height:${styleHeight}px;`
    }
  }

  class Scene {
    constructor(config) {
      const { width, height, container } = config
      this.content = container
      this.width = width
      this.height = height
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
      this.mountCanvas()
    }
    mountCanvas() {
      this.content.appendChild(this.canvas.domElement)
    }
    add(shape) {
      this.children.push(shape)
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
      const { children, canvas, bufferHitCanvas } = this
      const { ctx: sceneCtx } = canvas
      const { ctx: hitCtx } = bufferHitCanvas
      sceneCtx.clearRect(0, 0, this.width, this.height)
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

  let id = 0
  for (let index = 0; index < 10; index++) {
    id += 1
    const rect = new Rect({
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      width: 60,
      height: 60,
      color: getRandomColor()
    })
    id += 1
    const circle = new Circle({
      id,
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 30,
      color: getRandomColor()
    })
    scene.add(circle)
    scene.add(rect)
  }
  scene.render()

  boxElement.addEventListener('click', (event) => {
    const point = {
      x: event.pageX - boxBounding.left,
      y: event.pageY - boxBounding.top
    }
    /* 
          - 色值法：增加额外的离屏缓冲区并绘制图形fill作为key的颜色，使用getImageData获取颜色值实现
          - 几何计算法：通过包围盒或者射线法进行判断运算实现
          - isPointInPoint原生方案：重新绘制图形然后调用isPointInPath实现
        */
    const shape = scene.getSelectedShape(point)
    const text = shape ? `选中的图形ID是：${shape.id}` : '没有选中图形'
    alert(text)
  })
})
</script>
