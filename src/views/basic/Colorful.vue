<template>
  <div class="box" ref="boxElementRef">
    <span class="tip">拖动鼠标查看效果</span>
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxRect = boxElement.getBoundingClientRect()
  const canvasElement = canvasElementRef.value
  const dpr = window.devicePixelRatio
  canvasElement.width = dpr * boxRect.width
  canvasElement.height = dpr * boxRect.height

  const ctx = canvasElement.getContext('2d')
  ctx.scale(dpr, dpr)

  let raf = null
  const circleList = []
  const clearRect = () => ctx.clearRect(0, 0, boxRect.width, boxRect.height)

  function Circle(x, y, radius, color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    // 实现散乱小球
    this.dx = Math.random() * 12 - 7
    this.dy = Math.random() * 12 - 7
    circleList.push(this)
  }

  Circle.prototype.render = function () {
    const { x, y, color, radius } = this
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }
  Circle.prototype.update = function () {
    this.x += this.dx
    this.y += this.dy
    this.radius = parseFloat((this.radius - 0.8).toFixed(2))
    if (this.radius <= 0) {
      for (let index = 0, len = circleList.length; index < len; index++) {
        if (circleList[index] === this) {
          circleList.splice(index, 1)
        }
      }
    }
  }

  const renderFrame = () => {
    clearRect()
    circleList.forEach((item) => {
      item.update()
      item.render()
    })
    raf = window.requestAnimationFrame(renderFrame)
  }

  canvasElement.onmouseleave = () => {
    clearRect()
    raf && window.cancelAnimationFrame(raf)
  }
  canvasElement.onmouseover = () => {
    renderFrame()
  }
  canvasElement.onmousemove = (event) => {
    new Circle(event.pageX - boxRect.left, event.pageY - boxRect.top, 20, getRandomColor())
  }

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>

<style scoped>
.box {
  position: relative;
}

.tip {
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  user-select: none;
  pointer-events: none;
}
</style>
