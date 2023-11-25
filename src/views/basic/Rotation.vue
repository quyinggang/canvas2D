<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  let raf = null
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()

  // class Transform {
  //   constructor() {
  //     this.m = [1, 0, 0, 1, 0, 0]
  //   }
  //   translate(x, y) {
  //     this.m[4] += this.m[0] * x + this.m[2] * y
  //     this.m[5] += this.m[1] * x + this.m[3] * y
  //   }
  //   rotate(rad) {
  //     var c = Math.cos(rad)
  //     var s = Math.sin(rad)
  //     var m11 = this.m[0] * c + this.m[2] * s
  //     var m12 = this.m[1] * c + this.m[3] * s
  //     var m21 = this.m[0] * -s + this.m[2] * c
  //     var m22 = this.m[1] * -s + this.m[3] * c
  //     this.m[0] = m11
  //     this.m[1] = m12
  //     this.m[2] = m21
  //     this.m[3] = m22
  //   }
  // }
  class Rect {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.origin = config.origin
      this.color = config.color
      this.width = config.width
      this.height = config.height
    }
    rotate(angle) {
      this.angle = angle
    }
    render(ctx) {
      const { color, x, y, width, height, origin, angle } = this
      ctx.save()
      // 移动坐标原点到旋转点，旋转，此时再将原点到0,0点
      ctx.translate(origin.x, origin.y)
      ctx.rotate(angle)
      ctx.translate(-origin.x, -origin.y)

      // 自实现矩阵处理逻辑
      // const transform = new Transform()
      // transform.translate(origin.x, origin.y)
      // transform.rotate(angle)
      // transform.translate(-origin.x, -origin.y)
      // const m = transform.m
      // ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5])

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.fill()
      ctx.closePath()
      ctx.restore()
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
  class Scene {
    constructor(config) {
      const { width, height, container } = config
      this.content = container
      this.width = width
      this.height = height
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
    add(shape) {
      this.children.push(shape)
    }
    render() {
      const { children } = this
      const ctx = this.canvas.ctx
      ctx.clearRect(0, 0, this.width, this.height)
      for (const shape of children) {
        shape.render(ctx)
      }
    }
  }

  const scene = new Scene({
    container: boxElement,
    width: boxBounding.width,
    height: boxBounding.height
  })
  const center = {
    x: boxBounding.width / 2,
    y: boxBounding.height / 2
  }
  const rect = new Rect({
    origin: {
      x: center.x,
      y: center.y
    },
    x: center.x,
    y: center.y,
    width: 60,
    height: 60,
    color: getRandomColor()
  })
  const rect1 = new Rect({
    origin: {
      x: center.x,
      y: center.y
    },
    x: center.x * 0.5,
    y: center.y * 0.5,
    width: 60,
    height: 60,
    color: getRandomColor()
  })
  const rect2 = new Rect({
    origin: {
      x: center.x * 2,
      y: center.y * 2
    },
    x: center.x,
    y: center.y,
    width: 60,
    height: 60,
    color: getRandomColor()
  })
  scene.add(rect)
  scene.add(rect1)
  scene.add(rect2)
  scene.render()

  let angle = 0
  requestAnimationFrame(function render() {
    rect.rotate(angle)
    rect1.rotate(angle)
    rect2.rotate(angle)
    angle += 0.01
    scene.render()
    raf = requestAnimationFrame(render)
  })

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>
