<template>
  <div class="login-container">
    <div class="login-box">
      <h1>个人财务记账系统</h1>
      <h2>登录</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="loginForm.username" 
            type="text" 
            placeholder="请输入用户名"
            required
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            required
            autocomplete="current-password"
          />
        </div>
        
        <div class="error-message" v-if="error">{{ error }}</div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      
      <div class="register-link">
        还没有账户？ <a href="#" @click.prevent="showRegister = true">立即注册</a>
      </div>
      
      <div class="forgot-password-link">
        <a href="#" @click.prevent="showForgotPassword = true">忘记密码？</a>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <div class="modal" v-if="showRegister">
      <div class="register-box">
        <button class="close-btn" @click="closeRegister">×</button>
        <h2>注册</h2>
        
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="registerForm.username" 
              type="text" 
              placeholder="请输入用户名（3-20个字符）"
              required
              autocomplete="new-username"
            />
            <div class="field-hint" v-if="registerForm.username && registerForm.username.length < 3">
              用户名至少需要3个字符
            </div>
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码（至少6位）"
              required
              autocomplete="new-password"
            />
          </div>
          
          <div class="form-group">
            <label>确认密码</label>
            <input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码"
              required
              autocomplete="new-password"
            />
          </div>
          
          <div class="form-group">
            <label>邮箱</label>
            <div class="email-input-group">
              <input 
                v-model="registerForm.email" 
                type="email" 
                placeholder="请输入邮箱"
                required
                autocomplete="new-email"
              />
              <button 
                type="button" 
                class="send-code-btn" 
                @click="sendCode"
                :disabled="sendingCode || countdown > 0 || !registerForm.email"
              >
                {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>验证码</label>
            <input 
              v-model="registerForm.code" 
              type="text" 
              placeholder="请输入6位验证码"
              maxlength="6"
              required
              autocomplete="one-time-code"
            />
          </div>
          
          <div class="error-message" v-if="registerError">{{ registerError }}</div>
          <div class="success-message" v-if="codeSent">验证码已发送到您的邮箱</div>
          
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="closeRegister">取消</button>
            <button type="submit" class="register-btn" :disabled="registering || !canRegister">
              {{ registering ? '注册中...' : '注 册' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <div class="modal" v-if="showForgotPassword">
      <div class="register-box">
        <button class="close-btn" @click="closeForgotPassword">×</button>
        <h2>找回密码</h2>
        
        <form @submit.prevent="handleResetPassword" v-if="!passwordResetSuccess">
          <div class="form-group">
            <label>邮箱</label>
            <div class="email-input-group">
              <input 
                v-model="forgotPasswordForm.email" 
                type="email" 
                placeholder="请输入注册邮箱"
                required
                autocomplete="email"
              />
              <button 
                type="button" 
                class="send-code-btn" 
                @click="sendForgotPasswordCode"
                :disabled="sendingCode || countdown > 0 || !forgotPasswordForm.email"
              >
                {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>验证码</label>
            <input 
              v-model="forgotPasswordForm.code" 
              type="text" 
              placeholder="请输入6位验证码"
              maxlength="6"
              required
            />
          </div>

          <div class="form-group">
            <label>新密码</label>
            <input 
              v-model="forgotPasswordForm.newPassword" 
              type="password" 
              placeholder="请输入新密码（至少6位）"
              required
            />
          </div>

          <div class="form-group">
            <label>确认新密码</label>
            <input 
              v-model="forgotPasswordForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              required
            />
          </div>
          
          <div class="error-message" v-if="forgotPasswordError">{{ forgotPasswordError }}</div>
          
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="closeForgotPassword">取消</button>
            <button type="submit" class="register-btn" :disabled="resettingPassword">
              {{ resettingPassword ? '重置中...' : '重置密码' }}
            </button>
          </div>
        </form>

        <div v-else class="success-reset">
          <div class="success-icon">✓</div>
          <p>密码重置成功！</p>
          <button class="login-btn" @click="closeForgotPassword">去登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  code: ''
})

const loading = ref(false)
const error = ref('')
const showRegister = ref(false)
const showForgotPassword = ref(false)
const sendingCode = ref(false)
const registering = ref(false)
const registerError = ref('')
const codeSent = ref(false)
const countdown = ref(0)
let countdownTimer = null

// 忘记密码表单
const forgotPasswordForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})
const forgotPasswordError = ref('')
const resettingPassword = ref(false)
const passwordResetSuccess = ref(false)

// 能否注册（基本条件）
const canRegister = computed(() => {
  return registerForm.username.length >= 3 &&
         registerForm.password.length >= 6 &&
         registerForm.email.includes('@') &&
         registerForm.code.length === 6
})

// 登录处理
const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const response = await axios.post('/api/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    router.push('/home')
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 发送验证码
const sendCode = async () => {
  if (!registerForm.email) {
    registerError.value = '请输入邮箱地址'
    return
  }
  
  if (!registerForm.email.includes('@')) {
    registerError.value = '邮箱格式不正确'
    return
  }
  
  sendingCode.value = true
  registerError.value = ''
  codeSent.value = false
  
  try {
    await axios.post('/api/auth/send-code', {
      email: registerForm.email
    })
    
    codeSent.value = true
    
    // 开始倒计时
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
    
  } catch (err) {
    registerError.value = err.response?.data?.message || '发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

// 注册处理
const handleRegister = async () => {
  // 验证确认密码
  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = '两次输入的密码不一致'
    return
  }
  
  if (registerForm.password.length < 6) {
    registerError.value = '密码至少6位'
    return
  }
  
  registerError.value = ''
  registering.value = true
  
  try {
    await axios.post('/api/auth/register', {
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email,
      code: registerForm.code
    })
    
    alert('注册成功！请登录')
    closeRegister()
    // 自动填入用户名
    loginForm.username = registerForm.username
    loginForm.password = ''
  } catch (err) {
    registerError.value = err.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    registering.value = false
  }
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

// 发送忘记密码验证码
const sendForgotPasswordCode = async () => {
  if (!forgotPasswordForm.email) {
    forgotPasswordError.value = '请输入邮箱地址'
    return
  }
  
  if (!forgotPasswordForm.email.includes('@')) {
    forgotPasswordError.value = '邮箱格式不正确'
    return
  }
  
  sendingCode.value = true
  forgotPasswordError.value = ''
  
  try {
    await axios.post('/api/auth/forgot-password/send-code', {
      email: forgotPasswordForm.email
    })
    
    // 开始倒计时
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
    
  } catch (err) {
    forgotPasswordError.value = err.response?.data?.message || '发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (!forgotPasswordForm.code) {
    forgotPasswordError.value = '请输入验证码'
    return
  }
  
  if (forgotPasswordForm.newPassword.length < 6) {
    forgotPasswordError.value = '新密码至少6位'
    return
  }
  
  if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
    forgotPasswordError.value = '两次输入的密码不一致'
    return
  }
  
  forgotPasswordError.value = ''
  resettingPassword.value = true
  
  try {
    await axios.post('/api/auth/forgot-password/reset', {
      email: forgotPasswordForm.email,
      code: forgotPasswordForm.code,
      newPassword: forgotPasswordForm.newPassword
    })
    
    passwordResetSuccess.value = true
    
  } catch (err) {
    forgotPasswordError.value = err.response?.data?.message || '重置失败，请稍后重试'
  } finally {
    resettingPassword.value = false
  }
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
}</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
}

.login-box h2 {
  text-align: center;
  color: #666;
  font-size: 18px;
  margin-bottom: 30px;
  font-weight: normal;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.field-hint {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.email-input-group {
  display: flex;
  gap: 10px;
}

.email-input-group input {
  flex: 1;
}

.send-code-btn {
  padding: 10px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.send-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  color: #27ae60;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.forgot-password-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.forgot-password-link a {
  color: #999;
  text-decoration: none;
}

.forgot-password-link a:hover {
  color: #667eea;
  text-decoration: underline;
}

.success-reset {
  text-align: center;
  padding: 20px;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.success-reset p {
  color: #27ae60;
  font-size: 18px;
  margin-bottom: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.register-box {
  background: white;
  padding: 30px;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  margin: 20px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.register-box h2 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .register-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #e0e0e0;
  color: #333;
  border: none;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
