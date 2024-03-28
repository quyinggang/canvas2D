<template>
  <div class="box" ref="boxElementRef">
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)

onMounted(() => {
  let raf = null
  const boxElement = boxElementRef.value
  const canvasElement = canvasElementRef.value
  const width = boxElement.clientWidth
  const height = boxElement.clientHeight
  const dpr = window.devicePixelRatio
  const canvasWidth = dpr * width
  const canvasHeight = dpr * height
  canvasElement.width = canvasWidth
  canvasElement.height = canvasHeight

  const ctx = canvasElement.getContext('2d')

  const renderClock = () => {
    ctx.save()
    // 移动原点到中心
    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    // rotate是基于左上角原点的而且是旋转画布整体，所以需要使用translate将坐标系原点移动到中心，从而得到新的坐标系，基于新的坐标系进行处理
    // 因为下面刻度都是以水平方向绘制的，所以这里坐标系偏转-90度，变换成12点并以此刻度为基准进行偏移计算
    ctx.rotate(-Math.PI / 2)

    // 对时钟整体放大2倍
    ctx.scale(2, 2)
    const now = new Date()
    const sec = now.getSeconds()
    const min = now.getMinutes()
    let hr = now.getHours()
    hr = hr >= 12 ? hr - 12 : hr

    ctx.save()
    // 绘制时刻度
    ctx.strokeStyle = 'rgb(129, 129, 129)'
    ctx.lineWidth = 2
    for (let index = 0; index < 12; index++) {
      ctx.beginPath()
      ctx.moveTo(60, 0)
      ctx.lineTo(70, 0)
      ctx.stroke()
      ctx.closePath()
      ctx.rotate((2 * Math.PI) / 12)
    }
    ctx.restore()

    ctx.save()
    // 绘制分刻度
    ctx.strokeStyle = 'rgb(172, 172, 172)'
    for (let index = 0; index < 60; index++) {
      if (index % 5 !== 0) {
        ctx.beginPath()
        ctx.moveTo(63, 0)
        ctx.lineTo(70, 0)
        ctx.stroke()
        ctx.closePath()
      }
      ctx.rotate(Math.PI / 30)
    }
    ctx.restore()

    ctx.save()
    // 绘制时针
    ctx.rotate(
      ((2 * Math.PI) / 12) * hr +
        ((2 * Math.PI) / 12 / 60) * min +
        ((2 * Math.PI) / 12 / 60 / 60) * sec
    )
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(36, 0)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()

    ctx.save()
    // 绘制分针
    ctx.rotate(((2 * Math.PI) / 60) * min + ((2 * Math.PI) / 60 / 60) * sec)
    ctx.strokeStyle = 'rgb(156, 156, 156)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-13, 0)
    ctx.lineTo(46, 0)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()

    ctx.save()
    // 绘制秒针
    ctx.rotate(((2 * Math.PI) / 60) * sec)
    ctx.strokeStyle = 'rgb(161, 82, 82)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-16, 0)
    ctx.lineTo(54, 0)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()

    ctx.restore()
  }

  const renderFrame = () => {
    raf = requestAnimationFrame(renderFrame)
    // 绘制每一帧都需要清除前一帧绘制内容
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    renderClock()
  }

  renderFrame()
  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>
