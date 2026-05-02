<template>
  <div class="page-container">
    <!-- 财务概览卡片 -->
    <div class="finance-overview">
      <div class="finance-card income-card">
        <div class="finance-icon">
          <TrendingUp :size="20" :stroke-width="1.8" />
        </div>
        <div class="finance-info">
          <div class="finance-label">总收入</div>
          <div class="finance-value income">¥{{ formatNumber(financeStats.totalIncome) }}</div>
        </div>
      </div>
      <div class="finance-card expense-card">
        <div class="finance-icon">
          <TrendingDown :size="20" :stroke-width="1.8" />
        </div>
        <div class="finance-info">
          <div class="finance-label">总支出</div>
          <div class="finance-value expense">¥{{ formatNumber(financeStats.totalExpense) }}</div>
        </div>
      </div>
      <div class="finance-card balance-card">
        <div class="finance-icon">
          <Wallet :size="20" :stroke-width="1.8" />
        </div>
        <div class="finance-info">
          <div class="finance-label">结余</div>
          <div class="finance-value" :class="financeStats.balance >= 0 ? 'income' : 'expense'">
            ¥{{ formatNumber(Math.abs(financeStats.balance)) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="card profile-card">
      <div class="card-body">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img v-if="userStore.profile.avatar" :src="userStore.profile.avatar" class="avatar-image" />
            <div v-else class="avatar">{{ userStore.profile.username?.charAt(0) || 'U' }}</div>
            <button class="avatar-edit-btn" @click="triggerAvatarUpload" :disabled="avatarLoading">
              <Camera :size="14" :stroke-width="2" />
            </button>
            <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarChange" style="display: none" />
          </div>
          <div class="user-info">
            <!-- 用户名（登录用，不可在线修改） -->
            <div class="info-row">
              <div class="info-display">
                <span class="info-label">用户名</span>
                <span class="info-value">{{ userStore.profile.username }}</span>
              </div>
              <span class="info-hint">用于登录</span>
            </div>
            <!-- 昵称（给自己看，随时可改） -->
            <div class="info-row">
              <div class="info-display">
                <span class="info-label">昵称</span>
                <span class="info-value secondary">{{ userStore.profile.nickname || '未设置' }}</span>
              </div>
              <button class="edit-btn" @click="openNicknameDialog">
                <Edit3 :size="14" :stroke-width="2" />
                编辑
              </button>
            </div>
            <span class="user-email">{{ userStore.profile.email }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改昵称对话框 -->
    <div v-if="showNicknameDialog" class="dialog-overlay" @click="showNicknameDialog = false">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">修改昵称</div>
          <button class="close-btn" @click="showNicknameDialog = false"><X :size="20" :stroke-width="2" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">新昵称</label>
            <input v-model="editNickname" class="form-input" placeholder="给自己取个好听的昵称" maxlength="20" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn secondary" @click="showNicknameDialog = false">取消</button>
          <button class="btn primary" :disabled="!editNickname.trim() || nicknameLoading" @click="updateNickname">
            {{ nicknameLoading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改用户名对话框 -->
    <div v-if="showUsernameDialog" class="dialog-overlay" @click="showUsernameDialog = false">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">修改用户名</div>
          <button class="close-btn" @click="showUsernameDialog = false"><X :size="20" :stroke-width="2" /></button>
        </div>

        <div class="dialog-body">
          <div class="username-info">
            <div class="current-username">
              <span class="info-label">当前用户名</span>
              <span class="info-value">{{ userStore.profile.username }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">新用户名</label>
            <input v-model="newUsername" class="form-input" placeholder="输入新用户名（3-20个字符）" />
          </div>

          <div class="warning-box">
            <AlertTriangle :size="16" :stroke-width="2" class="warning-icon" />
            <span>确定要修改用户名？修改后下次登录需要输入新的用户名 <strong>{{ newUsername || '...' }}</strong></span>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn secondary" @click="showUsernameDialog = false">取消</button>
          <button class="btn primary" :disabled="!newUsername || newUsername === userStore.profile.username || usernameLoading" @click="updateUsername">
            {{ usernameLoading ? '保存中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 其他设置 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Settings :size="18" :stroke-width="1.5" />
          <span>账户设置</span>
        </div>
      </div>
      <div class="card-body">
        <div class="menu-list">
          <div class="menu-item" @click="changePassword">
            <KeyRound :size="18" :stroke-width="1.8" />
            <span>修改密码</span>
            <ArrowRight :size="16" :stroke-width="2" />
          </div>

          <div class="menu-item" @click="handleLogout">
            <LogOut :size="18" :stroke-width="1.8" />
            <span>退出登录</span>
            <ArrowRight :size="16" :stroke-width="2" />
          </div>

          <div class="menu-item danger" @click="handleDeleteAccount">
            <Trash2 :size="18" :stroke-width="1.8" />
            <span>注销账号</span>
            <ArrowRight :size="16" :stroke-width="2" />
          </div>
        </div>
      </div>
    </div>

    <!-- 验证码确认对话框 -->
    <div v-if="verifyDialogVisible" class="dialog-overlay" @click="verifyDialogVisible = false">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">{{ verifyPurpose === 'password' ? '修改密码' : '注销账号' }}</div>
          <button class="close-btn" @click="verifyDialogVisible = false"><X :size="20" :stroke-width="2" /></button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="verifyForm.email" type="email" class="form-input" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">验证码</label>
            <div class="code-input-wrapper">
              <input v-model="verifyForm.code" type="text" class="form-input" placeholder="请输入验证码" />
              <button class="btn secondary small" :disabled="countdown > 0" :class="{ loading: sendCodeLoading }" @click="sendVerifyCode">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
          </div>

          <div v-if="verifyPurpose === 'password'" class="form-group">
            <label class="form-label">新密码</label>
            <input v-model="verifyForm.newPassword" type="password" class="form-input" placeholder="请输入新密码" />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn secondary" @click="verifyDialogVisible = false">取消</button>
          <button class="btn primary" :class="{ loading: verifyLoading }" @click="handleVerify">
            {{ verifyPurpose === 'password' ? '确认修改' : '确认注销' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, KeyRound, LogOut, Trash2, Camera, Settings, ArrowRight, X, Edit3, AlertTriangle, TrendingUp, TrendingDown, Wallet } from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const avatarLoading = ref(false)
const avatarInput = ref(null)

// 财务概览
const financeStats = ref({ totalIncome: 0, totalExpense: 0, balance: 0, loading: false })

const fetchFinanceStats = async () => {
  financeStats.value.loading = true
  try {
    const token = localStorage.getItem('token')
    const now = new Date()
    const startDate = `${now.getFullYear()}-01-01`
    const endDate = `${now.getFullYear() + 1}-01-01`
    const res = await axios.get('/api/transactions/statistics', {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${token}` }
    })
    const income = res.data.income?.total || 0
    const expense = res.data.expense?.total || 0
    financeStats.value.totalIncome = income
    financeStats.value.totalExpense = expense
    financeStats.value.balance = income - expense
  } catch (e) {
    console.error('获取财务统计失败', e)
  } finally {
    financeStats.value.loading = false
  }
}

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// 昵称修改
const showNicknameDialog = ref(false)
const editNickname = ref('')
const nicknameLoading = ref(false)

// 用户名修改
const showUsernameDialog = ref(false)
const newUsername = ref('')
const usernameLoading = ref(false)

const verifyDialogVisible = ref(false)
const verifyPurpose = ref('')
const verifyForm = reactive({
  email: '',
  code: '',
  newPassword: ''
})
const verifyLoading = ref(false)
const sendCodeLoading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  // 验证文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过5MB')
    return
  }

  avatarLoading.value = true
  try {
    // 读取文件并转为base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Image = e.target?.result

      // 上传到服务器（这里使用base64模拟）
      const token = localStorage.getItem('token')
      await axios.post('/api/user/avatar', {
        avatarUrl: base64Image
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      ElMessage.success('头像修改成功')
      userStore.profile.avatar = base64Image
      localStorage.setItem('user', JSON.stringify(userStore.profile))
    }
    reader.readAsDataURL(file)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改头像失败')
  } finally {
    avatarLoading.value = false
    // 清空input，允许重复选择同一文件
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const openNicknameDialog = () => {
  editNickname.value = userStore.profile.nickname || ''
  showNicknameDialog.value = true
}

const updateNickname = async () => {
  if (!editNickname.value || !editNickname.value.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }

  nicknameLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put('/api/user/profile', {
      nickname: editNickname.value.trim()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('昵称已更新')
    userStore.profile.nickname = response.data.user.nickname
    localStorage.setItem('user', JSON.stringify(userStore.profile))
    showNicknameDialog.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '更新昵称失败')
  } finally {
    nicknameLoading.value = false
  }
}

const updateUsername = async () => {
  if (!newUsername.value || newUsername.value.trim().length < 3) {
    ElMessage.warning('用户名长度需要在 3-20 个字符之间')
    return
  }

  if (newUsername.value === userStore.profile.username) {
    ElMessage.warning('新用户名不能与当前用户名相同')
    return
  }

  // 确认对话框
  try {
    await ElMessageBox.confirm(
      `确定要将用户名从「${userStore.profile.username}」修改为「${newUsername.value}」吗？\n\n修改后下次登录请使用新用户名「${newUsername.value}」登录。`,
      '修改用户名',
      {
        confirmButtonText: '确认修改',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
  } catch {
    return // 用户取消
  }

  usernameLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put('/api/user/username', {
      username: newUsername.value.trim()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('用户名已修改，下次登录请使用新用户名')
    userStore.profile.username = response.data.user.username
    localStorage.setItem('user', JSON.stringify(userStore.profile))
    showUsernameDialog.value = false
    newUsername.value = ''
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改用户名失败')
  } finally {
    usernameLoading.value = false
  }
}

const changePassword = () => {
  verifyPurpose.value = 'password'
  verifyForm.email = userStore.profile.email || ''
  verifyForm.code = ''
  verifyForm.newPassword = ''
  verifyDialogVisible.value = true
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除所有用户相关缓存，防止下一个用户看到上一个人的数据
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
    localStorage.removeItem('user_theme')
    localStorage.removeItem('user_budget')
    localStorage.removeItem('user_category_colors')
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
    await axios.post('/api/auth/send-sensitive-code', {
      email: verifyForm.email,
      purpose: verifyPurpose.value
    })
    ElMessage.success('验证码已发送到邮箱')

    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(countdownTimer)
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
    await axios.post('/api/auth/verify-sensitive-code', {
      email: verifyForm.email,
      code: verifyForm.code,
      purpose: verifyPurpose.value
    })

    if (verifyPurpose.value === 'password') {
      if (!verifyForm.newPassword) {
        ElMessage.warning('请输入新密码')
        verifyLoading.value = false
        return
      }
      const token = localStorage.getItem('token')
      await axios.post('/api/auth/change-password', {
        password: verifyForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('密码修改成功')
      verifyDialogVisible.value = false
    } else if (verifyPurpose.value === 'delete') {
      const confirm = await ElMessageBox.confirm(
        '账号注销后将清除所有数据且不可恢复，是否确定？',
        '确认注销',
        { confirmButtonText: '确定注销', cancelButtonText: '取消', type: 'error' }
      )

      const token = localStorage.getItem('token')
      await axios.delete('/api/auth/account', {
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

onMounted(() => {
  fetchFinanceStats()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; padding: 28px 32px; max-width: 1080px; margin: 0 auto; width: 100%; overflow-x: hidden; }

/* 财务概览 */
.finance-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.finance-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.finance-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }

.finance-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.income-card .finance-icon { background: var(--color-income-bg); color: var(--color-income); }
.expense-card .finance-icon { background: var(--color-expense-bg); color: var(--color-expense); }
.balance-card .finance-icon { background: var(--color-primary-soft); color: var(--color-primary); }

.finance-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.finance-label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.finance-value { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.finance-value.income { color: var(--color-income); }
.finance-value.expense { color: var(--color-expense); }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }

.card-body { padding: 24px; }

.avatar-section { display: flex; align-items: center; gap: 20px; }

.avatar-wrapper { position: relative; flex-shrink: 0; }

.avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.avatar-edit-btn:hover { background: var(--color-surface-hover); color: var(--color-primary); }

.user-info { flex: 1; display: flex; flex-direction: column; gap: 12px; }

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.info-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-surface-hover);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.info-value.secondary {
  font-size: 15px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.edit-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  background: var(--color-surface-hover);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.edit-btn:hover { background: var(--color-primary-soft); }

.user-email { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

/* 用户名修改对话框 */
.username-info {
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.current-username {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--color-warning-soft);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 13px;
  color: #92400E;
  line-height: 1.5;
}

.warning-icon { flex-shrink: 0; margin-top: 2px; color: #F59E0B; }

.menu-list { display: flex; flex-direction: column; gap: 8px; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  color: var(--color-text-secondary);
}

.menu-item:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }
.menu-item.danger:hover { background: var(--color-expense-bg); color: var(--color-expense); }

.menu-item span:nth-child(2) { flex: 1; font-size: 14px; font-weight: 500; }
.menu-item.danger span:nth-child(2) { color: var(--color-expense); }

/* 对话框 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.6);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-container {
  width: 420px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-surface-hover);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.close-btn:hover { background: var(--color-surface-active); color: var(--color-text-primary); }

.dialog-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.dialog-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; gap: 12px; justify-content: flex-end; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

.form-input {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
  font-family: var(--font-ui);
}

.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-input:disabled { opacity: 0.6; cursor: not-allowed; }

.code-input-wrapper { display: flex; gap: 8px; }
.code-input-wrapper .form-input { flex: 1; }

.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
}

.btn.primary { background: var(--color-primary); color: white; }
.btn.primary:hover:not(:disabled) { background: #4F46E5; }
.btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn.secondary { background: var(--color-surface-hover); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn.secondary:hover { background: var(--color-surface-active); }
.btn.secondary.small { padding: 8px 16px; font-size: 13px; white-space: nowrap; }
.btn.secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.loading { opacity: 0.6; pointer-events: none; }

/* 移动端适配：优先采用上下纵向布局 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
    gap: 16px;
  }

  /* 财务卡片：3列变1列纵向排列 */
  .finance-overview {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .finance-card {
    padding: 14px;
    gap: 12px;
  }

  .finance-icon {
    width: 36px;
    height: 36px;
  }

  .finance-value {
    font-size: 16px;
  }

  /* 用户信息：头像和内容上下排列 */
  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }

  .avatar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .avatar,
  .avatar-image {
    width: 72px;
    height: 72px;
    font-size: 28px;
  }

  .user-info {
    align-items: center;
    width: 100%;
  }

  .info-row {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .info-display {
    align-items: center;
  }

  .info-hint {
    display: none;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
  }

  .user-email {
    text-align: center;
  }

  .card-body {
    padding: 16px;
  }

  .card-header {
    padding: 16px;
  }

  /* 菜单项：增大点击区域 */
  .menu-list {
    gap: 6px;
  }

  .menu-item {
    padding: 14px 16px;
  }

  .menu-item span:nth-child(2) {
    font-size: 15px;
  }
}

@media (max-width: 640px) {
  /* 对话框：全屏显示 */
  .dialog-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .dialog-container {
    width: 100%;
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-header {
    padding: 16px 20px;
    position: sticky;
    top: 0;
    background: var(--color-surface);
  }

  .dialog-title {
    font-size: 16px;
  }

  .dialog-body {
    padding: 16px 20px;
  }

  .dialog-footer {
    padding: 16px 20px;
    flex-direction: column;
    position: sticky;
    bottom: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .dialog-footer .btn {
    width: 100%;
  }

  /* 表单：验证码输入框纵向排列 */
  .form-group {
    gap: 6px;
  }

  .code-input-wrapper {
    flex-direction: column;
    gap: 10px;
  }

  .code-input-wrapper .btn.secondary {
    width: 100%;
  }

  .form-input {
    padding: 12px 14px;
    font-size: 15px;
  }

  /* 警告框：文字不换行 */
  .warning-box {
    font-size: 12px;
  }

  /* 用户名信息框 */
  .username-info {
    padding: 12px;
  }

  .current-username {
    align-items: center;
    text-align: center;
  }
}
</style>