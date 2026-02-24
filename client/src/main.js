import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './tailwind.css'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

// 断网自动退出登录
const handleOffline = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElementPlus.ElMessage.warning('网络连接已断开，请重新登录')
  setTimeout(() => {
    window.location.href = '/'
  }, 1500)
}

window.addEventListener('offline', handleOffline)

// 页面加载时检查网络状态
if (!navigator.onLine) {
  handleOffline()
}
