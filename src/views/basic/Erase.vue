<template>
  <div class="box" ref="boxElementRef">
    <span class="tip">请拖动鼠标查看效果</span>
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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

  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, boxRect.width, boxRect.height)
  ctx.globalCompositeOperation = 'destination-out'

  let isDraw = false
  canvasElement.onmousedown = () => (isDraw = true)
  canvasElement.onmouseup = () => (isDraw = false)
  canvasElement.onmousemove = (event) => {
    if (!isDraw) return
    const x = event.pageX - boxRect.left
    const y = event.pageY - boxRect.top

    ctx.moveTo(x, y)
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.fill()
  }
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
