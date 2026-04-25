<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="login-container">
      <!-- Left: Branding -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon-wrap">
              <Wallet :size="32" :stroke-width="1.5" />
            </div>
          </div>
          <h1 class="brand-title">{{ systemName }}</h1>
          <p class="brand-desc">每一笔花费，都值得被认真记录</p>
          <div class="brand-features">
            <div class="feature-item">
              <CheckCircle2 :size="16" :stroke-width="2" />
              <span>快速记账，一秒完成</span>
            </div>
            <div class="feature-item">
              <CheckCircle2 :size="16" :stroke-width="2" />
              <span>智能分析，掌握消费趋势</span>
            </div>
            <div class="feature-item">
              <CheckCircle2 :size="16" :stroke-width="2" />
              <span>多端同步，数据不丢失</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Login Form -->
      <div class="form-section">
        <div class="form-inner">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">登录你的账户继续</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input
                v-model="loginForm.username"
                type="text"
                placeholder="输入用户名"
                class="form-input"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="password-wrap">
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="输入密码"
                  class="form-input"
                  autocomplete="current-password"
                />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <Eye v-if="!showPassword" :size="18" :stroke-width="1.5" />
                  <EyeOff v-else :size="18" :stroke-width="1.5" />
                </button>
              </div>
            </div>

            <div v-if="error" class="error-message">
              <AlertCircle :size="16" :stroke-width="2" />
              <span>{{ error }}</span>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '登录中...' : '登 录' }}
            </button>
          </form>

          <div class="form-footer">
            <button class="link-btn" @click="openRegister">创建新账户</button>
            <span class="divider">·</span>
            <button class="link-btn" @click="openForgotPassword">忘记密码？</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div v-if="showRegister" class="modal-overlay" @click.self="closeRegister">
      <div class="modal">
        <button class="modal-close" @click="closeRegister">
          <X :size="20" :stroke-width="2" />
        </button>
        <div class="modal-header">
          <h2>创建账户</h2>
          <p>注册即可开始记账</p>
        </div>
        <form @submit.prevent="handleRegister" class="modal-form">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="registerForm.username" type="text" placeholder="3-20个字符" class="form-input" autocomplete="new-username" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="registerForm.password" type="password" placeholder="至少6位" class="form-input" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" class="form-input" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <div class="input-with-btn">
              <input v-model="registerForm.email" type="email" placeholder="邮箱地址" class="form-input flex-1" autocomplete="new-email" />
              <button type="button" class="code-btn" :disabled="!registerForm.email || countdown > 0 || sendingCode" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">验证码</label>
            <input v-model="registerForm.code" type="text" placeholder="6位验证码" maxlength="6" class="form-input" autocomplete="one-time-code" />
          </div>
          <div v-if="registerError" class="error-message">
            <AlertCircle :size="16" :stroke-width="2" />
            <span>{{ registerError }}</span>
          </div>
          <div v-if="codeSent" class="success-message">
            <CheckCircle2 :size="16" :stroke-width="2" />
            <span>验证码已发送到邮箱</span>
          </div>
          <button type="submit" class="submit-btn" :disabled="registering">
            <span v-if="registering" class="loading-spinner"></span>
            {{ registering ? '注册中...' : '创建账户' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPassword" class="modal-overlay" @click.self="closeForgotPassword">
      <div class="modal">
        <button class="modal-close" @click="closeForgotPassword">
          <X :size="20" :stroke-width="2" />
        </button>

        <div v-if="!passwordResetSuccess">
          <div class="modal-header">
            <h2>找回密码</h2>
            <p>通过邮箱验证码重置密码</p>
          </div>
          <form @submit.prevent="handleResetPassword" class="modal-form">
            <div class="form-group">
              <label class="form-label">注册邮箱</label>
              <div class="input-with-btn">
                <input v-model="forgotPasswordForm.email" type="email" placeholder="输入注册邮箱" class="form-input flex-1" autocomplete="new-email" />
                <button type="button" class="code-btn" :disabled="!forgotPasswordForm.email || countdown > 0 || sendingCode" @click="sendForgotCode">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">验证码</label>
              <input v-model="forgotPasswordForm.code" type="text" placeholder="6位验证码" maxlength="6" class="form-input" autocomplete="one-time-code" />
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <input v-model="forgotPasswordForm.newPassword" type="password" placeholder="至少6位" class="form-input" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label">确认新密码</label>
              <input v-model="forgotPasswordForm.confirmPassword" type="password" placeholder="再次输入新密码" class="form-input" autocomplete="new-password" />
            </div>
            <div v-if="forgotPasswordError" class="error-message">
              <AlertCircle :size="16" :stroke-width="2" />
              <span>{{ forgotPasswordError }}</span>
            </div>
            <button type="submit" class="submit-btn" :disabled="resettingPassword">
              <span v-if="resettingPassword" class="loading-spinner"></span>
              {{ resettingPassword ? '处理中...' : '重置密码' }}
            </button>
          </form>
        </div>

        <div v-else class="success-state">
          <div class="success-icon">
            <CircleCheck :size="48" :stroke-width="1.5" />
          </div>
          <h3>密码已重置</h3>
          <p>请使用新密码登录</p>
          <button class="submit-btn" @click="closeForgotPassword">去登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import axios from "axios";
import {
  Wallet, Eye, EyeOff, AlertCircle, CheckCircle2,
  CircleCheck, X
} from 'lucide-vue-next';

const router = useRouter();
const systemName = ref('随手记')

const fetchSystemInfo = async () => {
  try {
    const res = await axios.get('/api/auth/system-info')
    if (res.data.systemName) {
      systemName.value = res.data.systemName
    }
  } catch (e) {
    // use default
  }
}

onMounted(() => {
  fetchSystemInfo()
})

const loginFormRef = ref(null);
const registerFormRef = ref(null);
const forgotFormRef = ref(null);

const loginForm = reactive({ username: "", password: "" });
const registerForm = reactive({ username: "", password: "", confirmPassword: "", email: "", code: "" });
const forgotPasswordForm = reactive({ email: "", code: "", newPassword: "", confirmPassword: "" });

const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const showRegister = ref(false);
const showForgotPassword = ref(false);
const sendingCode = ref(false);
const registering = ref(false);
const resettingPassword = ref(false);
const countdown = ref(0);
let countdownTimer = null;
const codeSent = ref(false);
const registerError = ref("");
const forgotPasswordError = ref("");
const passwordResetSuccess = ref(false);

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    error.value = "请输入用户名和密码";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const { data } = await axios.post("/api/auth/login", loginForm);
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("user", JSON.stringify(data.user));
    ElMessage.success("登录成功！");
    if (data.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  } catch (err) {
    error.value = err.response?.data?.message || "登录失败，请检查用户名和密码";
  } finally {
    loading.value = false;
  }
};

const openRegister = () => {
  registerForm.username = "";
  registerForm.password = "";
  registerForm.confirmPassword = "";
  registerForm.email = "";
  registerForm.code = "";
  registerError.value = "";
  codeSent.value = false;
  countdown.value = 0;
  if (countdownTimer) clearInterval(countdownTimer);
  showRegister.value = true;
};

const closeRegister = () => { showRegister.value = false; };

const openForgotPassword = () => {
  forgotPasswordForm.email = "";
  forgotPasswordForm.code = "";
  forgotPasswordForm.newPassword = "";
  forgotPasswordForm.confirmPassword = "";
  forgotPasswordError.value = "";
  passwordResetSuccess.value = false;
  countdown.value = 0;
  if (countdownTimer) clearInterval(countdownTimer);
  showForgotPassword.value = true;
};

const closeForgotPassword = () => { showForgotPassword.value = false; };

const sendCode = async () => {
  if (!registerForm.email || !registerForm.email.includes("@")) {
    registerError.value = "请输入正确的邮箱地址";
    return;
  }
  sendingCode.value = true;
  registerError.value = "";
  codeSent.value = false;
  try {
    await axios.post("/api/auth/send-code", { email: registerForm.email });
    codeSent.value = true;
    countdown.value = 60;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(countdownTimer);
    }, 1000);
  } catch (err) {
    registerError.value = err.response?.data?.message || "发送失败，请稍后重试";
  } finally {
    sendingCode.value = false;
  }
};

const handleRegister = async () => {
  if (!registerForm.username || registerForm.username.length < 3 || registerForm.username.length > 20) {
    registerError.value = "用户名长度需在 3-20 个字符";
    return;
  }
  if (!registerForm.password || registerForm.password.length < 6) {
    registerError.value = "密码至少6位";
    return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = "两次输入的密码不一致";
    return;
  }
  if (!registerForm.code || registerForm.code.length !== 6) {
    registerError.value = "请输入6位验证码";
    return;
  }
  registering.value = true;
  registerError.value = "";
  try {
    await axios.post("/api/auth/register", {
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email,
      code: registerForm.code,
    });
    ElMessage.success("注册成功！请登录");
    closeRegister();
  } catch (err) {
    registerError.value = err.response?.data?.message || "注册失败，请稍后重试";
  } finally {
    registering.value = false;
  }
};

const sendForgotCode = async () => {
  if (!forgotPasswordForm.email || !forgotPasswordForm.email.includes("@")) {
    forgotPasswordError.value = "请输入正确的邮箱地址";
    return;
  }
  sendingCode.value = true;
  forgotPasswordError.value = "";
  try {
    await axios.post("/api/auth/send-forgot-code", { email: forgotPasswordForm.email });
    countdown.value = 60;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(countdownTimer);
    }, 1000);
  } catch (err) {
    forgotPasswordError.value = err.response?.data?.message || "发送失败，请稍后重试";
  } finally {
    sendingCode.value = false;
  }
};

const handleResetPassword = async () => {
  if (!forgotPasswordForm.email || !forgotPasswordForm.code || !forgotPasswordForm.newPassword || forgotPasswordForm.newPassword.length < 6) {
    forgotPasswordError.value = "请填写完整信息，密码至少6位";
    return;
  }
  if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
    forgotPasswordError.value = "两次输入的密码不一致";
    return;
  }
  resettingPassword.value = true;
  forgotPasswordError.value = "";
  try {
    await axios.post("/api/auth/reset-password", {
      email: forgotPasswordForm.email,
      code: forgotPasswordForm.code,
      password: forgotPasswordForm.newPassword,
    });
    passwordResetSuccess.value = true;
  } catch (err) {
    forgotPasswordError.value = err.response?.data?.message || "重置失败，请检查验证码";
  } finally {
    resettingPassword.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FAFAF9 0%, #F5F3FF 50%, #FFF7ED 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Background blobs */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: blobFloat 20s ease-in-out infinite;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: #818CF8;
  top: -10%;
  right: -5%;
  animation-delay: 0s;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: #F97316;
  bottom: -10%;
  left: -5%;
  animation-delay: -7s;
}
.blob-3 {
  width: 250px;
  height: 250px;
  background: #34D399;
  top: 50%;
  left: 40%;
  animation-delay: -14s;
}
@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Layout */
.login-container {
  display: flex;
  width: 100%;
  max-width: 960px;
  min-height: 560px;
  background: var(--color-surface);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(28, 25, 23, 0.08), 0 0 0 1px rgba(28, 25, 23, 0.03);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* Brand Section */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.brand-section::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  bottom: -40px;
  right: -40px;
}
.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}
.logo-icon-wrap {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.brand-desc {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 32px;
}
.brand-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

/* Form Section */
.form-section {
  flex: 1;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.form-inner {
  width: 100%;
  max-width: 360px;
}
.form-header {
  margin-bottom: 32px;
}
.form-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}
.form-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* Form */
.login-form, .modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: all var(--transition-fast);
  outline: none;
}
.form-input::placeholder {
  color: var(--color-text-muted);
}
.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.password-wrap {
  position: relative;
}
.password-wrap .form-input {
  padding-right: 44px;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color var(--transition-fast);
}
.password-toggle:hover {
  color: var(--color-text-secondary);
}

.input-with-btn {
  display: flex;
  gap: 8px;
}
.input-with-btn .form-input {
  flex: 1;
}
.code-btn {
  height: 44px;
  padding: 0 16px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-ui);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.code-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error / Success */
.error-message, .success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
}
.error-message {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}
.success-message {
  background: var(--color-income-bg);
  color: var(--color-income);
}

/* Submit Button */
.submit-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer Links */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}
.link-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 13px;
  font-family: var(--font-ui);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color var(--transition-fast);
}
.link-btn:hover {
  color: var(--color-primary);
}
.divider {
  color: var(--color-border-strong);
  font-size: 13px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border-radius: 20px;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: modalSlide 0.25s ease;
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes modalSlide {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-surface-hover);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}
.modal-close:hover {
  background: var(--color-surface-active);
  color: var(--color-text-primary);
}
.modal-header {
  margin-bottom: 24px;
}
.modal-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.modal-header p {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* Success State */
.success-state {
  text-align: center;
  padding: 24px 0;
}
.success-icon {
  width: 72px;
  height: 72px;
  background: var(--color-income-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--color-income);
}
.success-state h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
.success-state p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .brand-section {
    display: none;
  }
  .login-container {
    max-width: 420px;
    min-height: auto;
  }
  .form-section {
    padding: 32px 24px;
  }
}
</style>
