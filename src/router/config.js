const basicList = [
  {
    path: '/clock',
    title: '时钟',
    componentName: 'Clock'
  },
  {
    path: '/chart',
    title: '简易图表',
    componentName: 'Chart'
  },
  {
    path: '/ball',
    title: '跳动小球',
    componentName: 'Ball'
  },
  {
    path: '/colorful',
    title: '炫彩小球',
    componentName: 'Colorful'
  },
  {
    path: '/erase',
    title: '刮刮乐',
    componentName: 'Erase'
  },
  {
    path: '/paint',
    title: '简易画板',
    componentName: 'Paint'
  },
  {
    path: '/svg',
    title: '绘制SVG内容',
    componentName: 'Svg'
  },
  {
    path: '/solar',
    title: '太阳系',
    componentName: 'Solar'
  },
  {
    path: '/flyline',
    title: '飞线',
    componentName: 'Flyline'
  },
  {
    path: '/dynamic',
    title: '动态离子',
    componentName: 'Dynamic'
  },
  {
    path: '/flow',
    title: '粒子游动',
    componentName: 'Flow'
  },
  {
    path: '/swiper',
    title: '图片滑动验证码',
    componentName: 'Swiper'
  },
  {
    path: '/Table',
    title: '简易表格',
    componentName: 'Table'
  },
  {
    path: '/fireworks',
    title: '烟花',
    componentName: 'Fireworks'
  },
  {
    path: '/snake',
    title: '贪吃蛇',
    componentName: 'Snake'
  },
]

const advancedList = [
  {
    path: '/fighter',
    title: '飞机大战',
    componentName: 'Fighter'
  },
  {
    path: '/snake2',
    title: '贪吃蛇进阶版',
    componentName: 'Snake'
  },
  {
    path: '/sceneMap',
    title: '简单场景地图',
    componentName: 'SceneMap'
  },
  {
    path: '/miniMap',
    title: '场景小地图',
    componentName: 'MiniMap'
  }
]

const coordinateList = [
  {
    path: '/coordinate',
    title: '坐标系转换',
    componentName: 'Coordinate'
  },
  {
    path: '/drag',
    title: '图形拖拽',
    componentName: 'Drag'
  },
  {
    path: '/panzoom',
    title: '拖动和缩放画布',
    componentName: 'Panzoom'
  },
  {
    path: '/rotation',
    title: '图形旋转',
    componentName: 'Rotation'
  },
  {
    path: '/select',
    title: '图形拾取',
    componentName: 'Select'
  },
]

const optimizationList = [
  {
    path: '/buffer',
    title: '离屏缓冲Canvas',
    componentName: 'Buffer'
  },
  {
    path: '/client',
    title: '可视区域渲染',
    componentName: 'ClientRender'
  },
  {
    path: '/layer',
    title: '分层Canvas',
    componentName: 'Layer'
  },
  {
    path: '/partRender',
    title: '局部渲染',
    componentName: 'PartRender'
  },
  {
    path: '/worker',
    title: '离屏&Worker',
    componentName: 'Worker'
  }
]

export default [
  {
    dir: 'basic',
    list: basicList
  },
  {
    dir: 'coordinate',
    list: coordinateList
  },
  {
    dir: 'advance',
    list: advancedList
  },
  {
    dir: 'optimization',
    list: optimizationList
  }
]
