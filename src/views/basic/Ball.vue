<template>
  <div class="box" ref="boxElementRef">
    <span v-show="tipVisible" class="tip">请点击查看效果</span>
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const tipVisible = ref(true)
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

  let ball = null
  let speed = null
  let raf = null
  const boundary = {
    minX: 0,
    minY: 0,
    maxX: boxRect.width,
    maxY: boxRect.height
  }

  function Ball(config) {
    this.x = config.x
    this.y = config.y
    this.radius = config.radius || 16
    this.color = config.color || 'red'
  }

  Ball.prototype.changePosition = function (newPosition) {
    this.x = newPosition.x
    this.y = newPosition.y
  }

  Ball.prototype.draw = function () {
    const { x, y, color, radius } = this
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  }

  function renderFrame() {
    // 多层透明度rect覆盖实现拖尾效果，透明度大小实现拖尾效果长短
    ctx.fillStyle = 'rgba(0, 0, 0,0.4)'
    ctx.fillRect(boundary.minX, boundary.minY, boundary.maxX, boundary.maxY)
    const radius = ball.radius
    const newPosition = {
      x: ball.x + speed.x,
      y: ball.y + speed.y
    }
    // 减少垂直方向的速度，让动作更真实
    speed.y *= 0.99
    speed.y += 0.25
    // 边界碰撞反弹
    if (newPosition.x > boundary.maxX - radius || newPosition.x < boundary.minX + radius) {
      speed.x = -speed.x
    }
    if (newPosition.y > boundary.maxY - radius || newPosition.y < boundary.minY + radius) {
      speed.y = -speed.y
    }
    ball.changePosition(newPosition)
    ball.draw()
    raf = window.requestAnimationFrame(renderFrame)
  }

  canvasElement.addEventListener('click', (event) => {
    tipVisible.value = false
    ctx.clearRect(boundary.minX, boundary.minY, boundary.maxX, boundary.maxY)
    raf && window.cancelAnimationFrame(raf)
    ball = new Ball({ x: event.clientX - boxRect.left, y: event.clientY - boxRect.top })
    speed = {
      x: 5,
      y: 2
    }
    renderFrame()
  })

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>

<style scoped>

.box {
  position: relative;
}

.tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  z-index: 0;
  user-select: none;
  pointer-events: none;
}
</style>
