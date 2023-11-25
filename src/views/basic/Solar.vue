<template>
  <div class="box" ref="boxElementRef">
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { loadImage } from '@/utils'
import sunAssets from '@/assets/sun.png'
import moonAssets from '@/assets/moon.png'
import earthAssets from '@/assets/earth.png'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)

onMounted(() => {
  let raf = null
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()
  const canvasElement = canvasElementRef.value
  const dpr = window.devicePixelRatio
  canvasElement.width = dpr * boxBounding.width
  canvasElement.height = dpr * boxBounding.height

  const ctx = canvasElement.getContext('2d')
  ctx.scale(dpr, dpr)

  const imageMap = new Map()
  const radius = 200
  const center = {
    x: boxBounding.width / 2,
    y : boxBounding.height / 2
  }

  const renderFrame = () => {
    const time = new Date()

    ctx.save()
    ctx.translate(center.x, center.y)

    ctx.save()
    ctx.strokeStyle = 'rgba(0,153,255,0.4)'
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()

    ctx.save()
    ctx.rotate(
      ((2 * Math.PI) / 60) * time.getSeconds() + ((2 * Math.PI) / 60000) * time.getMilliseconds()
    )
    ctx.drawImage(imageMap.get('earth'), radius - 25, 0, 50, 50)

    ctx.translate(radius, 25)
    ctx.rotate(
      ((2 * Math.PI) / 6) * time.getSeconds() + ((2 * Math.PI) / 6000) * time.getMilliseconds()
    )
    ctx.drawImage(imageMap.get('moon'), 40, 0, 10, 10)
    ctx.restore()

    ctx.drawImage(imageMap.get('sun'), -50, -50, 100, 100)

    ctx.restore()
  }

  const render = () => {
    raf = requestAnimationFrame(render)
    ctx.clearRect(0, 0, boxBounding.width, boxBounding.height)
    renderFrame()
  }

  const init = async () => {
    const [sunImage, moonImage, earthImage] = await Promise.all([
      loadImage(sunAssets),
      loadImage(moonAssets),
      loadImage(earthAssets)
    ])
    imageMap.set('sun', sunImage)
    imageMap.set('moon', moonImage)
    imageMap.set('earth', earthImage)
    render()
  }

  init()

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(raf)
  })
})
</script>

<style scoped>
.box {
  background: #000;
}
</style>
