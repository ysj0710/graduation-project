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
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            required
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
    </div>

    <!-- 注册弹窗 -->
    <div class="modal" v-if="showRegister" @click.self="closeRegister">
      <div class="register-box">
        <h2>注册</h2>
        
        <!-- 步骤1: 输入邮箱获取验证码 -->
        <div v-if="registerStep === 1" class="step-container">
          <div class="form-group">
            <label>邮箱</label>
            <input 
              v-model="registerForm.email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div class="error-message" v-if="registerError">{{ registerError }}</div>
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="closeRegister">取消</button>
            <button 
              type="button" 
              class="register-btn" 
              @click="sendCode"
              :disabled="sendingCode"
            >
              {{ sendingCode ? '发送中...' : '获取验证码' }}
            </button>
          </div>
        </div>
        
        <!-- 步骤2: 输入验证码和密码 -->
        <div v-else-if="registerStep === 2" class="step-container">
          <div class="form-group">
            <label>验证码</label>
            <div class="code-input-group">
              <input 
                v-model="registerForm.code" 
                type="text" 
                placeholder="请输入6位验证码"
                maxlength="6"
                required
              />
              <button type="button" class="resend-btn" @click="sendCode" :disabled="countdown > 0">
                {{ countdown > 0 ? `${countdown}s` : '重新获取' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="registerForm.username" 
              type="text" 
              placeholder="请输入用户名（3-20个字符）"
              required
            />
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>
          
          <div class="error-message" v-if="registerError">{{ registerError }}</div>
          
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="registerStep = 1">上一步</button>
            <button type="button" class="register-btn" @click="handleRegister" :disabled="registering">
              {{ registering ? '注册中...' : '注 册' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  email: '',
  code: '',
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const showRegister = ref(false)
const registerStep = ref(1) // 1: 输入邮箱, 2: 输入验证码和密码
const sendingCode = ref(false)
const registering = ref(false)
const registerError = ref('')
const countdown = ref(0)
let countdownTimer = null

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
  
  sendingCode.value = true
  registerError.value = ''
  
  try {
    const response = await axios.post('/api/auth/send-code', {
      email: registerForm.email
    })
    
    // 开发环境显示验证码
    if (response.data.devCode) {
      alert(`验证码: ${response.data.devCode}`)
    }
    
    registerStep.value = 2
    
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
  registerStep.value = 1
  registerForm.email = ''
  registerForm.code = ''
  registerForm.username = ''
  registerForm.password = ''
  registerError.value = ''
  countdown.value = 0
  if (countdownTimer) clearInterval(countdownTimer)
}
</script>

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

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input-group input {
  flex: 1;
}

.resend-btn {
  padding: 10px 15px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.resend-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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
  max-width: 400px;
  margin: 20px;
}

.register-box h2 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.step-container {
  margin-bottom: 10px;
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
