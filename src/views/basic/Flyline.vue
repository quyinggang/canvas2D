<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  let raf = null

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

  class Line {
    constructor(start, end, color) {
      this.start = start
      this.end = end
      this.color = color
    }
    render(ctx) {
      const { start, end, color } = this
      ctx.save()
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.strokeStyle = color
      ctx.shadowColor = 'rgba(255, 0, 255, 1)'
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
  }

  class Curve {
    constructor(points, color) {
      this.points = points
      this.color = color
    }
    render(ctx) {
      const { points, color } = this
      const [start, ...other] = points
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineWidth = 3
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      for (const point of other) {
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
  }

  class Scene {
    constructor(config) {
      this.container = config.container
      const bounding = this.container.getBoundingClientRect()
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width: bounding.width,
        height: bounding.height
      })
      this.bounding = bounding
      this.straightStartT = 0
      this.straightEndT = 0
      this.straightLine = this.getStraightPath()
      this.bezierStartT = 0
      this.bezierEndT = 0
      this.bezierPath = this.getBezierPath()
      this.mountCanvas()
    }
    mountCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    createGradient(p0, p1) {
      const ctx = this.canvas.ctx
      const gradient = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y)
      gradient.addColorStop(0, 'rgba(255, 0, 255, 0)')
      gradient.addColorStop(1, 'rgba(255, 0, 255, 1)')
      return gradient
    }
    computeLinePoint(start, end, t) {
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      }
    }
    getStraightPath() {
      const { width, height } = this.bounding
      const offset = 0
      const start = {
        x: offset,
        y: offset
      }
      const end = {
        x: width - offset,
        y: height / 2
      }
      return { start, end }
    }
    renderStraightLine() {
      const { bounding, straightLine } = this
      const { start, end } = straightLine
      const ctx = this.canvas.ctx
      if (this.straightEndT < 0.1) {
        this.straightStartT = 0
      }
      ctx.clearRect(0, 0, bounding.width, bounding.height)
      const startPoint = this.computeLinePoint(start, end, this.straightStartT)
      const endPoint = this.computeLinePoint(start, end, this.straightEndT)
      const color = this.createGradient(startPoint, endPoint)
      const line = new Line(startPoint, endPoint, color)
      line.render(ctx)
      this.straightStartT += 0.005
      this.straightEndT += 0.005
      if (this.straightStartT > 1 && this.straightEndT > 1) {
        this.straightStartT = 0
        this.straightEndT = 0
      }
      raf = window.requestAnimationFrame(this.renderStraightLine.bind(this))
    }
    computeBezier2Point(start, end, control, t) {
      return {
        x: (1 - t) * (1 - t) * start.x + 2 * t * (1 - t) * control.x + t * t * end.x,
        y: (1 - t) * (1 - t) * start.y + 2 * t * (1 - t) * control.y + t * t * end.y
      }
    }
    getBezierPath() {
      const { width, height } = this.bounding
      return {
        start: {
          x: 0,
          y: height / 2
        },
        end: {
          x: width,
          y: height / 2
        },
        control: {
          x: width / 2,
          y: height / 2 - 200
        }
      }
    }
    renderBezier() {
      const { bezierPath, bounding } = this
      const ctx = this.canvas.ctx
      const { start, end, control } = bezierPath
      const points = []
      if (this.bezierEndT < 0.15) {
        this.bezierStartT = 0
      }
      const step = (this.bezierEndT - this.straightStartT) / 20 || 0.005
      for (let t = this.bezierStartT; t < this.bezierEndT; t += step) {
        const point = this.computeBezier2Point(start, end, control, t)
        points.push(point)
      }
      points.push(this.computeBezier2Point(start, end, control, this.bezierEndT))

      ctx.clearRect(0, 0, bounding.width, bounding.height)
      const color = this.createGradient(points[0], points[points.length - 1])
      const curve = new Curve(points, color)
      curve.render(ctx)
      this.bezierStartT += 0.005
      this.bezierEndT += 0.005
      if (this.bezierStartT > 1 && this.bezierEndT > 1) {
        this.bezierStartT = 0
        this.bezierEndT = 0
      }
      raf = window.requestAnimationFrame(this.renderBezier.bind(this))
    }
  }

  const scene = new Scene({ container: boxElement })
  scene.renderStraightLine()
  // scene.renderBezier()

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>
