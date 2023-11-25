<template>
  <div class="box" ref="boxElementRef">
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)

onMounted(() => {
  let raf = null
  const boxElement = boxElementRef.value
  const boxRect = boxElement.getBoundingClientRect()
  const canvasElement = canvasElementRef.value
  const dpr = window.devicePixelRatio
  canvasElement.width = dpr * boxRect.width
  canvasElement.height = dpr * boxRect.height

  const ctx = canvasElement.getContext('2d')
  ctx.scale(dpr, dpr)
  const circleList = []
  const canvasSize = {
    width: boxRect.width,
    height: boxRect.height
  }

  class Circle {
    constructor(x, y, radius, color) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.dx = Math.random()
      this.dy = Math.random()
    }
    update(data) {
      this.x = data.x
      this.y = data.y
      this.dx = data.dx
      this.dy = data.dy
    }
    render() {
      const { x, y, radius, color } = this
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()
    }
  }

  class Line {
    constructor(start, end) {
      this.start = start
      this.end = end
      this.lineWidth = 1
    }
    render() {
      const { start, end, lineWidth } = this
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
      gradient.addColorStop(0, start.color)
      gradient.addColorStop(1, end.color)
      ctx.strokeStyle = gradient
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      ctx.closePath()
    }
  }

  const initCircleList = () => {
    for (let index = 0; index < 20; index++) {
      const radius = Math.max(Math.random() * 10, 5)
      const halfSize = radius / 2
      let x = Math.random() * canvasSize.width
      let y = Math.random() * canvasSize.height
      x = Math.max(halfSize, Math.min(x, canvasSize.width - halfSize))
      y = Math.max(halfSize, Math.min(y, canvasSize.height - halfSize))
      const color = getRandomColor()
      const circle = new Circle(x, y, radius, color)
      circleList.push(circle)
    }
  }

  const renderFrame = () => {
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
    for (let index = 0, len = circleList.length; index < len; index++) {
      const circle = circleList[index]
      const radius = circle.radius
      const diff = {
        x: circle.x < canvasSize.width - radius && circle.x > radius ? circle.dx : -circle.dx,
        y: circle.y < canvasSize.height - radius && circle.y > radius ? circle.dy : -circle.dy
      }
      const newPosition = {
        x: circle.x + diff.x,
        y: circle.y + diff.y,
        dx: diff.x,
        dy: diff.y
      }
      for (let sIndex = 0; sIndex < len; sIndex++) {
        if (sIndex !== index) {
          const otherCircle = circleList[sIndex]
          const diff = {
            x: circle.x - otherCircle.x,
            y: circle.y - otherCircle.y
          }
          const distance = Math.sqrt(diff.x * diff.x + diff.y * diff.y)
          if (distance <= 600) {
            const start = {
              x: circle.x,
              y: circle.y,
              color: circle.color
            }
            const end = {
              x: otherCircle.x,
              y: otherCircle.y,
              color: otherCircle.color
            }
            const line = new Line(start, end)
            line.render()
          }
        }
      }
      circle.update(newPosition)
      circle.render()
    }

    raf = window.requestAnimationFrame(renderFrame)
  }

  initCircleList()
  renderFrame()

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>
