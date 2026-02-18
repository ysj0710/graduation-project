<template>
  <div class="min-h-screen flex items-center justify-center" style="background: #fff;">
    <div class="w-full max-w-md px-6">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style="background: #fff; border: 1px solid #eaeaea;">
          <el-icon :size="24" style="color: #333;"><Wallet /></el-icon>
        </div>
      </div>
      
      <!-- Login Form -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-center mb-2" style="color: #37352f;">登录</h1>
        <p class="text-center mb-6" style="color: #787774;">继续到财务记账系统</p>
        
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="用户名"
              size="large"
              style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7; --el-input-hover-border-color: #c9c9c7; --el-input-focus-border-color: #2eaadc;"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password"
              placeholder="密码"
              size="large"
              show-password
              style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7; --el-input-hover-border-color: #c9c9c7; --el-input-focus-border-color: #2eaadc;"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />
          
          <el-button 
            type="primary"
            size="large" 
            class="w-full"
            :loading="loading"
            style="background: #f7f6f3; border: 1px solid #e9e9e7; color: #37352f; font-weight: 500;"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '继续' }}
          </el-button>
        </el-form>
      </div>
      
      <!-- Divider -->
      <div class="flex items-center gap-3 mb-8">
        <div class="flex-1" style="height: 1px; background: #e9e9e7;"></div>
        <span class="text-sm" style="color: #787774;">或者</span>
        <div class="flex-1" style="height: 1px; background: #e9e9e7;"></div>
      </div>
      
      <!-- Links -->
      <div class="space-y-3 text-center">
        <div>
          <el-link type="primary" @click="openRegister" style="color: #37352f; font-weight: 500;">创建账户</el-link>
        </div>
        <div>
          <el-link type="info" @click="openForgotPassword" style="color: #787774;">忘记密码？</el-link>
        </div>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <el-dialog v-model="showRegister" title="创建账户" width="420px" :close-on-click-modal="false" style="--el-dialog-bg-color: #fff;">
      <p class="mb-6" style="color: #787774;">注册新账户</p>
      
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名（3-20个字符）" autocomplete="new-username" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="密码（至少6位）" show-password autocomplete="new-password" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password autocomplete="new-password" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
        </el-form-item>
        
        <el-form-item prop="email">
          <div class="flex gap-2">
            <el-input v-model="registerForm.email" placeholder="邮箱地址" autocomplete="new-email" class="flex-1" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
            <el-button :loading="sendingCode" :disabled="!registerForm.email || countdown > 0" style="background: #f7f6f3; border-color: #e9e9e7; color: #37352f;" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="code">
          <el-input v-model="registerForm.code" placeholder="验证码（6位）" maxlength="6" autocomplete="one-time-code" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
        </el-form-item>
        
        <el-alert v-if="registerError" :title="registerError" type="error" show-icon :closable="false" class="mb-4" />
        <el-alert v-if="codeSent" title="验证码已发送到您的邮箱" type="success" show-icon :closable="false" class="mb-4" />
        
        <el-button 
          type="primary"
          class="w-full h-11"
          :loading="registering"
          style="background: #f7f6f3; border: 1px solid #e9e9e7; color: #37352f; font-weight: 500;"
          @click="handleRegister"
        >
          {{ registering ? '注册中...' : '创建账户' }}
        </el-button>
      </el-form>
    </el-dialog>

    <!-- 忘记密码弹窗 -->
    <el-dialog v-model="showForgotPassword" title="找回密码" width="420px" :close-on-click-modal="false" style="--el-dialog-bg-color: #fff;">
      <div v-if="!passwordResetSuccess">
        <p class="mb-6" style="color: #787774;">通过邮箱重置密码</p>
        
        <el-form ref="forgotFormRef" :model="forgotPasswordForm" :rules="forgotRules">
          <el-form-item prop="email">
            <div class="flex gap-2">
              <el-input v-model="forgotPasswordForm.email" placeholder="注册邮箱" autocomplete="new-email" class="flex-1" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
              <el-button :loading="sendingCode" :disabled="!forgotPasswordForm.email || countdown > 0" style="background: #f7f6f3; border-color: #e9e9e7; color: #37352f;" @click="sendForgotCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item prop="code">
            <el-input v-model="forgotPasswordForm.code" placeholder="验证码（6位）" maxlength="6" autocomplete="one-time-code" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
          </el-form-item>
          
          <el-form-item prop="newPassword">
            <el-input v-model="forgotPasswordForm.newPassword" type="password" placeholder="新密码（至少6位）" show-password autocomplete="new-password" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input v-model="forgotPasswordForm.confirmPassword" type="password" placeholder="确认新密码" show-password autocomplete="new-password" style="--el-input-bg-color: #f7f6f3; --el-input-border-color: #e9e9e7;" />
          </el-form-item>
          
          <el-alert v-if="forgotPasswordError" :title="forgotPasswordError" type="error" show-icon :closable="false" class="mb-4" />
          
          <el-button 
            type="primary"
            class="w-full h-11"
            :loading="resettingPassword"
            style="background: #f7f6f3; border: 1px solid #e9e9e7; color: #37352f; font-weight: 500;"
            @click="handleResetPassword"
          >
            {{ resettingPassword ? '处理中...' : '重置密码' }}
          </el-button>
        </el-form>
      </div>
      
      <div v-else class="text-center py-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style="background: #f7f6f3;">
          <el-icon :size="28" style="color: #37352f;"><CircleCheckFilled /></el-icon>
        </div>
        <p class="text-lg font-semibold mb-2" style="color: #37352f;">密码已重置</p>
        <p class="mb-6" style="color: #787774;">请使用新密码登录</p>
        <el-button size="large" style="background: #f7f6f3; border-color: #e9e9e7; color: #37352f; font-weight: 500;" @click="closeForgotPassword">去登录</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Wallet } from '@element-plus/icons-vue'
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
const resettingPassword = ref(false)
const countdown = ref(0)
let countdownTimer = null
const codeSent = ref(false)

const registerError = ref('')
const forgotPasswordError = ref('')
const passwordResetSuccess = ref(false)

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需在 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ]
}

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== forgotPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    error.value = ''
    try {
      const { data } = await axios.post('/api/auth/login', loginForm)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.user.username)
      localStorage.setItem('user', JSON.stringify(data.user))
      ElMessage.success('登录成功！')
      router.push('/home')
    } catch (err) {
      error.value = err.response?.data?.message || '登录失败，请检查用户名和密码'
    } finally {
      loading.value = false
    }
  })
}

const openRegister = () => {
  registerForm.username = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerForm.email = ''
  registerForm.code = ''
  registerError.value = ''
  codeSent.value = false
  countdown.value = 0
  if (countdownTimer) clearInterval(countdownTimer)
  
  showRegister.value = true
  
  setTimeout(() => {
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.email = ''
    registerForm.code = ''
  }, 50)
}

const closeRegister = () => {
  showRegister.value = false
  registerFormRef.value?.resetFields()
}

const openForgotPassword = () => {
  forgotPasswordForm.email = ''
  forgotPasswordForm.code = ''
  forgotPasswordForm.newPassword = ''
  forgotPasswordForm.confirmPassword = ''
  forgotPasswordError.value = ''
  passwordResetSuccess.value = false
  countdown.value = 0
  if (countdownTimer) clearInterval(countdownTimer)
  
  showForgotPassword.value = true
  
  setTimeout(() => {
    forgotPasswordForm.email = ''
    forgotPasswordForm.code = ''
    forgotPasswordForm.newPassword = ''
    forgotPasswordForm.confirmPassword = ''
  }, 50)
}

const closeForgotPassword = () => {
  showForgotPassword.value = false
  forgotFormRef.value?.resetFields()
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
    registering.value = true
    registerError.value = ''
    try {
      await axios.post('/api/auth/register', { username: registerForm.username, password: registerForm.password, email: registerForm.email, code: registerForm.code })
      ElMessage.success('注册成功！请登录')
      closeRegister()
    } catch (err) {
      registerError.value = err.response?.data?.message || '注册失败，请稍后重试'
    } finally {
      registering.value = false
    }
  })
}

const sendForgotCode = async () => {
  if (!forgotPasswordForm.email) { forgotPasswordError.value = '请输入邮箱地址'; return }
  if (!forgotPasswordForm.email.includes('@')) { forgotPasswordError.value = '邮箱格式不正确'; return }
  sendingCode.value = true
  forgotPasswordError.value = ''
  try {
    await axios.post('/api/auth/send-forgot-code', { email: forgotPasswordForm.email })
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
    resettingPassword.value = true
    forgotPasswordError.value = ''
    try {
      await axios.post('/api/auth/reset-password', {
        email: forgotPasswordForm.email,
        code: forgotPasswordForm.code,
        password: forgotPasswordForm.newPassword
      })
      passwordResetSuccess.value = true
    } catch (err) {
      forgotPasswordError.value = err.response?.data?.message || '重置失败，请检查验证码'
    } finally {
      resettingPassword.value = false
    }
  })
}
</script>

<style>
/* Notion-style overrides */
:deep(.el-dialog) {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  padding: 20px 24px 0;
}

:deep(.el-dialog__title) {
  color: #37352f;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 16px 24px 24px;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 1px solid #e9e9e7;
  background: #f7f6f3;
  border-radius: 4px;
}

:deep(.el-input__wrapper:hover) {
  border-color: #c9c9c7;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #2eaadc;
  box-shadow: none !important;
}

:deep(.el-input__inner) {
  color: #37352f;
}

:deep(.el-input__inner::placeholder) {
  color: #9b9a97;
}

:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-link__inner) {
  color: inherit !important;
}
</style>
