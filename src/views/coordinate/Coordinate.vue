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
      // 此时scale会设置canvas坐标系与屏幕坐标系相同，屏幕坐标与canvas坐标无需转换，并且可以自己维护矩阵用于线性变换
      this.ctx.scale(config.pixel, config.pixel)
    }
    getTransform() {
      return this.ctx.getTransform()
    }
    setCanvasSize(config) {
      const { width, height, pixel } = config
      /**
       * 绘图面积和显示面积的设置，对于浏览器dpr非1时，就会出现模糊或者拉伸的情况，此时设置dpr值就可以解决
       * 在点击屏幕时：
       * - 应用dpr会到来坐标转换的问题，此时屏幕坐标在canvas中绘制效果就不是鼠标点击的点，即dpr影响了Canvas上的绘图和用户输入事件的坐标转换
       * - 如果不设置dpr，鼠标点击位置处canvas就会绘制图形，即屏幕坐标 = canvas坐标，可看成它们的坐标系相同没有任何变换
       * 
       * 不管应用不应用dpr，canvas矩阵的缩放值都是1，但是显示效果是不同的
       * - 应用dpr的效果：在点击位置的1 / dpr处绘制
       * - 不应用dpr：在点击处绘制
       * 
       * 为了图形的清晰度，通常都需要应用dpr，此时需要对canvas scale(dpr)，从而实现屏幕坐标 = canvas坐标无需转换，需要说明的是：
       * - 你应用dpr后虽然缩放dpr倍（比如2倍），但此时canvas矩阵scale值是0.5
       * - 应用scale(dpr)抹平了dpr带来坐标转换，此时屏幕坐标 = canvas坐标，
       *   但是如果canvas存在其他变换，例如缩放平移等，屏幕坐标与canvas坐标的转换还是需要通过逆矩阵变换实现，
       *   可以自己维护矩阵来实现，避免后续频繁调用canvas的矩阵获取方法导致的性能问题
       */
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
      this.x = config.x
      this.y = config.y
      this.color = config.color
      this.radius = config.radius
      this.transform = new Transform()
    }
    render(ctx) {
      const { x, y, radius, color } = this
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
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
      // 需要注意的是此时矩阵是自维护的矩阵，不包含scale(dpr)的变化
      // canvas提供的getTransform获取的canvas矩阵
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
    // 实验：屏幕坐标 -> canvas坐标
    renderViewportRect(m) {
      const { canvas, width, height } = this
      const ctx = canvas.ctx
      // 新建当前矩阵的逆转矩阵，用于计算屏幕视口（屏幕坐标）对应的canvas坐标
      const invertTransform = new Transform(m)
      invertTransform.invert()
      const start = { x: 0, y: 0 }
      const end = { x: width, y: height }
      const startPoint = invertTransform.point(start)
      const endPoint = invertTransform.point(end)
      console.log(startPoint, endPoint)
      const clientRange = {
        x: startPoint.x,
        y: startPoint.y,
        width: endPoint.x - startPoint.x,
        height: endPoint.y - startPoint.y
      }
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.strokeRect(clientRange.x, clientRange.y, clientRange.width, clientRange.height)
    }
    render() {
      const { width, height, children, canvas } = this
      const { ctx } = canvas
      const sceneMatrix = this.transform.getMatrix()
      // 这里使用全局translate来实现，其他案例中有每个元素都应用transform的方式
      const transform = new Transform().multiply(sceneMatrix)
      const m = transform.getMatrix()
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
      this.renderViewportRect(m)
      for (const shape of children) {
        shape.render(ctx)
      }
      ctx.restore()
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
    const point = {
      x: event.pageX - boxRect.left,
      y: event.pageY - boxRect.top
    }
    const pos = scene.getRelativePointerPosition(point)
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
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  user-select: none;
  pointer-events: none;
}
</style>
