<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor, getNumberInRange } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value

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
    constructor(x, y, radius, color) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
    }
    update(x, y) {
      this.x = x
      this.y = y
    }
    render(ctx) {
      const { x, y, radius, color } = this
      ctx.save()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
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
      this.selectedCircle = null
      this.isDragging = false
      this.oldPosition = null
      this.circles = this.createCircles()
      this.bindEvents()
      this.moundCanvas()
    }
    moundCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    createCircles() {
      const { width, height } = this.bounding
      const xRange = [50, width - 50]
      const yRange = [50, height - 50]
      const radius = 30
      const circles = []
      for (let index = 0; index < 10; index++) {
        const circle = new Circle(
          getNumberInRange(xRange[0], xRange[1]),
          getNumberInRange(yRange[0], yRange[1]),
          radius,
          getRandomColor()
        )
        circles.push(circle)
      }
      return circles
    }
    isPointInCircle(shape, point) {
      const diff = {
        x: point.x - shape.x,
        y: point.y - shape.y
      }
      const distance = Math.sqrt(diff.x * diff.x + diff.y * diff.y)
      return distance >= 0 && distance <= shape.radius
    }
    getSelectedCircle(position) {
      let selectedCircle = null
      const circles = this.circles
      for (const circle of circles) {
        if (this.isPointInCircle(circle, position)) {
          selectedCircle = circle
          break
        }
      }
      return selectedCircle
    }
    bindEvents() {
      const canvasElement = this.canvas.domElement
      canvasElement.addEventListener('mousedown', this.onMouseDown.bind(this))
      canvasElement.addEventListener('mousemove', this.onMouseMove.bind(this))
      canvasElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    }
    onMouseDown(event) {
      const bounding = this.bounding
      const position = {
        x: event.pageX - bounding.left,
        y: event.pageY - bounding.top
      }
      this.isDragging = true
      this.oldPosition = position
      // 两个图形重叠情况需要额外逻辑
      this.selectedCircle = this.getSelectedCircle(position)
    }
    onMouseMove(event) {
      const { isDragging, selectedCircle, circles, oldPosition, bounding } = this
      if (!isDragging || !selectedCircle) return
      const newPosition = {
        x: event.pageX - bounding.left,
        y: event.pageY - bounding.top
      }
      const diff = {
        x: newPosition.x - oldPosition.x,
        y: newPosition.y - oldPosition.y
      }
      for (const circle of circles) {
        if (circle === selectedCircle) {
          const position = {
            x: circle.x + diff.x,
            y: circle.y + diff.y
          }
          circle.update(position.x, position.y)
          break
        }
      }
      this.oldPosition = newPosition
      this.renderFrame()
    }
    onMouseUp() {
      this.isDragging = false
      this.selectedCircle = null
    }
    renderFrame() {
      const { canvas, circles, bounding } = this
      const ctx = canvas.ctx
      ctx.clearRect(0, 0, bounding.width, bounding.height)
      for (const circle of circles) {
        circle.render(ctx)
      }
    }
  }

  const scene = new Scene({
    container: boxElement
  })
  scene.renderFrame()
})
</script>
