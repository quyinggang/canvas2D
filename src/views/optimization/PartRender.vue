<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
      this.radius = radius
      this.color = color
      this.update(x, y)
    }
    update(x, y) {
      this.x = x
      this.y = y
      this.enclosureBox = this.computeEnclosureBox()
    }
    // 包围盒
    computeEnclosureBox() {
      const { x, y, radius } = this
      return {
        minX: x - radius,
        minY: y - radius,
        maxX: x + radius,
        maxY: y + radius
      }
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
      const { container, usePartRender } = config
      const bounding = container.getBoundingClientRect()
      this.container = container
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width: bounding.width,
        height: bounding.height
      })
      this.bounding = bounding
      this.offset = 20
      this.raf = null
      this.usePartRender = !!usePartRender
      this.circles = this.createCircles()
      this.mountCanvas()
      this.globalRender()
    }
    mountCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    createCircles() {
      const { bounding, offset } = this
      const { width, height } = bounding
      const circles = []
      for (let index = 0; index < 10000; index++) {
        const x = getNumberInRange(offset, width - offset)
        const y = getNumberInRange(offset, height - offset)
        const radius = getNumberInRange(10, 20)
        const color = getRandomColor()
        circles.push(new Circle(x, y, radius, color))
      }
      return circles
    }
    renderCircles() {
      const { canvas, circles } = this
      const ctx = canvas.ctx
      for (const circle of circles) {
        circle.render(ctx)
      }
    }
    globalRender() {
      const ctx = this.canvas.ctx
      const { width, height } = this.bounding
      ctx.clearRect(0, 0, width, height)
      this.renderCircles()
    }
    partRender() {
      const needRerenderCircles = []
      const { dirtyRect, circles } = this
      const ctx = this.canvas.ctx
      const { width, height } = this.bounding
      if (width - dirtyRect.width <= 50 && height - dirtyRect.height <= 50) {
        this.globalRender()
        return
      }
      for (const circle of circles) {
        const box = circle.enclosureBox
        if (this.checkIsIntersect(dirtyRect, box)) {
          needRerenderCircles.push(circle)
        }
      }
      const { x: rx, y: ry, width: rw, height: rh } = dirtyRect
      ctx.clearRect(rx, ry, rw, rh)
      ctx.save()
      ctx.beginPath()
      ctx.rect(rx, ry, rw, rh)
      ctx.clip()
      for (const circle of needRerenderCircles) {
        circle.render(ctx)
      }
      ctx.restore()
    }
    // 计算是否与脏矩形相交
    checkIsIntersect(dirtyRect, box) {
      const boxSize = {
        width: box.maxX - box.minX,
        height: box.maxY - box.minY
      }
      const boxCenter = {
        x: box.minX + boxSize.width / 2,
        y: box.minY + boxSize.height / 2
      }
      const dirtyRectCenter = {
        x: dirtyRect.x + dirtyRect.width / 2,
        y: dirtyRect.y + dirtyRect.height / 2
      }
      const diffX = Math.abs(dirtyRectCenter.x - boxCenter.x)
      const diffY = Math.abs(dirtyRectCenter.y - boxCenter.y)
      return (
        diffX <= (boxSize.width + dirtyRect.width) / 2 &&
        diffY <= (boxSize.height + dirtyRect.height) / 2
      )
    }
    // 计算脏矩形区域
    computeDirtyRect(oldBox, newBox) {
      const minX = Math.min(oldBox.minX, newBox.minX)
      const minY = Math.min(oldBox.minY, newBox.minY)
      const maxX = Math.max(oldBox.maxX, newBox.maxX)
      const maxY = Math.max(oldBox.maxY, newBox.maxY)
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    }
    update() {
      const { circles, offset, usePartRender } = this
      const { width, height } = this.bounding
      const index = getNumberInRange(0, circles.length - 1)
      const x = getNumberInRange(offset, width - offset)
      const y = getNumberInRange(offset, height - offset)
      const circle = circles[index]
      const oldBox = circle.enclosureBox
      circle.update(x, y)
      if (usePartRender) {
        this.dirtyRect = this.computeDirtyRect(oldBox, circle.enclosureBox)
      }
    }
    animate() {
      this.update()
      this.usePartRender ? this.partRender() : this.globalRender()
      this.raf = window.requestAnimationFrame(this.animate.bind(this))
    }
    destroy() {
      window.cancelAnimationFrame(this.raf)
    }
  }

  // 一万个圆点，不开启大约在15fps, 开启局部渲染后fps可以提高到48左右
  const scene = new Scene({ container: boxElement, usePartRender: true })
  scene.animate()

  onBeforeUnmount(() => scene.destroy())
})
</script>

<style scoped>
.box {
  position: relative;
}

.tip {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  z-index: 0;
  user-select: none;
  pointer-events: none;
}
</style>
