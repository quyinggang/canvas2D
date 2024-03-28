<template>
  <div class="box" ref="boxElementRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getNumberInRange, getRandomColor } from '@/utils'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value

  const SETTING = {
    eyeColor: '#000',
    eyeRatio: 0.25,
    snakeSize: 8,
    minFoodSize: 4,
    maxFoodSize: 8,
    minSnakeLen: 5,
    maxSnakeLen: 100,
    snakeSpeed: 2,
    pathInterval: 4,
    // 必须比蛇体长度大
    maxPathCount: 130,
    snakeGrowThreshold: 6,
    rotateSpeed: 0.025 * 180,
    foodCount: 100,
    eatRange: 14
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

  class Snake {
    constructor(config) {
      this.snake = []
      this.path = []
      this.color = config.color
      this.radius = config.radius
      this.speed = SETTING.snakeSpeed
      this.power = 0
      // 顺逆时针方向标识，表示正反旋转方向
      this.cross = 1
      // 初始随机角度
      const angle = Math.random() * Math.PI * 2
      const direction = { x: Math.cos(angle), y: Math.sin(angle) }
      this.angle = angle
      this.direction = direction
      this.targetDirection = direction
      this.rotateSpeed = SETTING.rotateSpeed
      this.initSnakeLen = SETTING.minSnakeLen
      this.createSnakeShape(config)
    }
    createSnakeShape(config) {
      const path = []
      const snake = []
      const head = { x: config.x, y: config.y }
      const { initSnakeLen, direction, speed } = this
      const pathInterval = SETTING.pathInterval
      const pathLength = initSnakeLen * pathInterval
      let snakeIndex = 0
      // path存储蛇的运动路径，通过这个路径中每4个点的间隔绘制一个蛇节点
      for (let index = 0; index < pathLength; index++) {
        const point = {
          x: head.x - direction.x * speed * index,
          y: head.y - direction.y * speed * index
        }
        path.push(point)
        if (snakeIndex * pathInterval === index) {
          snake.push(point)
          snakeIndex += 1
        }
      }
      this.path = path
      this.snake = snake
    }
    getHead() {
      return this.snake[0]
    }
    getBody() {
      return this.snake.slice(1)
    }
    drawHead(ctx) {
      const { color, radius, angle } = this
      const { x, y } = this.getHead()
      ctx.save()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = SETTING.eyeColor
      const eyeRadius = radius * SETTING.eyeRatio
      const eyeOffset = radius * 0.4
      // 眼镜间距
      const eyeDistance = eyeRadius * 2
      const eyeX = x + Math.cos(angle) * eyeOffset
      const eyeY = y + Math.sin(angle) * eyeOffset
      // 计算出左右两个眼镜的坐标，当前角度偏移90度，是的眼镜左右对称
      const eyeX1 = eyeX + eyeDistance * Math.cos(angle + Math.PI / 2)
      const eyeY1 = eyeY + eyeDistance * Math.sin(angle + Math.PI / 2)
      const eyeX2 = eyeX + eyeDistance * Math.cos(angle - Math.PI / 2)
      const eyeY2 = eyeY + eyeDistance * Math.sin(angle - Math.PI / 2)
      ctx.beginPath()
      ctx.arc(eyeX1, eyeY1, eyeRadius, 0, 2 * Math.PI)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(eyeX2, eyeY2, eyeRadius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.restore()
    }
    drawBody(ctx) {
      const { color, radius } = this
      const body = this.getBody()

      ctx.save()
      ctx.fillStyle = color
      body.forEach((data) => {
        const { x, y } = data
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
      })
      ctx.restore()
    }
    rotate() {
      const { direction, targetDirection, rotateSpeed, cross } = this
      const { x: cx, y: cy } = direction
      const { x: tx, y: ty } = targetDirection
      // 当前方向与目标方向相同
      if (cx === tx && cy === ty) return
      // 点积计算两个向量的夹角的弧度值，得到当前方向向量需要旋转多少度才能与目标方向向量对齐
      const dot = cx * tx + cy * ty
      const angle = (Math.acos(dot) / Math.PI) * 180
      // 夹角的绝对值小于等于 rotateSpeed，直接将当前方向设置为目标方向
      if (Math.abs(angle) <= rotateSpeed) {
        this.direction = { ...targetDirection }
      } else {
        // 根据旋转速度、旋转角度、旋转方向得到对应的旋转矩阵，然后应用到direction坐标上
        const rad = (cross * rotateSpeed * Math.PI) / 180
        const cosValue = Math.cos(rad)
        const sinValue = Math.sin(rad)
        const rotateMatrix = [cosValue, sinValue, -sinValue, cosValue]
        const newDirection = {
          x: cx * rotateMatrix[0] + cy * rotateMatrix[2],
          y: cx * rotateMatrix[1] + cy * rotateMatrix[3]
        }
        this.direction = newDirection
      }
    }
    rotateTo(x, y) {
      const direction = this.direction
      this.targetDirection = { x, y }
      // 叉积计算，判断顺逆时针方向关系
      this.cross = y * direction.x - x * direction.y >= 0 ? 1 : -1
      // 根据Math.atan2计算出角度
      this.angle = Math.atan2(y, x)
    }
    move() {
      const { speed, direction, path, snake } = this
      const head = this.getHead()
      // 计算出运动的下一个节点坐标，该节点是蛇的头部
      const point = {
        x: head.x + direction.x * speed,
        y: head.y + direction.y * speed
      }
      path.unshift(point)
      const pathInterval = SETTING.pathInterval
      const pathEndIndex = path.length - 1
      // 通过移动路径存储的坐标实现蛇的整体向前移动
      for (let index = snake.length - 1; index >= 0; index--) {
        const idx = Math.min(index * pathInterval, pathEndIndex)
        const pos = path[idx]
        const node = snake[index]
        node.x = pos.x
        node.y = pos.y
      }
      path.length > SETTING.maxPathCount && path.pop()
    }
    addBody() {
      // 简单处理吃多少能量长身体
      const { power, snake, initSnakeLen } = this
      const { maxSnakeLen, snakeGrowThreshold } = SETTING
      const growTotalLen = Math.trunc(power / snakeGrowThreshold)
      if (growTotalLen <= 0) return
      const nextSnakeLen = Math.min(growTotalLen + initSnakeLen, maxSnakeLen)
      const len = nextSnakeLen - snake.length
      for (let index = 0; index < len; index++) {
        snake.push({ x: 0, y: 0 })
      }
    }
    eat(power) {
      this.power += power
      this.addBody()
    }
    render(ctx) {
      this.drawBody(ctx)
      this.drawHead(ctx)
    }
  }

  class Food {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.radius = config.radius
      this.color = config.color
      this.power = Math.round(config.radius / SETTING.minFoodSize)
      this.visible = true
    }
    render(ctx) {
      const { x, y, radius, color } = this
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      grad.addColorStop(0, color)
      grad.addColorStop(0.3, color)
      grad.addColorStop(1, 'transparent')
      ctx.save()
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()
      ctx.restore()
    }
  }

  class GameEngine {
    constructor(config) {
      this.initState(config)
      this.createCanvas()
      this.createFoods()
      this.createSnake()
      this.createController()
      this.mountCanvas()
    }
    initState(config) {
      const container = config.container
      if (!(container instanceof HTMLElement)) {
        throw new Error('container must be a html element')
      }
      this.container = container
      this.raf = null
      this.foods = []
    }
    createCanvas() {
      const boundingClient = this.container.getBoundingClientRect()
      const { width, height } = boundingClient
      this.canvas = new Canvas({
        width,
        height,
        pixel: window.devicePixelRatio
      })
      this.clientCenter = { x: width * 0.5, y: height * 0.5 }
      this.boundingClient = boundingClient
    }
    createSnake() {
      const clientCenter = this.clientCenter
      const snake = new Snake({
        x: clientCenter.x,
        y: clientCenter.y,
        color: '#c0392b',
        radius: SETTING.snakeSize
      })
      this.snake = snake
    }
    createFoods() {
      const { width, height } = this.canvas
      const { minFoodSize, maxFoodSize, foodCount } = SETTING
      const foods = []
      const offset = 10
      for (let i = 0; i < foodCount; i++) {
        const x = getNumberInRange(offset, width - offset)
        const y = getNumberInRange(offset, height - offset)
        const radius = getNumberInRange(minFoodSize, maxFoodSize)
        const color = getRandomColor()
        foods.push(new Food({ x, y, color, radius: Math.round(radius) }))
      }
      this.foods = foods
    }
    mountCanvas() {
      this.container.appendChild(this.canvas.domElement)
    }
    createController() {
      const {
        snake,
        clientCenter,
        boundingClient: { left, top }
      } = this
      const handleMove = (position) => {
        // 计算鼠标当前点与可视中心点之间的差值，从而得到目标方向
        const deltaX = position.x - left - clientCenter.x
        const deltaY = position.y - top - clientCenter.y
        const mod = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
        snake.rotateTo(deltaX / mod, deltaY / mod)
      }
      this.container.addEventListener('mousemove', handleMove)
    }
    checkFoodVisible() {
      const { snake, foods } = this
      const eatRange = SETTING.eatRange
      const head = snake.getHead()
      // 简单处理，数据量大时food的渲染以及吃掉的会有性能问题，可采用分片以及可视区域渲染等逻辑优化
      for (const food of foods) {
        if (food.visible) {
          const diff = {
            x: head.x - food.x,
            y: head.y - food.y
          }
          const distance = Math.pow(diff.x, 2) + Math.pow(diff.y, 2)
          if (Math.sqrt(distance) < eatRange) {
            food.visible = false
            snake.eat(food.power)
          }
        }
      }
    }
    renderFrame() {
      const {
        snake,
        clientCenter,
        canvas: { ctx, width, height },
        foods
      } = this
      const head = snake.getHead()
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      // 蛇头在运动中始终位于可视中心位置（镜头同步跟随）
      // 蛇初始位置是可视中心点，计算每次蛇移动后的偏移差值，坐标系原点做补偿从而实现蛇头始终居中显示
      ctx.translate(clientCenter.x - head.x, clientCenter.y - head.y)
      snake.rotate()
      snake.move()
      this.checkFoodVisible()
      foods.forEach((food) => food.visible && food.render(ctx))
      snake.render(ctx)
      ctx.restore()
    }
    start() {
      this.renderFrame()
      this.raf = window.requestAnimationFrame(this.start.bind(this))
    }
    destroy() {
      this.container = null
      window.cancelAnimationFrame(this.raf)
    }
  }

  const engine = new GameEngine({
    container: boxElement
  })
  engine.start()

  onBeforeUnmount(() => engine.destroy())
})
</script>

<style scoped>
.box {
  width: 100%;
  height: 100%;
  background: #161c22;
}
</style>
