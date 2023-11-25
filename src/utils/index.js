export const getRandomColor = () => {
  const type = '0123456789ABCDEF'
  const len = type.length
  let color = '#'
  for (let index = 0; index < 6; index++) {
    color += type[Math.floor(Math.random() * len)]
  }
  return color
}

export const getNumberInRange = (min, max) => {
  const r = Math.random()
  return Math.round(r * (max - min) + min)
}

export const loadImage = (url) => {
  const image = new Image()
  image.crossOrigin = 'Anonymous';
  image.src = url
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject()
  })
}
