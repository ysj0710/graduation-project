<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
    <div class="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-sm"></div>
    
    <el-card class="w-full max-w-md relative overflow-hidden" :body-style="{ padding: '40px' }">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-4">
          <el-icon :size="32" class="text-white"><Wallet /></el-icon>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">个人财务记账系统</h1>
        <p class="text-gray-500 mt-2">登录您的账户</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />
        
        <el-button 
          type="primary" 
          size="large" 
          class="w-full h-12 text-base font-semibold" 
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
      
      <div class="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
        <el-link type="primary" @click="openRegister">立即注册</el-link>
        <el-link type="info" @click="openForgotPassword">忘记密码？</el-link>
      </div>
    </el-card>

    <!-- 注册弹窗 -->
    <el-dialog v-model="showRegister" title="用户注册" width="480px" :close-on-click-modal="false" class="register-dialog">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名（3-20个字符）" :prefix-icon="User" autocomplete="off" />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="密码（至少6位）" :prefix-icon="Lock" show-password autocomplete="off" />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password autocomplete="off" />
        </el-form-item>
        
        <el-form-item prop="email">
          <div class="flex gap-2">
            <el-input v-model="registerForm.email" placeholder="邮箱地址" :prefix-icon="Message" class="flex-1" autocomplete="off" />
            <el-button :disabled="!registerForm.email || countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="code">
          <el-input v-model="registerForm.code" placeholder="验证码（6位）" maxlength="6" :prefix-icon="CircleCheck" autocomplete="off" />
        </el-form-item>
        
        <el-alert v-if="registerError" :title="registerError" type="error" show-icon :closable="false" class="mb-4" />
        <el-alert v-if="codeSent" title="验证码已发送到您的邮箱" type="success" show-icon :closable="false" class="mb-4" />
      </el-form>
      
      <template #footer>
        <el-button @click="closeRegister">取消</el-button>
        <el-button type="primary" :loading="registering" @click="handleRegister">注 册</el-button>
      </template>
    </el-dialog>

    <!-- 忘记密码弹窗 -->
    <el-dialog v-model="showForgotPassword" title="找回密码" width="480px" :close-on-click-modal="false">
      <div v-if="!passwordResetSuccess">
        <el-form ref="forgotFormRef" :model="forgotPasswordForm" :rules="forgotRules">
          <el-form-item prop="email">
            <div class="flex gap-2">
              <el-input v-model="forgotPasswordForm.email" placeholder="注册邮箱" :prefix-icon="Message" class="flex-1" />
              <el-button :disabled="!forgotPasswordForm.email || countdown > 0" @click="sendForgotCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item prop="code">
            <el-input v-model="forgotPasswordForm.code" placeholder="验证码（6位）" maxlength="6" :prefix-icon="CircleCheck" autocomplete="off" />
          </el-form-item>
          
          <el-form-item prop="newPassword">
            <el-input v-model="forgotPasswordForm.newPassword" type="password" placeholder="新密码（至少6位）" :prefix-icon="Lock" show-password autocomplete="new-password" />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input v-model="forgotPasswordForm.confirmPassword" type="password" placeholder="确认新密码" :prefix-icon="Lock" show-password autocomplete="new-password" />
          </el-form-item>
          
          <el-alert v-if="forgotPasswordError" :title="forgotPasswordError" type="error" show-icon :closable="false" class="mb-4" />
        </el-form>
      </div>
      
      <div v-else class="text-center py-8">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <el-icon :size="40" class="text-green-500"><CircleCheckFilled /></el-icon>
        </div>
        <p class="text-xl font-semibold text-green-500 mb-2">密码重置成功！</p>
        <p class="text-gray-500 mb-6">请使用新密码登录</p>
        <el-button type="primary" size="large" @click="closeForgotPassword">去登录</el-button>
      </div>
      
      <template #footer v-if="!passwordResetSuccess">
        <el-button @click="closeForgotPassword">取消</el-button>
        <el-button type="primary" :loading="resettingPassword" @click="handleResetPassword">重置密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, CircleCheck, Wallet, CircleCheckFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()

const loginFormRef = ref(null)
const registerFormRef = ref(null)
const forgotFormRef = ref(null)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', confirmPassword: '', email: '', code: '' })
const forgotPasswordForm = reactive({ email: '', code: '', newPassword: '', confirmPassword: '' })

const loading = ref(false)
const error = ref('')
const showRegister = ref(false)
const showForgotPassword = ref(false)
const sendingCode = ref(false)
const registering = ref(false)
const registerError = ref('')
const codeSent = ref(false)
const countdown = ref(0)
const forgotPasswordError = ref('')
const resettingPassword = ref(false)
const passwordResetSuccess = ref(false)
let countdownTimer = null

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, message: '用户名至少3个字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }, { len: 6, message: '验证码6位', trigger: 'blur' }]
}

const validateForgotConfirmPassword = (rule, value, callback) => {
  if (value !== forgotPasswordForm.newPassword) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const forgotRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }, { len: 6, message: '验证码6位', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }, { validator: validateForgotConfirmPassword, trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    error.value = ''
    loading.value = true
    try {
      const response = await axios.post('/api/auth/login', { username: loginForm.username, password: loginForm.password })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/home')
    } catch (err) {
      error.value = err.response?.data?.message || '登录失败，请稍后重试'
    } finally {
      loading.value = false
    }
  })
}

const sendCode = async () => {
  if (!registerForm.email) { registerError.value = '请输入邮箱地址'; return }
  if (!registerForm.email.includes('@')) { registerError.value = '邮箱格式不正确'; return }
  sendingCode.value = true
  registerError.value = ''
  codeSent.value = false
  try {
    await axios.post('/api/auth/send-code', { email: registerForm.email })
    codeSent.value = true
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(countdownTimer) }, 1000)
  } catch (err) {
    registerError.value = err.response?.data?.message || '发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    registerError.value = ''
    registering.value = true
    try {
      await axios.post('/api/auth/register', { username: registerForm.username, password: registerForm.password, email: registerForm.email, code: registerForm.code })
      ElMessage.success('注册成功！请登录')
      closeRegister()
      loginForm.username = registerForm.username
      loginForm.password = ''
    } catch (err) {
      registerError.value = err.response?.data?.message || '注册失败，请稍后重试'
    } finally {
      registering.value = false
    }
  })
}

const openRegister = () => {
  // 先清空表单，防止浏览器自动填充
  setTimeout(() => {
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.email = ''
    registerForm.code = ''
  }, 10)
  showRegister.value = true
}

const openForgotPassword = () => {
  setTimeout(() => {
    forgotPasswordForm.email = ''
    forgotPasswordForm.code = ''
    forgotPasswordForm.newPassword = ''
    forgotPasswordForm.confirmPassword = ''
  }, 10)
  showForgotPassword.value = true
}

const closeRegister = () => {
  showRegister.value = false
  registerForm.username = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerForm.email = ''
  registerForm.code = ''
  registerError.value = ''
  codeSent.value = false
  countdown.value = 0
  if (countdownTimer) clearInterval(countdownTimer)
}

const sendForgotCode = async () => {
  if (!forgotPasswordForm.email) { forgotPasswordError.value = '请输入邮箱地址'; return }
  if (!forgotPasswordForm.email.includes('@')) { forgotPasswordError.value = '邮箱格式不正确'; return }
  sendingCode.value = true
  forgotPasswordError.value = ''
  try {
    await axios.post('/api/auth/forgot-password/send-code', { email: forgotPasswordForm.email })
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(countdownTimer) }, 1000)
  } catch (err) {
    forgotPasswordError.value = err.response?.data?.message || '发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

const handleResetPassword = async () => {
  if (!forgotFormRef.value) return
  await forgotFormRef.value.validate(async (valid) => {
    if (!valid) return
    forgotPasswordError.value = ''
    resettingPassword.value = true
    try {
      await axios.post('/api/auth/forgot-password/reset', { email: forgotPasswordForm.email, code: forgotPasswordForm.code, newPassword: forgotPasswordForm.newPassword })
      passwordResetSuccess.value = true
    } catch (err) {
      forgotPasswordError.value = err.response?.data?.message || '重置失败，请稍后重试'
    } finally {
      resettingPassword.value = false
    }
  })
}

const closeForgotPassword = () => {
  showForgotPassword.value = false
  forgotPasswordForm.email = ''
  forgotPasswordForm.code = ''
  forgotPasswordForm.newPassword = ''
  forgotPasswordForm.confirmPassword = ''
  forgotPasswordError.value = ''
  passwordResetSuccess.value = false
  countdown.value = 0
  if (countdownTimer) clearInterval(countdownTimer)
}
</script>

<style scoped>
.bg-gradient-to-r {
  background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
}

.from-indigo-500 {
  --tw-gradient-from: #6366f1;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(99 102 241 / 0));
}

.via-purple-500 {
  --tw-gradient-stops: var(--tw-gradient-from), #a855f7, var(--tw-gradient-to, rgb(168 85 247 / 0));
}

.to-pink-500 {
  --tw-gradient-to: #ec4899;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

:deep(.el-card) {
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
}
</style>
