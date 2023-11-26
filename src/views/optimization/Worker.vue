<template>
  <div class="box" ref="boxElementRef">
    <canvas class="canvas" ref="canvas1Ref"></canvas>
    <canvas class="canvas" ref="canvas2Ref"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import UserWorker from '@/utils/worker.js?worker'

const boxElementRef = ref(null)
const canvas1Ref = ref(null)
const canvas2Ref = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()
  const canvas1 = canvas1Ref.value
  const dpr = window.devicePixelRatio
  const canvasWidth = dpr * boxBounding.width
  const canvasHeight = dpr * boxBounding.height * 0.5
  canvas1.width = canvasWidth
  canvas1.height = canvasHeight
  const canvas2 = canvas2Ref.value
  canvas2.width = canvasWidth
  canvas2.height = canvasHeight

  // Offscreen创建方式一：将控制权交给worker内部处理，绘制的内容会自动同步在canvas上显示，无需手动同步
  if (canvas1.transferControlToOffscreen) {
    const offscreen = canvas1.transferControlToOffscreen()
    const worker = new UserWorker()
    worker.postMessage({ canvas: offscreen }, [offscreen])
  }

  // Offscreen创建方式二：使用OffscreenCanvas构造函数创建，需要将其主动同步到canvas上显示
  if (canvas1.transferControlToOffscreen) {
    const ctx = canvas2.getContext('2d')
    const worker = new UserWorker()
    worker.postMessage({ type: 'init', size: { width: canvasWidth, height: canvasHeight } })
    worker.onmessage = (evt) => {
      ctx.drawImage(evt.data.imageBitmap, 0, 0)
    }

    // 主线程创建其他图形
    ctx.save()
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.rect(100, 100, 200, 200)
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }
})
</script>

<style scoped>
.canvas {
  width: 100%;
  height: 49%;
  margin: 0;
}
</style>
