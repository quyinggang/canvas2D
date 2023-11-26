<template>
  <div class="box">
    <div class="center" ref="boxElementRef">
      <canvas class="canvas" ref="imageCanvasRef"></canvas>
      <canvas class="canvas-block" ref="blockCanvasRef"></canvas>
      <div id="swiper-container" class="swiper-container">
        <span>向右滑动完成验证</span>
        <div id="state" class="verify--state"></div>
        <div id="swiper" class="swiper">→</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadImage } from '@/utils'
import swiperAssets from '@/assets/swiper.jpeg'

const boxElementRef = ref(null)
const imageCanvasRef = ref(null)
const blockCanvasRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()
  const imageCanvas = imageCanvasRef.value
  const dpr = window.devicePixelRatio
  imageCanvas.width = dpr * boxBounding.width
  imageCanvas.height = dpr * boxBounding.height
  const blockCanvas = blockCanvasRef.value
  blockCanvas.width = 42
  blockCanvas.height = dpr * boxBounding.height

  const ctx = imageCanvas.getContext('2d')
  const blockCtx = blockCanvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const swiperElement = document.getElementById('swiper')
  const containerElement = document.getElementById('swiper-container')
  const stateElement = document.getElementById('state')
  containerElement.style.cssText = `width:${boxBounding.width}px;`

  let isDragging = false
  let startX = 0
  let oldTranslateX = 0
  let currentTranslateX = 0
  let codePositionX = 0
  const width = boxBounding.width
  const height = boxBounding.height
  const blockSize = 40
  const activeStateClass = 'state--active'
  const successStateClass = 'state--success'
  const errorStateClass = 'state--error'
  const swiperWidth = swiperElement.clientWidth
  const updateSliderPosition = (newTranslateX) => {
    swiperElement.style.transform = `translate(${newTranslateX}px, 0)`
  }
  const updateBlockPosition = (newTranslateX) => {
    blockCanvas.style.transform = `translate(${newTranslateX}px, 0)`
  }
  const updateStateStyle = (width) => {
    stateElement.style.width = `${width}px`
  }
  const addClass = (element, className) => {
    element.classList.add(className)
  }
  const removeClass = (element, classNameList) => {
    const classList = element.classList
    const list = Array.isArray(classNameList) ? classNameList : [classNameList]
    list.forEach((className) => classList.remove(className))
  }
  const getRandomNumberByRange = (start, end) => {
    return Math.round(Math.random() * (end - start) + start)
  }
  const drawPath = (context, x = 0, y = 0, type = 'clip') => {
    context.strokeStyle = '#fff'
    context.fillStyle = '#fff'
    context.lineWidth = 1
    context.beginPath()
    context.rect(x, y, blockSize, blockSize)
    context.stroke()
    type === 'clip' ? context.clip() : context.fill()
    context.closePath()
  }

  const handleVerify = () => {
    return Math.abs(currentTranslateX - codePositionX) < 10
  }

  const handleMove = (event) => {
    if (!isDragging) return
    const newTransformX = event.pageX - boxBounding.left - startX + oldTranslateX
    if (newTransformX < 0 || newTransformX > width - swiperWidth) {
      return
    }
    currentTranslateX = newTransformX
    // 更新匹配状态
    addClass(containerElement, activeStateClass)
    // 更新底部slider
    updateSliderPosition(newTransformX)
    // 底部拖拽与滑块block同步原理是设置滑块Canvas的偏移量
    updateBlockPosition(((width - blockSize - 2) / (width - blockSize)) * newTransformX)
    updateStateStyle(newTransformX)
  }
  const handleUp = () => {
    isDragging = false
    const state = handleVerify()
    removeClass(containerElement, activeStateClass)
    addClass(containerElement, state ? successStateClass : errorStateClass)
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
  }

  loadImage(swiperAssets).then((image) => {
    // 随机获取缺失部分的坐标
    const x = getRandomNumberByRange(width / 2, width - blockSize + blockSize / 4)
    const y = getRandomNumberByRange(blockSize, height - blockSize - blockSize / 5)
    codePositionX = x
    ctx.drawImage(image, 0, 0, boxBounding.width, boxBounding.height)
    // 绘制图片中缺失图形
    drawPath(ctx, x, y, 'fill')
    drawPath(blockCtx, 1, y)
    // 绘制缺失部分图形对应像素图片
    const imageData = ctx.getImageData(x, y, blockSize, blockSize)
    // 填充对应图像到滑块中
    blockCtx.putImageData(imageData, 1, y)

    swiperElement.onmousedown = (event) => {
      isDragging = true
      startX = event.pageX - boxBounding.left
      oldTranslateX = currentTranslateX
      removeClass(containerElement, [activeStateClass, errorStateClass, successStateClass])
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    }
  })
})
</script>

<style scoped>
.box {
  display: flex;
  justify-content: center;
  align-items: center;
}
.center {
  position: relative;
  width: 40%;
  height: 40%;
}

.canvas-block {
  position: absolute;
  top: 0;
  left: 0;
}
.swiper-container {
  position: relative;
  margin: 0;
  height: 40px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 16px;
  text-align: center;
  line-height: 40px;
  border: 1px solid #e4e7eb;
}
.swiper {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  font-size: 20px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.3);
  text-align: center;
  line-height: 40px;
  box-shadow: 0 0 3px rgb(0 0 0 / 30%);
  background: #fff;
  cursor: grab;
  user-select: none;
  transition: background-color 0.2s linear;
}
.verify--state {
  position: absolute;
  top: 0;
  left: 0;
  height: 38px;
}
.swiper:hover {
  background: #1991fa;
}
.state--error .swiper {
  background: #f57a7a;
}
.state--success .swiper {
  background: #52ccba;
}
.state--active .verify--state {
  border: 1px solid #1991fa;
  background-color: #d1e9fe;
}
.state--error .verify--state {
  border: 1px solid #f57a7a;
  background-color: #fce1e1;
}
.state--success .verify--state {
  border: 1px solid #52ccba;
  background-color: #d2f4ef;
}
</style>
