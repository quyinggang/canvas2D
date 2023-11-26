<template>
  <div class="box" ref="boxElementRef">
    <div class="tip">可视区域渲染数量：{{ clientCount }} / 60000</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRandomColor, getNumberInRange } from '@/utils'

const clientCount = ref(0)
const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value

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
    getWidth() {
      return this.radius * 2
    }
    getHeight() {
      return this.radius * 2
    }
  }

  class Scene {
    constructor(config) {
      const { container, useClientRender } = config
      const bounding = container.getBoundingClientRect()
      this.content = container
      this.bounding = bounding
      this.useClientRender = !!useClientRender
      this.transform = new Transform()
      this.children = []
      const pixel = config.pixel || window.devicePixelRatio
      this.pixel = pixel
      this.canvas = new Canvas({
        pixel,
        width: bounding.width,
        height: bounding.height
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
    checkInClientArea(shapeSize, shapeMatrix) {
      const bounding = this.bounding
      // 可视区域中心点
      const sceneCenter = {
        x: bounding.width * 0.5,
        y: bounding.height * 0.5
      }
      // 这里案例是圆点，所以绘制点也是中心点，其他图形需要额外计算逻辑
      // 这里需要注意的是canvas坐标与屏幕坐标需要转换，这里由于此时canvas scale(dpr)与屏幕坐标系相同，即不转换直接参入计算，如果canvas内还存在其他transform就需要处理
      const shapeCenter = {
        x: shapeMatrix[4],
        y: shapeMatrix[5]
      }
      // 两个矩形相交其中心点距离必然小于两个矩形宽度一半的总和
      const xDistance = Math.abs(shapeCenter.x - sceneCenter.x)
      const yDistance = Math.abs(shapeCenter.y - sceneCenter.y)

      return (
        xDistance < (bounding.width + shapeSize.width) * 0.5 &&
        yDistance < (bounding.height + shapeSize.height) * 0.5
      )
    }
    render() {
      const { children, canvas, useClientRender, bounding } = this
      const ctx = canvas.ctx
      const sceneMatrix = this.transform.matrix

      clientCount.value = 0
      ctx.clearRect(0, 0, bounding.width, bounding.height)
      for (const shape of children) {
        const transform = new Transform()
        transform.multiply(sceneMatrix)
        transform.multiply(shape.transform.matrix)
        // 计算缩放后图形的位置坐标，移动坐标系原点到该坐标
        const m = transform.matrix
        const shapeSize = {
          width: shape.getWidth(),
          height: shape.getHeight()
        }
        // 当前可视区域范围内图形才会被渲染，当前6万个图形开启前后fps能增加20fps以上
        const needRender = useClientRender ? this.checkInClientArea(shapeSize, m) : true
        if (needRender) {
          clientCount.value += 1
          ctx.save()
          ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])
          shape.render(ctx)
          ctx.restore()
        }
      }
    }
  }

  const scene = new Scene({
    container: boxElement,
    useClientRender: true
  })
  for (let index = 0; index < 60000; index++) {
    scene.add(
      new Circle({
        x: getNumberInRange(-10000, 10000),
        y: getNumberInRange(-10000, 10000),
        radius: 30,
        color: getRandomColor()
      })
    )
  }
  scene.render()

  // 拖拽
  let oldPosition = null
  let isDragging = false

  const handleMove = (event) => {
    if (!isDragging) return
    const bounding = scene.bounding
    const newPosition = { x: event.pageX - bounding.left, y: event.pageY - bounding.top }

    const translation = scene.getTranslation()
    const scale = scene.getScale()
    scene.changeTransform({
      scaleX: scale.x,
      scaleY: scale.y,
      translateX: newPosition.x - oldPosition.x + translation.x,
      translateY: newPosition.y - oldPosition.y + translation.y
    })
    scene.render()

    oldPosition = newPosition
  }
  const handleUp = () => {
    isDragging = false
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
  }
  boxElement.addEventListener('mousedown', (event) => {
    const { pageX, pageY } = event
    const bounding = scene.bounding
    oldPosition = { x: pageX - bounding.left, y: pageY - bounding.top }
    isDragging = true
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  })
})
</script>

<style scoped>
.box {
  position: relative;
}

.tip {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  user-select: none;
  pointer-events: none;
}
</style>
