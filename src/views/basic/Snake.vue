<template>
  <div class="box" ref="boxElementRef">
    <canvas class="canvas" ref="canvasElementRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getRandomColor, getNumberInRange } from '@/utils'

const boxElementRef = ref(null)
const canvasElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value
  const boxBounding = boxElement.getBoundingClientRect()
  const canvasElement = canvasElementRef.value
  const dpr = window.devicePixelRatio
  canvasElement.width = dpr * boxBounding.width
  canvasElement.height = dpr * boxBounding.height

  const ctx = canvasElement.getContext('2d')
  ctx.scale(dpr, dpr)

  let raf = null
  const SIZE = 20
  const CANVAS_WIDTH = boxBounding.width
  const CANVAS_HEIGHT = boxBounding.height
  const SNAKE_HEAD_COLOR = 'red'
  const SNAKE_BODY_COLOR = 'gray'
  const DIRECTION_ALIAS = {
    up: 0,
    right: 1,
    down: 2,
    left: 3
  }

  class Rect {
    constructor(x, y, w, h, color) {
      this.x = x
      this.y = y
      this.w = w
      this.h = h
      this.color = color
    }
    draw() {
      const { x, y, w, h, color } = this
      ctx.save()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
      ctx.closePath()
      ctx.restore()
    }
  }

  class Snake {
    constructor() {
      const parts = []
      for (let index = 0; index < 4; index++) {
        const rect = new Rect(20 * index, 0, SIZE, SIZE, SNAKE_BODY_COLOR)
        parts.splice(0, 0, rect)
      }
      const head = parts[0]
      head.color = SNAKE_HEAD_COLOR
      this.head = head
      this.snakeParts = parts
      this.direction = DIRECTION_ALIAS.right
      this.isEatFood = false
    }
    draw() {
      this.snakeParts.forEach((item) => {
        item.draw()
      })
    }
    move() {
      const { head, direction, snakeParts, isEatFood } = this
      /*
            贪吃蛇移动的逻辑：
            - 依据头部坐标创建一个身体方块，并去除尾部方块
            - 按照移动方向变更头部坐标
          */
      const rect = new Rect(head.x, head.y, head.w, head.h, SNAKE_BODY_COLOR)
      snakeParts.splice(1, 0, rect)
      // 吃掉食物不需要去尾逻辑
      !isEatFood && snakeParts.pop()
      switch (direction) {
        case DIRECTION_ALIAS.up:
          head.y -= head.h
          break
        case DIRECTION_ALIAS.right:
          head.x += head.w
          break
        case DIRECTION_ALIAS.down:
          head.y += head.h
          break
        case DIRECTION_ALIAS.left:
          head.x -= head.w
          break
      }
    }
    setIsEat(isEat) {
      this.isEatFood = isEat
    }
  }

  class Food {
    constructor(snake) {
      this.snake = snake
      const { x, y } = this.computeRandomPosition()
      const color = getRandomColor()
      this.rect = new Rect(x, y, SIZE, SIZE, color)
    }
    computeRandomPosition() {
      let x = null
      let y = null
      let isOnSnake = true
      const snakeParts = this.snake.snakeParts
      while (isOnSnake) {
        x = getNumberInRange(0, CANVAS_WIDTH / 20 - 1)
        y = getNumberInRange(0, CANVAS_HEIGHT / 20 - 1)
        isOnSnake = snakeParts.some((item) => item.x === x && item.y === y)
      }
      return { x: x * SIZE, y: y * SIZE }
    }
    get x() {
      return this.rect.x
    }
    get y() {
      return this.rect.y
    }
    draw() {
      this.rect.draw()
    }
  }

  const snake = new Snake()
  let food = new Food(snake)

  const checkIsEatFood = () => {
    const { head } = snake
    return head.x === food.x && head.y === food.y
  }
  const renderFrame = () => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    // 投放食物
    food.draw()
    const isEat = checkIsEatFood()
    snake.setIsEat(isEat)
    snake.move()
    snake.draw()
    // 构建新的食物
    if (isEat) {
      food = new Food(snake)
    }
  }
  const checkIsGameOver = () => {
    const { head, snakeParts } = snake
    // 由于每次移动方块都是一个方块大小，边界校验呈现效果总是滞后一个方块大小
    const isOverBoundary =
      head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT
    const isHitSelf = snakeParts.slice(1).some((item) => {
      return item.x === head.x && item.y === head.y
    })
    return isOverBoundary || isHitSelf
  }
  const handleKeydown = (event) => {
    event.preventDefault()
    const { up, right, down, left } = DIRECTION_ALIAS
    const currentDir = snake.direction
    switch (event.keyCode) {
      case 87:
        if (currentDir !== down) {
          snake.direction = up
        }
        break
      case 68:
        if (currentDir !== left) {
          snake.direction = right
        }
        break
      case 83:
        if (currentDir !== up) {
          snake.direction = down
        }
        break
      case 65:
        if (currentDir !== right) {
          snake.direction = left
        }
        break
    }
  }

  let oldTime = Date.now()
  const run = () => {
    const isGameOver = checkIsGameOver()
    if (isGameOver) return
    const current = Date.now()
    if (current - oldTime > 200) {
      renderFrame()
      oldTime = current
    }
    raf = window.requestAnimationFrame(run)
  }

  run()
  document.addEventListener('keydown', handleKeydown)

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    window.cancelAnimationFrame(raf)
  })
})
</script>
