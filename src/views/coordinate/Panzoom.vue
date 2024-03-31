<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()

  class Transform {
    constructor() {
      this.matrix = [1, 0, 0, 1, 0, 0]
    }
    updateMatrix(matrix) {
      this.matrix = matrix
    }
    // 矩阵乘法
    multiply(matrix) {
      const m = this.matrix
      const m11 = m[0] * matrix[0] + m[2] * matrix[1]
      const m12 = m[1] * matrix[0] + m[3] * matrix[1]
      const m21 = m[0] * matrix[2] + m[2] * matrix[3]
      const m22 = m[1] * matrix[2] + m[3] * matrix[3]
      const dx = m[0] * matrix[4] + m[2] * matrix[5] + m[4]
      const dy = m[1] * matrix[4] + m[3] * matrix[5] + m[5]
      m[0] = m11
      m[1] = m12
      m[2] = m21
      m[3] = m22
      m[4] = dx
      m[5] = dy
    }
  }

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
    constructor(config) {
      this.color = config.color
      this.radius = config.radius
      this.transform = new Transform()
      this.changeTransform(config)
    }
    changeTransform(config) {
      this.transform.updateMatrix([1, 0, 0, 1, config.x, config.y])
    }
    render(ctx) {
      const { radius, color } = this
      ctx.fillStyle = color
      ctx.beginPath()
      // 从0,0点开始绘制，是因为在绘制前会将canvas原点移动到当前图形的x,y位置
      ctx.arc(0, 0, radius, 0, 2 * Math.PI, false)
      ctx.fill()
      ctx.closePath()
    }
  }

  class Scene {
    constructor(config) {
      const { width, height, container } = config
      this.content = container
      this.width = width
      this.height = height
      this.transform = new Transform()
      this.children = []
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width,
        height
      })
      this.mountCanvas()
    }
    mountCanvas() {
      this.content.appendChild(this.canvas.domElement)
    }
    changeTransform(config) {
      this.transform.updateMatrix([
        config.scaleX,
        0,
        0,
        config.scaleY,
        config.translateX,
        config.translateY
      ])
    }
    getTranslation() {
      const m = this.transform.matrix
      return {
        x: m[4],
        y: m[5]
      }
    }
    getScale() {
      const m = this.transform.matrix
      return {
        x: m[0],
        y: m[3]
      }
    }
    add(shape) {
      this.children.push(shape)
    }
    render() {
      const { children, canvas } = this
      const { ctx, width: canvasWidth, height: canvasHeight } = canvas
      const sceneMatrix = this.transform.matrix
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      // 方式2：全局transform
      for (const shape of children) {
        const transform = new Transform()
        transform.multiply(sceneMatrix)
        transform.multiply(shape.transform.matrix)
        ctx.save()
        // 方式1： 计算缩放后图形的位置坐标，移动坐标系原点到该坐标
        const m = transform.matrix
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
        shape.render(ctx)
        ctx.restore()
      }
    }
  }

  const scene = new Scene({
    container: boxElement,
    width: boxBounding.width,
    height: boxBounding.height
  })
  for (let index = 0; index < 10; index++) {
    scene.add(
      new Circle({
        x: Math.random() * boxBounding.width,
        y: Math.random() * boxBounding.height,
        radius: 30,
        color: getRandomColor()
      })
    )
  }
  scene.render()

  // 拖拽
  let oldPosition = null
  let isDragging = false
  const scaleBy = 1.01

  const handleMouseMove = (event) => {
    if (!isDragging) return
    const newPosition = { x: event.pageX - boxBounding.left, y: event.pageY - boxBounding.top }

    const translation = scene.getTranslation()
    const scale = scene.getScale()
    scene.changeTransform({
      scaleX: scale.x,
      scaleY: scale.y,
      translateX: newPosition.x - oldPosition.x + translation.x,
      translateY: newPosition.y - oldPosition.y + translation.y
    })
    // 拖拽画布实际上时重新计算了所有绘制元素的坐标，再重新绘制（无限画布的原理也是如此）
    scene.render()

    oldPosition = newPosition
  }
  const handleMouseUp = () => {
    isDragging = false
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('mousemove', handleMouseMove)
  }
  const handleMouseDown = (event) => {
    const { pageX, pageY } = event
    oldPosition = { x: pageX - boxBounding.left, y: pageY - boxBounding.top }
    isDragging = true
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
  }
  const handleWheel = (event) => {
    event.preventDefault()
    const { pageX, pageY, deltaY } = event
    const { x: oldScale } = scene.getScale()
    const translation = scene.getTranslation()
    const nextScale = deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
    // 屏幕坐标减去偏移量，由于canvas在之前设置scale(dpr)，canvas坐标系与屏幕坐标系相同
    // 屏幕坐标 = canvas坐标，故而可以直接当作canvas坐标使用
    const x = pageX - boxBounding.left
    const y = pageY - boxBounding.top
    // 计算(x,y)与canvas坐标系当前原点的偏移值
    const offsetX = x - translation.x 
    const offsetY = y - translation.y
    // 将oldScale比例下偏移值转换成缩放比例为1的偏移
    const offsetSize = {
      x: offsetX / oldScale,
      y: offsetY / oldScale
    }
    /**
     * 假设当前点是10,10，坐标系原点是0,0
     * 此时scale是1，此时偏移值是 10 - 0 / 1
     * 此后scale是2，偏移值变为10 * 2，意味着点从10,10 变成 20,20
     * 需要缩放点相对位置不变，就需要将偏移-10
     * 
     * 偏移值应用新的scale后，想要保持位置相对不变，需要反向平移
     */
    const newTranslation = {
      x: -offsetSize.x * nextScale + x,
      y: -offsetSize.y * nextScale + y
    }
    scene.changeTransform({
      scaleX: nextScale,
      scaleY: nextScale,
      translateX: newTranslation.x,
      translateY: newTranslation.y
    })
    scene.render()
  }

  // 拖动
  boxElement.addEventListener('mousedown', handleMouseDown)

  // 缩放
  boxElement.addEventListener('wheel', handleWheel, { passive: false })
})
</script>
