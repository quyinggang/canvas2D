const getRandomColor = () => {
  const type = '0123456789ABCDEF'
  const len = type.length
  let color = '#'
  for (let index = 0; index < 6; index++) {
    color += type[Math.floor(Math.random() * len)]
  }
  return color
}

class Circle {
  constructor(config) {
    this.x = config.x
    this.y = config.y
    this.color = config.color
    this.radius = config.radius
  }
  render(ctx) {
    const { radius, color, x, y } = this
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }
}

self.onmessage = (evt) => {
  const { canvas, type, size } = evt.data
  if (canvas) {
    const width = canvas.width
    const height = canvas.height
    const ctx = canvas.getContext('2d')
    for (let index = 0; index < 1000; index++) {
      const circle = new Circle({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 20,
        color: getRandomColor()
      })
      circle.render(ctx)
    }
  }
  if (type === 'init') {
    const width = size.width
    const height = size.height
    const offscreen = new OffscreenCanvas(width, height)
    const ctx = offscreen.getContext('2d')
    for (let index = 0; index < 1000; index++) {
      const circle = new Circle({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 20,
        color: getRandomColor()
      })
      circle.render(ctx)
    }
    const imageBitmap = offscreen.transferToImageBitmap()
    // 传送给主线程
    postMessage({ imageBitmap }, [imageBitmap])
  }
}
