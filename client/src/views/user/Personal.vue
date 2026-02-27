<template>
  <div class="user-page">
    <div class="page-header">
      <h2>🎨 个性设置</h2>
      <p class="subtitle">自定义你的记账页面风格</p>
    </div>

    <!-- 主题设置 -->
    <div class="settings-section">
      <h3>选择主题</h3>
      <div class="theme-grid">
        <div 
          v-for="theme in themes" 
          :key="theme.id"
          class="theme-card"
          :class="{ active: currentTheme === theme.id }"
          @click="selectTheme(theme)"
        >
          <div class="theme-preview" :style="{ background: theme.gradient }">
            <div class="theme-overlay">
              <span class="theme-name">{{ theme.name }}</span>
            </div>
          </div>
          <div class="theme-colors">
            <div 
              class="color-bar"
              :style="{ background: theme.gradient }"
            ></div>
            <div class="color-slots">
              <span 
                v-for="color in theme.colors" 
                :key="color"
                class="color-slot"
                :style="{ background: color }"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 背景透明度 -->
    <div class="settings-section">
      <h3>毛玻璃效果</h3>
      <div class="glass-control">
        <div class="glass-preview">
          <div class="glass-box" :style="{ backdropFilter: `blur(${glassBlur}px)` }">
            <span>{{ glassBlur }}px</span>
          </div>
        </div>
        <div class="slider-control">
          <input 
            type="range" 
            v-model="glassBlur" 
            min="0" 
            max="40" 
            step="5"
            @change="updateGlassEffect"
          />
          <div class="slider-labels">
            <span>清晰</span>
            <span>模糊</span>
          </div>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const currentTheme = ref('aurora')
const glassBlur = ref(20)

const budget = reactive({
  monthly: userStore.budget.monthly || 5000,
  alertThreshold: userStore.budget.alertThreshold || 80
})

const themes = [
  {
    id: 'daishan',
    name: '黛青山',
    gradient: 'linear-gradient(90deg, #5A8A9F 0%, #8AC4D0 25%, #B8E0E8 50%, #D0EAF0 75%, #E8F8FA 100%)',
    colors: ['#5A8A9F', '#8AC4D0', '#B8E0E8', '#D0EAF0', '#E8F8FA']
  },
  {
    id: 'zi',
    name: '紫',
    gradient: 'linear-gradient(90deg, #A57DB4 0%, #C4A8D0 25%, #D8C8E0 50%, #E8E0F0 75%, #F0E8F4 100%)',
    colors: ['#A57DB4', '#C4A8D0', '#D8C8E0', '#E8E0F0', '#F0E8F4']
  },
  {
    id: 'chuchun',
    name: '初春',
    gradient: 'linear-gradient(90deg, #A8D0A8 0%, #C8E0C8 25%, #D8F0D0 50%, #E8F8E0 75%, #F0FCF0 100%)',
    colors: ['#A8D0A8', '#C8E0C8', '#D8F0D0', '#E8F8E0', '#F0FCF0']
  },
  {
    id: 'rulin',
    name: '儒林苑',
    gradient: 'linear-gradient(90deg, #F17156 0%, #F89878 25%, #FFB8A0 50%, #FFD0C0 75%, #FFE0D0 100%)',
    colors: ['#F17156', '#F89878', '#FFB8A0', '#FFD0C0', '#FFE0D0']
  },
  {
    id: 'youzhu',
    name: '幽竹清溪',
    gradient: 'linear-gradient(90deg, #4DC7A4 0%, #78D0B8 25%, #A8E0D0 50%, #D0F0E0 75%, #E8F8F0 100%)',
    colors: ['#4DC7A4', '#78D0B8', '#A8E0D0', '#D0F0E0', '#E8F8F0']
  },
  {
    id: 'mo',
    name: '墨色',
    gradient: 'linear-gradient(90deg, #707070 0%, #909090 25%, #B0B0B0 50%, #D0D0D0 75%, #E8E8E8 100%)',
    colors: ['#707070', '#909090', '#B0B0B0', '#D0D0D0', '#E8E8E8']
  },
  {
    id: 'huangdou',
    name: '黄豆沙',
    gradient: 'linear-gradient(90deg, #B89090 0%, #D0A8A8 25%, #E0B8B8 50%, #F0D0D0 75%, #F8E0E0 100%)',
    colors: ['#B89090', '#D0A8A8', '#E0B8B8', '#F0D0D0', '#F8E0E0']
  },
  {
    id: 'yuanmu',
    name: '原木',
    gradient: 'linear-gradient(90deg, #C8B890 0%, #E0D0A8 25%, #E8D8B8 50%, #F0E0C8 75%, #F8E8D0 100%)',
    colors: ['#C8B890', '#E0D0A8', '#E8D8B8', '#F0E0C8', '#F8E8D0']
  }
]

const selectTheme = (theme) => {
  currentTheme.value = theme.id
  userStore.updateTheme({
    background: theme.gradient,
    glassBlur: glassBlur.value
  })
  ElMessage.success(`已切换至「${theme.name}」主题`)
}

const updateGlassEffect = () => {
  userStore.updateTheme({
    background: themes.find(t => t.id === currentTheme.value)?.gradient,
    glassBlur: glassBlur.value
  })
}

const updateBudget = () => {
  userStore.updateBudget({
    monthly: budget.monthly,
    alertThreshold: budget.alertThreshold
  })
  ElMessage.success('预算设置已保存')
}
</script>

<style scoped>
.user-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #8E8E93;
  margin: 8px 0 0 0;
}

.settings-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.settings-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0 0 20px 0;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.theme-card {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.theme-card:hover {
  transform: translateY(-4px);
}

.theme-card.active {
  border-color: #007AFF;
}

.theme-preview {
  height: 80px;
  position: relative;
}

.theme-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.theme-card:hover .theme-overlay,
.theme-card.active .theme-overlay {
  opacity: 1;
}

.theme-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.theme-colors {
  display: flex;
  gap: 6px;
  padding: 10px;
  background: #F5F5F7;
}

.color-bar {
  width: 100%;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.color-slots {
  display: flex;
  gap: 3px;
  margin-top: 8px;
  padding: 4px;
  background: #f5f5f7;
  border-radius: 6px;
}

.color-slot {
  flex: 1;
  height: 14px;
  border-radius: 2px;
  min-width: 0;
}

/* 毛玻璃控制 */
.glass-control {
  display: flex;
  align-items: center;
  gap: 32px;
}

.glass-preview {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-box {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

.slider-control {
  flex: 1;
}

.slider-control input[type="range"] {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: #E5E5EA;
  border-radius: 4px;
  outline: none;
}

.slider-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #8E8E93;
}

/* 预算设置 */
.budget-setting {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F5F5F7;
  border-radius: 14px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.setting-desc {
  font-size: 13px;
  color: #8E8E93;
}
</style>
