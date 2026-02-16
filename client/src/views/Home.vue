<template>
  <div class="home-container">
    <header class="header">
      <h1>个人财务记账系统</h1>
      <div class="user-info">
        <span>欢迎，{{ user?.username || '用户' }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>
    
    <main class="main-content">
      <div class="welcome-card">
        <h2>🎉 登录成功！</h2>
        <p>欢迎来到个人财务记账与可视化系统</p>
        
        <div class="features">
          <div class="feature-item">
            <span class="icon">💰</span>
            <span>记账功能</span>
          </div>
          <div class="feature-item">
            <span class="icon">📊</span>
            <span>数据可视化</span>
          </div>
          <div class="feature-item">
            <span class="icon">📈</span>
            <span>统计分析</span>
          </div>
        </div>
      </div>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">总收入</div>
          <div class="stat-value income">¥0.00</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总支出</div>
          <div class="stat-value expense">¥0.00</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">结余</div>
          <div class="stat-value balance">¥0.00</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  // 从本地存储获取用户信息
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  }
})

const handleLogout = () => {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // 跳转到登录页
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  color: #333;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info span {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  padding: 8px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.main-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.welcome-card h2 {
  color: #333;
  font-size: 28px;
  margin-bottom: 10px;
}

.welcome-card p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
}

.features {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  background: #f8f9fa;
  border-radius: 12px;
}

.feature-item .icon {
  font-size: 24px;
}

.feature-item span:last-child {
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-value.income {
  color: #27ae60;
}

.stat-value.expense {
  color: #e74c3c;
}

.stat-value.balance {
  color: #3498db;
}
</style>
