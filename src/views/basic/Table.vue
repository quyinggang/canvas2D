<template>
  <div class="box">
    <div class="center" ref="boxElementRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const boxElementRef = ref(null)

onMounted(() => {
  const boxElement = boxElementRef.value

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

  class Table {
    constructor(config) {
      this.x = config.x
      this.y = config.y
      this.scene = config.scene
      this.columns = config.columns
      this.data = config.data
      this.defaultConfig = {
        headerBackground: '#20D9F0',
        lineColor: '#0696B4',
        headLineHeight: 40,
        bodyLineHeight: 30,
        scrollBarWidth: 6,
        scrollBarColor: '#0696B4'
      }
      this.scrollTop = 0
      this.renderDataStartIndex = 0
      this.renderDataEndIndex = 0
      this.cacheContext = null
      this.raf = null
      this.computeTableSize(config)
      this.computeClientDataRange()
      this.bindEvents()
    }
    computeTableSize(config) {
      const { data, defaultConfig, columns } = this
      const { width, height } = config
      const { headLineHeight, bodyLineHeight } = defaultConfig
      const lines = data.length
      this.tableSize = {
        tableWidth: width,
        tableHeight: height,
        cellWidth: Math.floor(width / columns.length),
        headerHeight: headLineHeight,
        realBodyHeight: lines * bodyLineHeight,
        clientBodyHeight: height - headLineHeight
      }
    }
    computeClientDataRange() {
      const { scrollTop, data, defaultConfig, tableSize } = this
      const lineHeight = defaultConfig.bodyLineHeight
      const startIndex = scrollTop ? Math.floor(scrollTop / lineHeight) : 0
      const endIndex = Math.ceil(tableSize.clientBodyHeight / lineHeight)
      // 滚动时延迟移除上一条记录，使得整体效果更加平滑
      this.renderDataStartIndex = Math.max(startIndex - 1, 0)
      this.renderDataEndIndex = Math.min(startIndex + endIndex, data.length - 1)
    }
    render(ctx) {
      const { x, y } = this
      this.cacheContext = ctx
      ctx.save()
      ctx.translate(x, y)
      this.drawHeaderBackground(ctx)
      this.drawBorder(ctx)
      this.drawHeader(ctx)
      this.drawBody(ctx)
      this.drawScrollBar(ctx)
      ctx.restore()
    }
    drawHeaderBackground(ctx) {
      const { tableSize, defaultConfig } = this
      ctx.save()
      ctx.rect(0, 0, tableSize.tableWidth, tableSize.headerHeight)
      ctx.fillStyle = defaultConfig.headerBackground
      ctx.fill()
      ctx.restore()
    }
    drawBorder(ctx) {
      const { tableSize, defaultConfig } = this
      const { tableWidth, tableHeight } = tableSize
      ctx.save()
      ctx.strokeStyle = defaultConfig.lineColor
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(tableWidth, 0)
      ctx.lineTo(tableWidth, tableHeight)
      ctx.lineTo(0, tableHeight)
      ctx.lineTo(0, 0)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
    drawHeader(ctx) {
      const { columns, tableSize, defaultConfig } = this
      const { cellWidth, headerHeight, tableWidth, tableHeight } = tableSize
      const columnLimit = columns.length
      const cellCenter = {
        x: cellWidth * 0.5,
        y: headerHeight * 0.5
      }
      ctx.save()
      ctx.font = '12px serif'
      ctx.strokeStyle = defaultConfig.lineColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let index = 0; index < columnLimit; index++) {
        const text = columns[index].name

        const lineX = cellWidth * (index + 1)
        ctx.moveTo(lineX, 0)
        ctx.lineTo(lineX, tableHeight)
        ctx.stroke()

        const textPosX = cellWidth * index
        ctx.fillText(text, textPosX + cellCenter.x, cellCenter.y)
      }
      ctx.beginPath()
      ctx.moveTo(0, headerHeight)
      ctx.lineTo(tableWidth, headerHeight)
      ctx.stroke()
      ctx.restore()
    }
    drawBody(ctx) {
      const { columns, defaultConfig, data, tableSize, renderDataStartIndex, renderDataEndIndex } =
        this
      const { tableWidth, cellWidth, headerHeight, clientBodyHeight } = tableSize
      const columnLimit = columns.length
      const lineHeight = defaultConfig.bodyLineHeight
      const cellCenter = {
        x: cellWidth * 0.5,
        y: lineHeight * 0.5
      }
      ctx.save()
      ctx.translate(0, headerHeight)

      // 表格内容区超出部分隐藏，即不绘制
      ctx.rect(0, 0, tableWidth, clientBodyHeight)
      ctx.clip()

      // 随着滚动条滚动内容同步滚动，使得内容平滑过渡
      ctx.translate(0, -this.scrollTop)

      ctx.font = '12px serif'
      ctx.strokeStyle = defaultConfig.lineColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const startIndex = renderDataStartIndex
      const endIndex = renderDataEndIndex + 1
      for (let lineIndex = startIndex; lineIndex < endIndex; lineIndex++) {
        const lineItem = data[lineIndex]
        const textY = lineHeight * lineIndex
        const nextIndex = lineIndex + 1

        if (nextIndex <= endIndex) {
          const lineX = lineHeight * nextIndex
          ctx.moveTo(0, lineX)
          ctx.lineTo(tableWidth, lineX)
          ctx.stroke()
        }

        for (let index = 0; index < columnLimit; index++) {
          const field = columns[index].field
          const textX = cellWidth * index
          const text = lineItem[field]
          ctx.fillText(text, textX + cellCenter.x, textY + cellCenter.y)
        }
      }

      ctx.restore()
    }
    drawScrollBar(ctx) {
      const { defaultConfig, tableSize, scrollTop } = this
      const {
        scrollBarWidth: barWidth,
        headLineHeight: headerHeight,
        bodyLineHeight: lineHeight
      } = defaultConfig

      const { clientBodyHeight, realBodyHeight, tableWidth } = tableSize
      const maxScrollTop = realBodyHeight - clientBodyHeight
      if (maxScrollTop <= 0) return
      const halfWidth = barWidth / 2
      let barHeight = (clientBodyHeight / realBodyHeight) * clientBodyHeight
      // 保证滚动条高度
      barHeight = Math.max(lineHeight - barWidth, barHeight)
      // lineCap为round会在前后增加bar宽度一半的图形
      const maxOffset = clientBodyHeight - barHeight - barWidth
      const offset = Math.floor((scrollTop * maxOffset) / maxScrollTop)
      const barStart = {
        x: tableWidth - halfWidth,
        y: halfWidth + offset
      }
      const barEnd = {
        x: barStart.x,
        y: barStart.y + barHeight
      }

      ctx.save()
      ctx.translate(0, headerHeight)
      ctx.lineWidth = barWidth
      ctx.lineCap = 'round'
      ctx.strokeStyle = defaultConfig.scrollBarColor
      ctx.beginPath()
      ctx.moveTo(barStart.x, barStart.y)
      ctx.lineTo(barEnd.x, barEnd.y)
      ctx.stroke()
      ctx.restore()
    }
    scroll() {
      const { x, y, tableSize, cacheContext: context } = this
      this.computeClientDataRange()
      // 清除整个表格并且全量渲染，当然也可以只清除表格内容区之后局部渲染
      context.clearRect(x, y, tableSize.tableWidth, tableSize.tableHeight)
      this.render(context)
    }
    bindEvents() {
      const { x } = this
      const { clientBodyHeight, realBodyHeight, headerHeight, tableWidth, tableHeight } =
        this.tableSize
      const maxScrollTop = realBodyHeight - clientBodyHeight
      if (maxScrollTop <= 0) return
      const { content: sceneDomElement, bounding: relative } = this.scene
      const bodyRelativeRect = {
        start: {
          x,
          y: headerHeight
        },
        end: {
          x: x + tableWidth,
          y: headerHeight + tableHeight
        }
      }
      const speedRatio = 0.1
      let waitingForRender = false
      const handleScroll = (deltaY) => {
        const oldScrollTop = this.scrollTop
        const newScrollTop = oldScrollTop + deltaY * speedRatio
        const result = Math.min(Math.max(0, Math.ceil(newScrollTop)), maxScrollTop)
        this.scrollTop = result
        oldScrollTop !== result && this.scroll()
      }
      this.handleWheel = (event) => {
        event.preventDefault()
        const { clientX, clientY, deltaY } = event
        const x = clientX - relative.left
        const y = clientY - relative.top
        const isInBodyXRange = x >= bodyRelativeRect.start.x && x <= bodyRelativeRect.end.x
        const isInBodyYRange = y >= bodyRelativeRect.start.y && y <= bodyRelativeRect.end.y
        const isInBodyArea = isInBodyXRange && isInBodyYRange
        if (!isInBodyArea) return

        // 使用requestAnimationFrame优化减少不必要的渲染
        if (!waitingForRender) {
          waitingForRender = true
          this.raf = window.requestAnimationFrame(() => {
            handleScroll(deltaY)
            waitingForRender = false
          })
        }
      }
      sceneDomElement.addEventListener('wheel', this.handleWheel)
    }
    destroy() {
      const { content } = this.scene
      window.cancelAnimationFrame(this.raf)
      content.removeEventListener('wheel', this.handleWheel)
    }
  }

  class Scene {
    constructor(config) {
      this.content = config.container
      const bounding = this.content.getBoundingClientRect()
      this.children = []
      this.canvas = new Canvas({
        pixel: window.devicePixelRatio,
        width: bounding.width,
        height: bounding.height
      })
      this.bounding = bounding
      this.mountCanvas()
    }
    mountCanvas() {
      this.content.appendChild(this.canvas.domElement)
    }
    add(shape) {
      this.children.push(shape)
    }
    render() {
      const { children, canvas, bounding } = this
      const ctx = canvas.ctx
      ctx.clearRect(0, 0, bounding.width, bounding.height)
      for (const shape of children) {
        shape.render(ctx)
      }
    }
  }
  const tableData = [
    {
      province: '浙江',
      city: '杭州',
      type: '笔',
      price: 1
    },
    {
      province: '浙江',
      city: '杭州',
      type: '纸张',
      price: 2
    },
    {
      province: '浙江',
      city: '舟山',
      type: '笔',
      price: 3
    },
    {
      province: '浙江',
      city: '舟山',
      type: '纸张',
      price: 4
    },
    {
      province: '吉林',
      city: '长春',
      type: '笔',
      price: 5
    },
    {
      province: '吉林',
      city: '白山',
      type: '笔',
      price: 6
    },
    {
      province: '河南',
      city: '洛阳',
      type: '纸张',
      price: 7
    },
    {
      province: '河南',
      city: '郑州',
      type: '笔',
      price: 8
    },
    {
      province: '江苏',
      city: '南京',
      type: '纸张',
      price: 9
    },
    {
      province: '上海',
      city: '上海',
      type: '纸张',
      price: 10
    }
  ]
  const data = []
  for (let index = 0; index < 5; index++) {
    data.push(...tableData)
  }
  const scene = new Scene({
    container: boxElement
  })
  const table = new Table({
    x: 10,
    y: 10,
    width: 400,
    height: 300,
    scene,
    columns: [
      { field: 'province', name: '省份' },
      { field: 'city', name: '城市' },
      { field: 'type', name: '类型' },
      { field: 'price', name: '价格' }
    ],
    data
  })
  scene.add(table)
  scene.render()

  onBeforeUnmount(() => table.destroy())
})
</script>

<style scoped>
.box {
  position: relative;
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  height: 60%;
  transform: translate(-50%, -50%);
  z-index: 0;
}
</style>
