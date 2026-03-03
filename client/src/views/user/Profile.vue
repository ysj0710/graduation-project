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

    <!-- 其他设置 -->
    <div class="settings-section">
      <h3>⚙️ 其他设置</h3>
      <div class="menu-list">
        <div class="menu-item" @click="changePassword">
          <span class="menu-icon">🔐</span>
          <span>修改密码</span>
          <span class="menu-arrow">›</span>
        </div>
        
        <div class="menu-item" @click="handleLogout">
          <span class="menu-icon">🚪</span>
          <span>退出登录</span>
          <span class="menu-arrow">›</span>
        </div>
        
        <div class="menu-item" @click="handleDeleteAccount">
          <span class="menu-icon">🗑️</span>
          <span class="danger">注销账号</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 验证码确认对话框 -->
  <el-dialog 
    v-model="verifyDialogVisible" 
    :title="verifyPurpose === 'password' ? '修改密码' : '注销账号'"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="邮箱">
        <el-input v-model="verifyForm.email" disabled />
      </el-form-item>
      <el-form-item label="验证码">
        <div class="code-input-wrapper">
          <el-input v-model="verifyForm.code" placeholder="请输入验证码" />
          <el-button 
            @click="sendVerifyCode" 
            :disabled="countdown > 0"
            :loading="sendCodeLoading"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item v-if="verifyPurpose === 'password'" label="新密码">
        <el-input v-model="verifyForm.newPassword" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="verifyDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleVerify" :loading="verifyLoading">
        {{ verifyPurpose === 'password' ? '确认修改' : '确认注销' }}
      </el-button>
    </template>
  </el-dialog>
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

// 验证码相关状态
const verifyDialogVisible = ref(false)
const verifyPurpose = ref('') // 'password' or 'delete'
const verifyForm = reactive({
  email: '',
  code: '',
  newPassword: ''
})
const verifyLoading = ref(false)
const sendCodeLoading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const budget = reactive({
  monthly: userStore.budget?.monthly || 5000,
  alertThreshold: userStore.budget?.alertThreshold || 80
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

const updateBudget = () => {
  userStore.updateBudget({
    monthly: budget.monthly,
    alertThreshold: budget.alertThreshold
  })
  ElMessage.success('预算设置已保存')
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
  verifyPurpose.value = 'password'
  verifyForm.email = userStore.profile.email || ''
  verifyForm.code = ''
  verifyForm.newPassword = ''
  verifyDialogVisible.value = true
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

const handleDeleteAccount = () => {
  verifyPurpose.value = 'delete'
  verifyForm.email = userStore.profile.email || ''
  verifyForm.code = ''
  verifyDialogVisible.value = true
}

const sendVerifyCode = async () => {
  if (!verifyForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  
  sendCodeLoading.value = true
  try {
    await axios.post('https://ysj0710.xyz/api/auth/send-sensitive-code', {
      email: verifyForm.email,
      purpose: verifyPurpose.value
    })
    ElMessage.success('验证码已发送到邮箱')
    
    // 开始倒计时
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('发送验证码失败')
  } finally {
    sendCodeLoading.value = false
  }
}

const handleVerify = async () => {
  if (!verifyForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  
  verifyLoading.value = true
  try {
    // 先验证验证码
    await axios.post('https://ysj0710.xyz/api/auth/verify-sensitive-code', {
      email: verifyForm.email,
      code: verifyForm.code,
      purpose: verifyPurpose.value
    })
    
    if (verifyPurpose.value === 'password') {
      // 修改密码
      if (!verifyForm.newPassword) {
        ElMessage.warning('请输入新密码')
        verifyLoading.value = false
        return
      }
      const token = localStorage.getItem('token')
      await axios.post('https://ysj0710.xyz/api/auth/change-password', {
        password: verifyForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('密码修改成功')
      verifyDialogVisible.value = false
    } else if (verifyPurpose.value === 'delete') {
      // 确认注销
      const confirm = await ElMessageBox.confirm(
        '账号注销后将清除所有数据且不可恢复，是否确定？',
        '确认注销',
        { confirmButtonText: '确定注销', cancelButtonText: '取消', type: 'error' }
      )
      
      const token = localStorage.getItem('token')
      await axios.delete('https://ysj0710.xyz/api/auth/account', {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('账号已注销')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    verifyLoading.value = false
  }
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
  margin: 0 0 20px 0;
}

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

.code-input-wrapper {
  display: flex;
  gap: 8px;
}

.code-input-wrapper .el-input {
  flex: 1;
}
</style>
