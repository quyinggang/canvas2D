<template>
  <div class="box" ref="boxElementRef">
    <span class="tip">请点击创建圆形，页面支持缩放</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxRect = boxElement.getBoundingClientRect()

  class Transform {
    constructor(m = [1, 0, 0, 1, 0, 0]) {
      this.m = (m && m.slice()) || [1, 0, 0, 1, 0, 0]
    }
    updateMatrix(matrix) {
      this.m = matrix.slice()
    }
    point(point) {
      var m = this.m
      return {
        x: m[0] * point.x + m[2] * point.y + m[4],
        y: m[1] * point.x + m[3] * point.y + m[5]
      }
    }
    // 矩阵乘法
    multiply(matrix) {
      var m11 = this.m[0] * matrix[0] + this.m[2] * matrix[1]
      var m12 = this.m[1] * matrix[0] + this.m[3] * matrix[1]
      var m21 = this.m[0] * matrix[2] + this.m[2] * matrix[3]
      var m22 = this.m[1] * matrix[2] + this.m[3] * matrix[3]
      var dx = this.m[0] * matrix[4] + this.m[2] * matrix[5] + this.m[4]
      var dy = this.m[1] * matrix[4] + this.m[3] * matrix[5] + this.m[5]
      this.m[0] = m11
      this.m[1] = m12
      this.m[2] = m21
      this.m[3] = m22
      this.m[4] = dx
      this.m[5] = dy
      return this
    }
    invert() {
      var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2])
      var m0 = this.m[3] * d
      var m1 = -this.m[1] * d
      var m2 = -this.m[2] * d
      var m3 = this.m[0] * d
      var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4])
      var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5])
      this.m[0] = m0
      this.m[1] = m1
      this.m[2] = m2
      this.m[3] = m3
      this.m[4] = m4
      this.m[5] = m5
      return this
    }
    getMatrix() {
      return this.m
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
      const m = this.transform.getMatrix()
      return {
        x: m[4],
        y: m[5]
      }
    }
    getScale() {
      const m = this.transform.getMatrix()
      return {
        x: m[0],
        y: m[3]
      }
    }
    getRelativePointerPosition(pointer) {
      // 需要注意的是此时矩阵不包含scale(dpr)，canvas提供的getTransform获取的矩阵包含scale(dpr)
      const matrix = this.transform.getMatrix()
      const transform = new Transform(matrix)
      // 逆转矩阵
      transform.invert()
      // 矩阵transform
      return transform.point(pointer)
    }
    add(shape) {
      this.children.push(shape)
    }
    render() {
      const { width, height, children, canvas } = this
      const { ctx, width: canvasWidth, height: canvasHeight } = canvas
      const sceneMatrix = this.transform.getMatrix()
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      for (const shape of children) {
        const transform = new Transform()
        transform.multiply(sceneMatrix)
        transform.multiply(shape.transform.getMatrix())
        ctx.save()
        // 计算缩放后图形的位置坐标，移动坐标系原点到该坐标
        const m = transform.getMatrix()
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
        shape.render(ctx)
        ctx.restore()
      }
    }
  }

  const scene = new Scene({
    container: boxElement,
    width: boxRect.width,
    height: boxRect.height
  })

  // 缩放
  const scaleBy = 1.01
  const handleWheel = (event) => {
    event.preventDefault()
    const { pageX, pageY, deltaY } = event
    const x = pageX - boxRect.left
    const y = pageY - boxRect.top
    const { x: oldScale } = scene.getScale()
    const translation = scene.getTranslation()
    const newScale = deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const mousePointTo = {
      x: (x - translation.x) / oldScale,
      y: (y - translation.y) / oldScale
    }
    const newPos = {
      x: x - mousePointTo.x * newScale,
      y: y - mousePointTo.y * newScale
    }
    scene.changeTransform({
      scaleX: newScale,
      scaleY: newScale,
      translateX: newPos.x,
      translateY: newPos.y
    })
    scene.render()
  }
  const handleClick = (event) => {
    const pos = scene.getRelativePointerPosition({
      x: event.pageX - boxRect.left,
      y: event.pageY - boxRect.top
    })
    scene.add(
      new Circle({
        x: pos.x,
        y: pos.y,
        radius: 30,
        color: getRandomColor()
      })
    )
    scene.render()
  }


  boxElement.addEventListener('wheel', handleWheel, { passive: false })
  boxElement.addEventListener('click', handleClick)
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
  z-index: 10;
  color: darkgrey;
  user-select: none;
  pointer-events: none;
}
</style>
