<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadImage } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()

  class CImage {
    constructor(x, y, image) {
      this.x = x
      this.y = y
      this.image = image
    }
    render(ctx) {
      const { x, y, image } = this
      ctx.drawImage(image, x, y)
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
      const { children, canvas } = this
      const ctx = canvas.ctx
      ctx.clearRect(0, 0, this.width, this.height)
      for (const shape of children) {
        ctx.save()
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

  /*
    - 方式一：svg内容转换成base64 url作为图像地址，canvas绘制图像
    - 方式二：svg文件直接作为图形地址，canvas绘制图像
    - 可以使用svg foreignObject包裹html DOM从而实现在canvas中绘制dom内容
  */
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" height="210" width="500">
        <polygon
          points="100,10 40,198 190,78 10,78 160,198"
          style="fill: lime; stroke: purple; stroke-width: 5; fill-rule: evenodd"
        />
      </svg>
  `
  const imageUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`
  loadImage(imageUrl).then((image) => {
    const center = {
      x: boxBounding.width * 0.5 - image.width * 0.5,
      y: boxBounding.height * 0.5 - image.height * 0.5
    }
    scene.add(new CImage(center.x, center.y, image))
    scene.render()
  })
})
</script>
