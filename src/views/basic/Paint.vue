<template>
  <div class="box" ref="boxElementRef">
    <div class="group">
      <button @click.stop="handleBold">粗线条</button>
      <button @click.stop="handleTiny">细线条</button>
      <button @click.stop="handleSave">保存签名</button>
      <input type="color" @change="handleChange" />
      <button @click="handleErase">橡皮擦</button>
      <button @click.stop="handleClear">清空画布</button>
    </div>
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)
let handleBold = () => {}
let handleChange = () => {}
let handleClear = () => {}
let handleTiny = () => {}
let handleSave = () => {}
let handleErase = () => {}

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()
  const canvasElement = canvasElementRef.value
  const dpr = window.devicePixelRatio
  canvasElement.width = dpr * boxBounding.width
  canvasElement.height = dpr * boxBounding.height

  const ctx = canvasElement.getContext('2d')
  ctx.scale(dpr, dpr)

  let isDrawing = false

  handleChange = (event) => {
    const color = event.target.value || '#000'
    ctx.strokeStyle = color
  }
  handleBold = () => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = 5
  }
  handleTiny = () => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = 1
  }
  handleErase = () => {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = 30
  }
  handleClear = () => {
    ctx.clearRect(0, 0, boxBounding.width, boxBounding.height)
  }
  handleSave = () => {
    const url = canvasElement.toDataURL()
    let link = document.createElement('a')
    link.href = url
    link.download = `签名-${Date.now()}.png`
    link.click()
    link = null
  }

  canvasElement.onmousedown = (event) => {
    isDrawing = true
    const x = event.pageX - boxBounding.left
    const y = event.pageY - boxBounding.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  canvasElement.onmousemove = (event) => {
    if (!isDrawing) return
    const x = event.pageX - boxBounding.left
    const y = event.pageY - boxBounding.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  canvasElement.onmouseup = () => {
    isDrawing = false
    ctx.closePath()
  }
  canvasElement.onmouseleave = () => {
    isDrawing = false
    ctx.closePath()
  }
})
</script>

<style scoped>
.box {
  position: relative;
}

.group {
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
  display: flex;
  align-items: center;
}
</style>
