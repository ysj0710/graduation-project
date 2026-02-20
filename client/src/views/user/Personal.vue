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
            <span 
              v-for="color in theme.colors" 
              :key="color"
              class="color-dot"
              :style="{ background: color }"
            ></span>
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

    <!-- 预算提醒 -->
    <div class="settings-section">
      <h3>预算提醒</h3>
      <div class="budget-setting">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">月度预算</span>
            <span class="setting-desc">设置每月支出上限</span>
          </div>
          <el-input-number v-model="budget.monthly" :min="0" :step="500" size="large" @change="updateBudget" />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">预警阈值</span>
            <span class="setting-desc">达到预算的{{ budget.alertThreshold }}%时提醒</span>
          </div>
          <el-slider v-model="budget.alertThreshold" :min="50" :max="100" :step="5" style="width: 200px" @change="updateBudget" />
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
    id: 'aurora',
    name: '极光',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb']
  },
  {
    id: 'ocean',
    name: '海洋',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    colors: ['#4facfe', '#00f2fe']
  },
  {
    id: 'sunset',
    name: '日落',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    colors: ['#fa709a', '#fee140']
  },
  {
    id: 'forest',
    name: '森林',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    colors: ['#11998e', '#38ef7d']
  },
  {
    id: 'midnight',
    name: '午夜',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
    colors: ['#2c3e50', '#4ca1af']
  },
  {
    id: 'candy',
    name: '糖果',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    colors: ['#ff9a9e', '#fecfef']
  },
  {
    id: 'nebula',
    name: '星云',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    colors: ['#0f0c29', '#302b63', '#24243e']
  },
  {
    id: 'peach',
    name: '蜜桃',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    colors: ['#ffecd2', '#fcb69f']
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

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex: 1;
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
