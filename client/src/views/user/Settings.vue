<template>
  <div class="user-page">
    <div class="page-header">
      <h2>⚙️ 设置</h2>
    </div>
    
    <!-- 主题设置 -->
    <div class="settings-section">
      <h3>主题</h3>
      <div class="theme-grid">
        <div 
          v-for="theme in themes" 
          :key="theme.id"
          class="theme-item"
          :class="{ active: currentTheme === theme.id }"
          @click="selectTheme(theme)"
        >
          <div class="theme-preview" :style="{ background: theme.gradient }"></div>
          <span>{{ theme.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 预算设置 -->
    <div class="settings-section">
      <h3>预算设置</h3>
      <div class="setting-item">
        <span>月度预算</span>
        <el-input-number v-model="budget" :min="0" :step="500" size="small" />
      </div>
    </div>
    
    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="about-info">
        <p>随手记 v1.0.0</p>
        <p>基于 Node.js 的个人财务记账系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

const themes = [
  { id: 'blue', name: '蓝色', gradient: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' },
  { id: 'green', name: '绿色', gradient: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)' },
  { id: 'purple', name: '紫色', gradient: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)' },
  { id: 'orange', name: '橙色', gradient: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)' }
]

const currentTheme = ref('blue')
const budget = ref(5000)

const selectTheme = (theme) => {
  currentTheme.value = theme.id
  userStore.updateTheme({
    background: theme.gradient,
    primaryColor: theme.gradient.split(' ')[1].replace('0%,', '').replace('100%)', '')
  })
}
</script>

<style scoped>
.user-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.settings-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.settings-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.theme-preview {
  width: 100%;
  height: 50px;
  border-radius: 12px;
}

.theme-item.active .theme-preview {
  box-shadow: 0 0 0 3px white, 0 0 0 5px #007AFF;
}

.theme-item span {
  font-size: 12px;
  color: #8E8E93;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-item span {
  font-size: 14px;
  color: #000;
}

.about-info {
  font-size: 13px;
  color: #8E8E93;
}

.about-info p {
  margin: 4px 0;
}
</style>
