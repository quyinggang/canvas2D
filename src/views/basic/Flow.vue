<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getNumberInRange } from '@/utils'


const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  let raf = null

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

  class Particle {
    constructor(x, y, color) {
      this.x = x
      this.y = y
      this.color = color
      this.speedRate = 0.4
      this.speedX = 0
      this.speedY = 0
      this.nextX = x + this.speedX
      this.nextY = y + this.speedY
      this.life = getNumberInRange(20, 600)
    }
    update() {
      this.x = this.nextX
      this.y = this.nextY
      this.speedX += getNumberInRange(-1, 1) * this.speedRate
      this.speedY += getNumberInRange(-1, 1) * this.speedRate
      this.nextX += this.speedX
      this.nextY += this.speedY
      this.life -= 1
    }
    render(ctx) {
      ctx.save()
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.strokeStyle = this.color
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.nextX, this.nextY)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
  }

  class Scene {
    constructor(config) {
      this.container = config.container
      const bounding = this.container.getBoundingClientRect()
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width: bounding.width,
        height: bounding.height
      })
      this.bounding = bounding
      this.particleTotal = 300
      this.particles = []
      this.createParticles()
      this.mountCanvas()
    }
    mountCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    getParticleInstance() {
      const { width, height } = this.bounding
      const x = getNumberInRange(10, width)
      const y = getNumberInRange(10, height)
      return new Particle(x, y, 'rgb(167, 88, 185)')
    }
    createParticles() {
      const { particles, particleTotal } = this
      for (let index = 0; index < particleTotal; index++) {
        const particle = this.getParticleInstance()
        particles.push(particle)
      }
      this.particles = particles
    }
    render() {
      const liveParticles = []
      const newParticles = []
      const { particles, bounding, canvas } = this
      const ctx = canvas.ctx
      // 拖尾效果
      ctx.fillStyle = 'rgba(0,0,0,.4)'
      ctx.fillRect(0, 0, bounding.width, bounding.height)
      for (const particle of particles) {
        particle.update()
        if (particle.life > 0) {
          liveParticles.push(particle)
        } else {
          newParticles.push(this.getParticleInstance())
        }
      }
      for (const particle of liveParticles) {
        particle.render(ctx)
      }
      this.particles = [...liveParticles, ...newParticles]
      raf = window.requestAnimationFrame(this.render.bind(this))
    }
  }

  const scene = new Scene({ container: boxElement })
  scene.render()

  onBeforeUnmount(() => window.cancelAnimationFrame(raf))
})
</script>
