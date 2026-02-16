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
    <div class="modal" v-if="showRegister" @click.self="showRegister = false">
      <div class="register-box">
        <h2>注册</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="registerForm.username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div class="form-group">
            <label>邮箱</label>
            <input 
              v-model="registerForm.email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div class="error-message" v-if="registerError">{{ registerError }}</div>
          
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="showRegister = false">取消</button>
            <button type="submit" class="register-btn" :disabled="registering">
              {{ registering ? '注册中...' : '注 册' }}
            </button>
          </div>
        </form>
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
  username: '',
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const showRegister = ref(false)
const registering = ref(false)
const registerError = ref('')

// 登录处理
const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const response = await axios.post('/api/auth/login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    // 保存 token 到本地存储
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    // 跳转到首页
    router.push('/home')
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 注册处理
const handleRegister = async () => {
  registerError.value = ''
  registering.value = true
  
  try {
    await axios.post('/api/auth/register', {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    
    alert('注册成功！请登录')
    showRegister.value = false
    // 清空注册表单
    registerForm.username = ''
    registerForm.email = ''
    registerForm.password = ''
  } catch (err) {
    registerError.value = err.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    registering.value = false
  }
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

/* 注册弹窗样式 */
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
  max-width: 380px;
  margin: 20px;
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

.cancel-btn:hover {
  background: #d0d0d0;
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
