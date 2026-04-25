// 主题预设库 - 每个主题包含渐变背景、强调色、图表配色方案
export const THEME_PRESETS = [
  {
    id: 'aurora',
    name: '极光',
    description: '紫蓝极光，如梦似幻',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    primaryColor: '#8B5CF6',
    primarySoft: 'rgba(139, 92, 246, 0.15)',
    incomeColor: '#10B981',
    expenseColor: '#F87171',
    chartColors: ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#6366F1'],
    accentWarm: true,
    pattern: 'dots'
  },
  {
    id: 'sunset',
    name: '落日晚霞',
    description: '橘红晚霞，温暖如你',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 40%, #feada6 100%)',
    primaryColor: '#FF6B6B',
    primarySoft: 'rgba(255, 107, 107, 0.15)',
    incomeColor: '#51CF66',
    expenseColor: '#FF6B6B',
    chartColors: ['#FF6B6B', '#FFA07A', '#FFD700', '#FF69B4', '#FF4500', '#FF6347'],
    accentWarm: true,
    pattern: 'waves'
  },
  {
    id: 'forest',
    name: '森林秘境',
    description: '绿野仙踪，自然清新',
    gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    primaryColor: '#2D6A4F',
    primarySoft: 'rgba(45, 106, 79, 0.15)',
    incomeColor: '#52B788',
    expenseColor: '#E76F51',
    chartColors: ['#2D6A4F', '#40916C', '#52B788', '#95D5B2', '#74C69D', '#52B788'],
    accentWarm: false,
    pattern: 'leaves'
  },
  {
    id: 'ocean',
    name: '深海之梦',
    description: '蔚蓝深海，宁静治愈',
    gradient: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
    primaryColor: '#0077B6',
    primarySoft: 'rgba(0, 119, 182, 0.15)',
    incomeColor: '#48CAE4',
    expenseColor: '#FF6B6B',
    chartColors: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#CAF0F8', '#0096C7'],
    accentWarm: false,
    pattern: 'waves'
  },
  {
    id: 'sunrise',
    name: '日出晨曦',
    description: '金色阳光，充满希望',
    gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    primaryColor: '#F59E0B',
    primarySoft: 'rgba(245, 158, 11, 0.15)',
    incomeColor: '#10B981',
    expenseColor: '#EF4444',
    chartColors: ['#F59E0B', '#F97316', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'],
    accentWarm: true,
    pattern: 'rays'
  },
  {
    id: 'neon',
    name: '霓虹都市',
    description: '赛博朋克，炫酷潮流',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    primaryColor: '#00D9FF',
    primarySoft: 'rgba(0, 217, 255, 0.15)',
    incomeColor: '#39FF14',
    expenseColor: '#FF1493',
    chartColors: ['#00D9FF', '#FF1493', '#39FF14', '#FFD700', '#FF6EC7', '#00FFFF'],
    accentWarm: false,
    pattern: 'grid'
  },
  {
    id: 'sakura',
    name: '樱花物语',
    description: '粉嫩樱花，甜美浪漫',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    primaryColor: '#FF85A2',
    primarySoft: 'rgba(255, 133, 162, 0.15)',
    incomeColor: '#51CF66',
    expenseColor: '#FF6B6B',
    chartColors: ['#FF85A2', '#FFB3C1', '#FFC0CB', '#FF69B4', '#FFA07A', '#FFDAB9'],
    accentWarm: true,
    pattern: 'petals'
  },
  {
    id: 'aurora-green',
    name: '极光绿',
    description: '青翠欲滴，春意盎然',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    primaryColor: '#2ECC71',
    primarySoft: 'rgba(46, 204, 113, 0.15)',
    incomeColor: '#27AE60',
    expenseColor: '#E74C3C',
    chartColors: ['#2ECC71', '#1ABC9C', '#16A085', '#3498DB', '#9B59B6', '#E91E63'],
    accentWarm: false,
    pattern: 'dots'
  },
  {
    id: 'midnight',
    name: '午夜星空',
    description: '星河璀璨，探索未知',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 50%, #302b63 100%)',
    primaryColor: '#A78BFA',
    primarySoft: 'rgba(167, 139, 250, 0.15)',
    incomeColor: '#34D399',
    expenseColor: '#F87171',
    chartColors: ['#A78BFA', '#818CF8', '#C4B5FD', '#FDE68A', '#6EE7B7', '#93C5FD'],
    accentWarm: false,
    pattern: 'stars'
  },
  {
    id: 'mooncake',
    name: '古韵金秋',
    description: '金桂飘香，古典雅致',
    gradient: 'linear-gradient(135deg, #c9a96e 0%, #f8e1a6 50%, #e8c87a 100%)',
    primaryColor: '#B8860B',
    primarySoft: 'rgba(184, 134, 11, 0.15)',
    incomeColor: '#228B22',
    expenseColor: '#CD5C5C',
    chartColors: ['#B8860B', '#DAA520', '#CD853F', '#8B4513', '#A0522D', '#D2691E'],
    accentWarm: true,
    pattern: 'cloud'
  },
  {
    id: 'cyber',
    name: '赛博幻境',
    description: '电子脉冲，数字未来',
    gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    primaryColor: '#00D4FF',
    primarySoft: 'rgba(0, 212, 255, 0.15)',
    incomeColor: '#00FFA3',
    expenseColor: '#FF4757',
    chartColors: ['#00D4FF', '#0072FF', '#00FFA3', '#FF00FF', '#FFFF00', '#00FFFF'],
    accentWarm: false,
    pattern: 'circuit'
  },
  {
    id: 'retro',
    name: '复古胶片',
    description: '暖黄怀旧，岁月静好',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ee9b00 100%)',
    primaryColor: '#E76D2B',
    primarySoft: 'rgba(231, 109, 43, 0.15)',
    incomeColor: '#4CAF50',
    expenseColor: '#D32F2F',
    chartColors: ['#E76D2B', '#F4A460', '#CD853F', '#8B4513', '#D2691E', '#A0522D'],
    accentWarm: true,
    pattern: 'grid'
  }
]

// 背景图案 SVG 数据
export const PATTERNS = {
  dots: {
    name: '圆点',
    svg: `radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)`,
    bgSize: '24px 24px'
  },
  waves: {
    name: '波浪',
    svg: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.091-.404l1.384-.433C24.005 19.022 24.948 19 25.998 19c.357 0 .704.044 1.039.129a2.25 2.25 0 0 1 1.387 1.016c.217.36.323.77.303 1.193-.038.853-.323 1.634-.818 2.228-.48.57-1.12.958-1.835 1.114-.357.078-.718.117-1.078.117-.357 0-.711-.038-1.057-.117-.717-.156-1.355-.544-1.835-1.114-.495-.594-.78-1.375-.818-2.228a2.25 2.25 0 0 1 .303-1.193 2.25 2.25 0 0 1 1.387-1.016c.334-.085.682-.129 1.039-.129z' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`
  },
  stars: {
    name: '星星',
    svg: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M30 30l-3.09-6.26L21 21l6.26-3.09L30 11.64l2.74 6.27L39 21l-5.91 2.74L30 30zM15.5 42l2.47-5.01 5.51 2.74-2.47 5.01L15.5 42zm14.5 0l-2.47-5.01 5.51-2.74-2.47 5.01L30 42z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
  },
  grid: {
    name: '网格',
    svg: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
    bgSize: '30px 30px'
  },
  rays: {
    name: '光芒',
    svg: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E")`,
    bgSize: '100px 100px'
  },
  circuit: {
    name: '电路',
    svg: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 50 H40 V20 H60 V50 H90 M50 50 V80' stroke='rgba(0,217,255,0.12)' stroke-width='2' fill='none'/%3E%3Ccircle cx='50' cy='50' r='4' fill='rgba(0,217,255,0.3)'/%3E%3Ccircle cx='10' cy='50' r='3' fill='rgba(0,217,255,0.2)'/%3E%3Ccircle cx='90' cy='50' r='3' fill='rgba(0,217,255,0.2)'/%3E%3Ccircle cx='50' cy='20' r='3' fill='rgba(0,217,255,0.2)'/%3E%3Ccircle cx='50' cy='80' r='3' fill='rgba(0,217,255,0.2)'/%3E%3C/svg%3E")`,
    bgSize: '100px 100px'
  },
  petals: {
    name: '花瓣',
    svg: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.15)' transform='rotate(0 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.1)' transform='rotate(60 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.08)' transform='rotate(120 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.06)' transform='rotate(180 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.04)' transform='rotate(240 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='15' ry='25' fill='rgba(255,182,193,0.03)' transform='rotate(300 40 40)'/%3E%3Ccircle cx='40' cy='40' r='6' fill='rgba(255,105,180,0.2)'/%3E%3C/svg%3E")`,
    bgSize: '80px 80px'
  },
  cloud: {
    name: '祥云',
    svg: `url("data:image/svg+xml,%3Csvg width='120' height='80' viewBox='0 0 120 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='60' cy='50' rx='50' ry='25' fill='rgba(255,255,255,0.08)'/%3E%3Cellipse cx='40' cy='40' rx='30' ry='20' fill='rgba(255,255,255,0.06)'/%3E%3Cellipse cx='80' cy='38' rx='28' ry='18' fill='rgba(255,255,255,0.06)'/%3E%3Cellipse cx='60' cy='32' rx='35' ry='20' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E")`,
    bgSize: '120px 80px'
  },
  leaves: {
    name: '叶片',
    svg: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q35 15 30 25 Q25 15 30 5' fill='rgba(255,255,255,0.12)'/%3E%3Cpath d='M30 35 Q35 45 30 55 Q25 45 30 35' fill='rgba(255,255,255,0.08)'/%3E%3Cpath d='M10 20 Q20 25 15 35 Q5 30 10 20' fill='rgba(255,255,255,0.06)'/%3E%3Cpath d='M50 25 Q55 30 50 40 Q45 35 50 25' fill='rgba(255,255,255,0.06)'/%3E%3C/svg%3E")`,
    bgSize: '60px 60px'
  },
  none: {
    name: '无图案',
    svg: 'none',
    bgSize: '0'
  }
}

export function getThemeStyle(theme) {
  const pattern = PATTERNS[theme.pattern] || PATTERNS.none
  const bg = pattern.svg === 'none' ? theme.gradient : `${theme.gradient}, ${pattern.svg}`
  const bgSize = pattern.bgSize === '0' ? 'auto' : pattern.bgSize === '24px 24px'
    ? `cover, 24px 24px`
    : pattern.bgSize === '30px 30px'
    ? `cover, 30px 30px`
    : pattern.bgSize

  if (pattern.svg === 'none') {
    return {
      background: theme.gradient,
      backgroundSize: 'cover'
    }
  }

  return {
    background: bg,
    backgroundSize: pattern.bgSize === '0' ? 'cover' : `cover, ${pattern.bgSize}`
  }
}

export function getChartColorScheme(theme) {
  return theme.chartColors || ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#6366F1']
}
