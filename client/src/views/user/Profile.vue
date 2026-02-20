<template>
  <div class="user-page">
    <div class="page-header">
      <h2>👤 个人中心</h2>
      <p class="subtitle">管理你的账户和关联服务</p>
    </div>

    <!-- 用户信息 -->
    <div class="user-card">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="userStore.profile.avatar">
            {{ userStore.profile.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <button class="avatar-edit-btn" @click="changeAvatar">
            <span>📷</span>
          </button>
        </div>
        <div class="user-info">
          <input 
            v-model="userInfo.nickname" 
            class="nickname-input" 
            placeholder="输入昵称"
            @blur="updateNickname"
          />
          <span class="user-email">{{ userStore.profile.email }}</span>
        </div>
      </div>
    </div>

    <!-- 账户关联 -->
    <div class="settings-section">
      <h3>🔗 账户关联</h3>
      <p class="section-desc">关联微信/支付宝后，可一键导入账单</p>
      
      <div class="link-cards">
        <!-- 微信 -->
        <div class="link-card" :class="{ linked: wechat.linked }">
          <div class="link-icon wechat">
            <span v-if="!wechat.linked">💬</span>
            <img v-else src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2307C160'%3E%3Cpath d='M8.5 11.5C8.5 10.12 9.62 9 11 9C12.38 9 13.5 10.12 13.5 11.5C13.5 12.88 12.38 14 11 14C9.62 14 8.5 12.88 8.5 11.5Z'/%3E%3Cpath d='M15.5 11.5C15.5 10.12 16.62 9 18 9C19.38 9 20.5 10.12 20.5 11.5C20.5 12.88 19.38 14 18 14C16.62 14 15.5 12.88 15.5 11.5Z'/%3E%3Cpath d='M11 6C8.24 6 6 8.24 6 11C6 12.54 6.73 13.88 7.81 14.76L6 19H8.2C8.2 20.43 9.37 21.5 10.8 21.5C11.29 21.5 11.74 21.34 12.12 21.08L13.79 22.75C14.43 23.39 15.5 23.39 16.14 22.75L18.92 19.94C18.97 19.97 19.01 20 19.05 20.03C19.48 20.43 19.76 21 19.76 21.5H21.9C22.53 21.5 23.05 21.05 23.17 20.43L23.95 16.14C24.42 14.35 23.05 12.71 21.22 12.95C20.72 9.08 17.64 6 13.5 6L11 6Z'/%3E%3C/svg%3E" alt="wechat" />
          </div>
          <div class="link-info">
            <span class="link-name">微信</span>
            <span class="link-status">{{ wechat.linked ? wechat.account : '未关联' }}</span>
          </div>
          <button 
            class="link-btn" 
            :class="wechat.linked ? 'unlink' : 'link'"
            @click="toggleWechat"
          >
            {{ wechat.linked ? '解除' : '关联' }}
          </button>
        </div>

        <!-- 支付宝 -->
        <div class="link-card" :class="{ linked: alipay.linked }">
          <div class="link-icon alipay">
            <span v-if="!alipay.linked">💳</span>
            <img v-else src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231677FF'%3E%3Cpath d='M19.5 8C17 8 15 6.5 15 4.5C15 3.67 15.33 3 16 3C16.57 3 17 3.33 17 4C17 4.5 17.33 5 18 5C18.5 5 19 5.33 19 6C19.67 6 20 6.5 20 7.5C20 8 19.67 8.5 19 9C18.5 9.33 18 9.5 17.5 9.5C17.33 9.5 17 9.33 17 9C17 8.5 16.67 8 16 8C15.67 8 15.5 8.33 15.5 8.5C15.5 9 16 9.5 16.5 10C17.5 10.67 18 11.5 18 12.5C18 14.5 16.5 16 14.5 16H7C4.5 16 3 14.5 3 12C3 10.5 4 9.5 5 9C5.5 8.5 6 8.5 6.5 9C7 9.5 7.33 10 7.33 10.5C7.33 11 7 11.5 6.5 11.5C6.33 11.5 6 11.33 6 11C5.67 10.33 5.33 9.5 5.33 9C5.33 8 6 7 7 6.5C7.5 6.17 8 6.33 8.5 6.5C9 6.67 9.5 7 9.5 7.5C9.5 8 9.33 8.5 9 9C8.67 9.33 8.5 9.67 8.5 10C8.5 10.5 8.67 11 9 11.5C9.33 12 9.5 12.5 9.5 13C9.5 14 8.5 15 7.5 15.5C7.67 15.33 8 15.33 8.5 15.33C9.33 15.33 10.17 15.67 10.83 16.33C11.17 16.67 11.83 16.67 12.17 16.33C12.5 16 12.5 15.5 12.5 15C12.5 14.5 12.33 14 12 13.5C11.67 13 11.5 12.5 11.5 12C11.5 11.33 11.67 10.83 12 10.5C12.33 10.17 12.67 10 13 10C13.5 10 14 10.17 14.5 10.5C15 10.83 15.33 11.33 15.33 12C15.33 12.67 15 13.5 14.5 14H14.33C14 14 13.67 14 13.33 14C12.67 14 12.17 13.67 12 13.33C11.83 13 11.83 12.5 12 12C12.17 11.67 12.33 11.33 12.67 11.17C13 11 13.5 11 14 11.17C14.5 11.33 14.83 11.67 14.83 12.17C14.83 12.67 14.5 13.17 14 13.67C13.5 14.17 13 14.5 12.5 14.67V14.83C13.17 14.83 14 14.67 14.67 14.33C15.33 14 15.83 13.33 15.83 12.5C15.83 12.17 15.67 11.83 15.5 11.5C15.17 11 15.17 10.5 15.5 10C15.67 9.67 16 9.5 16.33 9.5C16.67 9.5 17 9.67 17.33 10C18.17 10.83 18.5 12 18.5 13C18.5 14.67 17.5 16 16 17C16.17 16.83 16.5 16.83 17 17C18.33 17.67 19.33 18.67 19.5 20C21.5 19 23 17 23 14.5C23 12 21.5 10 19.5 8Z'/%3E%3C/svg%3E" alt="alipay" />
          </div>
          <div class="link-info">
            <span class="link-name">支付宝</span>
            <span class="link-status">{{ alipay.linked ? alipay.account : '未关联' }}</span>
          </div>
          <button 
            class="link-btn" 
            :class="alipay.linked ? 'unlink' : 'link'"
            @click="toggleAlipay"
          >
            {{ alipay.linked ? '解除' : '关联' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入账单 -->
    <div class="settings-section">
      <h3>📥 导入账单</h3>
      <p class="section-desc">从已关联的账户导入历史账单</p>
      
      <div class="import-options">
        <button 
          class="import-btn" 
          :disabled="!wechat.linked"
          @click="importFromWechat"
        >
          <span class="import-icon">💬</span>
          <span>从微信导入</span>
          <span v-if="!wechat.linked" class="import-tip">请先关联微信</span>
        </button>
        
        <button 
          class="import-btn" 
          :disabled="!alipay.linked"
          @click="importFromAlipay"
        >
          <span class="import-icon">💳</span>
          <span>从支付宝导入</span>
          <span v-if="!alipay.linked" class="import-tip">请先关联支付宝</span>
        </button>
      </div>
      
      <!-- 手动上传 -->
      <div class="manual-import">
        <p class="divider-text">或手动上传账单文件</p>
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          accept=".csv,.xlsx"
          @change="handleFileChange"
        >
          <div class="upload-content">
            <span class="upload-icon">📤</span>
            <span class="upload-text">点击或拖拽文件到此处</span>
            <span class="upload-hint">支持 CSV、XLSX 格式</span>
          </div>
        </el-upload>
      </div>
    </div>

    <!-- 其他设置 -->
    <div class="settings-section">
      <h3>⚙️ 其他设置</h3>
      <div class="menu-list">
        <div class="menu-item" @click="changePassword">
          <span class="menu-icon">🔐</span>
          <span>修改密码</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="clearCache">
          <span class="menu-icon">🗑️</span>
          <span>清除缓存</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="handleLogout">
          <span class="menu-icon">🚪</span>
          <span class="danger">退出登录</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const userInfo = reactive({
  nickname: userStore.profile.nickname || ''
})

const wechat = reactive({
  linked: false,
  account: '已关联'
})

const alipay = reactive({
  linked: false,
  account: '已关联'
})

const changeAvatar = () => {
  ElMessage.info('头像修改功能开发中')
}

const updateNickname = () => {
  if (userInfo.nickname) {
    ElMessage.success('昵称已更新')
  }
}

const toggleWechat = () => {
  if (wechat.linked) {
    ElMessageBox.confirm('确定要解除微信关联吗？', '确认', {
      confirmButtonText: '解除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      wechat.linked = false
      ElMessage.success('已解除微信关联')
    })
  } else {
    // 模拟关联流程
    ElMessage.info('正在跳转微信授权页面...')
    setTimeout(() => {
      wechat.linked = true
      ElMessage.success('微信关联成功')
    }, 1500)
  }
}

const toggleAlipay = () => {
  if (alipay.linked) {
    ElMessageBox.confirm('确定要解除支付宝关联吗？', '确认', {
      confirmButtonText: '解除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      alipay.linked = false
      ElMessage.success('已解除支付宝关联')
    })
  } else {
    ElMessage.info('正在跳转支付宝授权页面...')
    setTimeout(() => {
      alipay.linked = true
      ElMessage.success('支付宝关联成功')
    }, 1500)
  }
}

const importFromWechat = () => {
  ElMessage.info('正在从微信导入账单...')
}

const importFromAlipay = () => {
  ElMessage.info('正在从支付宝导入账单...')
}

const handleFileChange = (file) => {
  ElMessage.success(`已选择文件: ${file.name}`)
}

const changePassword = () => {
  ElMessage.info('密码修改功能开发中')
}

const clearCache = () => {
  ElMessage.success('缓存已清除')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  })
}
</script>

<style scoped>
.user-page {
  padding: 24px;
  max-width: 600px;
}

.page-header {
  margin-bottom: 24px;
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

.user-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrapper {
  position: relative;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nickname-input {
  font-size: 20px;
  font-weight: 600;
  border: none;
  background: transparent;
  outline: none;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: border-color 0.3s;
}

.nickname-input:focus {
  border-color: #007AFF;
}

.user-email {
  font-size: 14px;
  color: #8E8E93;
  margin-top: 4px;
  display: block;
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
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: #8E8E93;
  margin: 8px 0 20px 0;
}

.link-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F5F5F7;
  border-radius: 14px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.link-card.linked {
  background: rgba(52, 199, 89, 0.1);
  border-color: rgba(52, 199, 89, 0.3);
}

.link-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: white;
}

.link-icon.wechat {
  background: rgba(7, 193, 96, 0.15);
}

.link-icon.alipay {
  background: rgba(22, 119, 255, 0.15);
}

.link-icon img {
  width: 28px;
  height: 28px;
}

.link-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.link-name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.link-status {
  font-size: 12px;
  color: #8E8E93;
}

.link-card.linked .link-status {
  color: #34C759;
}

.link-btn {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.link-btn.link {
  background: #007AFF;
  color: white;
}

.link-btn.unlink {
  background: #E5E5EA;
  color: #FF3B30;
}

/* 导入账单 */
.import-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.import-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #F5F5F7;
  border: 2px dashed #D1D1D6;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.import-btn:hover:not(:disabled) {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-icon {
  font-size: 28px;
}

.import-btn span:not(.import-icon) {
  font-size: 14px;
  font-weight: 500;
  color: #000;
}

.import-tip {
  font-size: 11px !important;
  color: #8E8E93 !important;
}

.manual-import {
  margin-top: 24px;
}

.divider-text {
  text-align: center;
  color: #8E8E93;
  font-size: 13px;
  margin: 20px 0;
}

.upload-area {
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
}

.upload-icon {
  font-size: 36px;
}

.upload-text {
  font-size: 14px;
  color: #000;
}

.upload-hint {
  font-size: 12px;
  color: #8E8E93;
}

/* 菜单列表 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #F5F5F7;
}

.menu-icon {
  font-size: 20px;
}

.menu-item span:nth-child(2) {
  flex: 1;
  font-size: 14px;
  color: #000;
}

.menu-item .danger {
  color: #FF3B30;
}

.menu-arrow {
  color: #C7C7CC;
  font-size: 18px;
}
</style>
