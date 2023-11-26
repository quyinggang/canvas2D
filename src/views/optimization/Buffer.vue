<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getNumberInRange } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value

  class BufferCanvas {
    constructor(radius) {
      this.radius = radius
      this.width = radius * 2 + 2
      this.height = radius * 2 + 2
      this.canvas = this.createCanvas()
      this.ctx = this.canvas.getContext('2d')
      this.cache()
    }
    createCanvas() {
      const { width, height } = this
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      return canvas
    }
    cache() {
      const { ctx, radius } = this
      ctx.save()
      ctx.beginPath()
      ctx.arc(radius + 1, radius + 1, radius, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
    render(ctx, circle) {
      ctx.drawImage(this.canvas, circle.x, circle.y)
    }
  }

  class Circle {
    constructor(x, y, vx, vy, radius) {
      this.x = x
      this.y = y
      this.vx = vx
      this.vy = vy
      this.radius = radius
    }
    update(boundary) {
      const { x, y, vx, vy, radius } = this
      const newPosition = {
        x: x + vx,
        y: y + vy
      }
      if (newPosition.x > boundary.maxX - radius * 2 || newPosition.x < boundary.minX) {
        this.vx = -vx
      }
      if (newPosition.y > boundary.maxY - radius * 2 || newPosition.y < boundary.minY) {
        this.vy = -vy
      }
      this.x = newPosition.x
      this.y = newPosition.y
    }
    render(ctx) {
      const { radius, x, y } = this
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
  }

  class Scene {
    constructor(root, useCache) {
      this.rootElement = root
      this.useCache = !!useCache
      this.shapeMap = null
      this.raf = null
      this.circles = []
      this.circleRadius = 20
      if (this.useCache) {
        this.bufferCanvas = new BufferCanvas(this.circleRadius)
      }
      const canvas = document.createElement('canvas')
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
      this.rootElement.appendChild(canvas)
      this.updateCanvasSize()
    }
    getCanvasSize() {
      const rootElement = this.rootElement
      const width = rootElement.clientWidth
      const height = rootElement.clientHeight
      const dpr = window.devicePixelRatio
      return {
        width,
        height,
        dprWidth: width * dpr,
        dprHeight: height * dpr
      }
    }
    updateCanvasSize() {
      const canvas = this.canvas
      const { width, height, dprWidth, dprHeight } = this.getCanvasSize()
      this.width = dprWidth
      this.height = dprHeight
      this.boundary = {
        minX: 0,
        minY: 0,
        maxX: dprWidth,
        maxY: dprHeight
      }

      canvas.width = dprWidth
      canvas.height = dprHeight
      canvas.style.cssText = `width:${width}px;height:${height}px;`
      this.createCircles()
    }
    createCircles() {
      const { width, height, circleRadius } = this
      const circles = []
      const offset = circleRadius
      for (let index = 0; index < 10000; index++) {
        const x = getNumberInRange(offset, width - offset * 2)
        const y = getNumberInRange(offset, height - offset * 2)
        const vx = getNumberInRange(-2, 2)
        const vy = getNumberInRange(-2, 2)
        circles.push(new Circle(x, y, vx, vy, circleRadius))
      }
      this.circles = circles
    }
    render() {
      const { ctx, width, height, circles, boundary, bufferCanvas, useCache } = this
      ctx.clearRect(0, 0, width, height)
      for (const circle of circles) {
        circle.update(boundary)
        if (useCache) {
          // 将缓存图形绘制到场景中
          bufferCanvas.render(ctx, circle)
        } else {
          circle.render(ctx)
        }
      }
      this.raf = window.requestAnimationFrame(this.render.bind(this))
    }
    destroy() {
      window.cancelAnimationFrame(this.raf)
    }
  }

  const scene = new Scene(boxElement, true)
  scene.render()

  onBeforeUnmount(() => scene.destroy())
})
</script>
