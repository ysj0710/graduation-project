import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 响应式断点检测
 * @returns {Object} 响应式状态和方法
 */
export function useBreakpoint() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  // 断点状态
  const isMobile = ref(width.value < 768)
  const isTablet = ref(width.value >= 768 && width.value < 1024)
  const isDesktop = ref(width.value >= 1024)
  const isLargeDesktop = ref(width.value >= 1280)

  // 更新尺寸
  const updateSize = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight

    isMobile.value = width.value < 768
    isTablet.value = width.value >= 768 && width.value < 1024
    isDesktop.value = width.value >= 1024
    isLargeDesktop.value = width.value >= 1280
  }

  onMounted(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
    window.removeEventListener('orientationchange', updateSize)
  })

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop
  }
}

/**
 * 获取当前设备类型
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * 侧边栏状态管理
 */
export function useSidebar() {
  const isOpen = ref(true)
  const isCollapsed = ref(false)

  const toggle = () => {
    if (window.innerWidth < 768) {
      isOpen.value = !isOpen.value
    } else if (window.innerWidth < 1024) {
      isCollapsed.value = !isCollapsed.value
    }
  }

  const close = () => {
    if (window.innerWidth < 768) {
      isOpen.value = false
    }
  }

  const open = () => {
    isOpen.value = true
  }

  return {
    isOpen,
    isCollapsed,
    toggle,
    close,
    open
  }
}
