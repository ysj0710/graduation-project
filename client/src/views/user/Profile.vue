<template>
  <div class="user-app-container">
    <!-- 顶部导航 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" circle @click="$router.back()" />
      <span class="title">我的</span>
      <div style="width: 60px;"></div>
    </div>

    <!-- 用户信息 -->
    <div class="profile-card" :style="{ background: userStore.theme.background }">
      <el-avatar :size="64" :src="userStore.profile.avatar">
        {{ userStore.profile.nickname?.charAt(0) || 'U' }}
      </el-avatar>
      <div class="user-info">
        <div class="name">{{ userStore.profile.nickname || userStore.profile.username }}</div>
        <div class="email">{{ userStore.profile.email }}</div>
      </div>
    </div>

    <!-- 主题设置 -->
    <div class="settings-section">
      <div class="section-title">主题设置</div>
      <div class="theme-grid">
        <div 
          v-for="theme in presetThemes" 
          :key="theme.id"
          class="theme-item"
          :class="{ active: userStore.theme.background === theme.background }"
          @click="selectTheme(theme)"
        >
          <div class="theme-preview" :style="{ background: theme.background }"></div>
          <span class="theme-name">{{ theme.name }}</span>
        </div>
      </div>
    </div>

    <!-- 预算设置 -->
    <div class="settings-section">
      <div class="section-title">预算设置</div>
      <div class="budget-setting">
        <div class="budget-item">
          <span class="label">月度预算</span>
          <el-input-number 
            v-model="budget.monthly" 
            :min="0" 
            :step="500"
            size="small"
            @change="updateBudget"
          />
        </div>
        <div class="budget-item">
          <span class="label">预警阈值</span>
          <el-input-number 
            v-model="budget.alertThreshold" 
            :min="50" 
            :max="100"
            :step="5"
            size="small"
            @change="updateBudget"
          />
          <span class="suffix">%</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-item" @click="$router.push('/')">
        <el-icon><HomeFilled /></el-icon>
        <span>返回首页</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ArrowLeft, HomeFilled, SwitchButton, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const budget = reactive({
  monthly: 5000,
  alertThreshold: 80
})

const presetThemes = [
  { id: 'green', name: '翠绿', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', primaryColor: '#10B981' },
  { id: 'blue', name: '蔚蓝', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', primaryColor: '#3B82F6' },
  { id: 'purple', name: '浪漫', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', primaryColor: '#8B5CF6' },
  { id: 'pink', name: '粉红', background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', primaryColor: '#EC4899' },
  { id: 'orange', name: '暖阳', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', primaryColor: '#F59E0B' },
  { id: 'red', name: '枫叶', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', primaryColor: '#EF4444' }
]

const selectTheme = (theme) => {
  userStore.updateTheme({
    background: theme.background,
    primaryColor: theme.primaryColor
  })
  ElMessage.success('主题已更换')
}

const updateBudget = () => {
  userStore.updateBudget({
    monthly: budget.monthly,
    alertThreshold: budget.alertThreshold
  })
  ElMessage.success('预算已更新')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  userStore.fetchProfile()
  budget.monthly = userStore.budget.monthly
  budget.alertThreshold = userStore.budget.alertThreshold
})
</script>

<style scoped>
.user-app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #F3F4F6;
  padding-bottom: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.profile-card {
  padding: 32px 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info .name {
  font-size: 20px;
  font-weight: 600;
}

.user-info .email {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}

.settings-section {
  background: white;
  margin: 12px 16px;
  border-radius: 16px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 14px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  height: 60px;
  border-radius: 12px;
  transition: transform 0.2s;
}

.theme-item.active .theme-preview {
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--primary);
}

.theme-item:active .theme-preview {
  transform: scale(0.95);
}

.theme-name {
  font-size: 12px;
  color: #6B7280;
}

.budget-setting {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.budget-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.budget-item .label {
  font-size: 14px;
  color: #374151;
}

.budget-item .suffix {
  margin-left: 8px;
  color: #9CA3AF;
}

.menu-section {
  background: white;
  margin: 12px 16px;
  border-radius: 16px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:active {
  background: #F9FAFB;
}

.menu-item .el-icon:first-child {
  font-size: 20px;
  color: #6B7280;
}

.menu-item span {
  flex: 1;
  font-size: 14px;
  color: #111827;
}

.menu-item .arrow {
  color: #D1D5DB;
}
</style>
