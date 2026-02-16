<template>
  <div class="home-container">
    <header class="header">
      <h1>个人财务记账系统</h1>
      <div class="user-info">
        <span class="role-badge" :class="user?.role">{{ user?.role === 'admin' ? '管理员' : '普通用户' }}</span>
        <span>欢迎，{{ user?.nickname || user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>
    
    <main class="main-content">
      <!-- 管理员界面 -->
      <div v-if="user?.role === 'admin'" class="admin-panel">
        <div class="welcome-card admin">
          <h2>🔧 管理员后台</h2>
          <p>欢迎来到管理后台</p>
          
          <div class="admin-features">
            <div class="feature-card">
              <span class="icon">👥</span>
              <h3>用户管理</h3>
              <p>查看和管理所有注册用户</p>
            </div>
            <div class="feature-card">
              <span class="icon">📊</span>
              <h3>数据统计</h3>
              <p>查看所有用户的财务数据统计</p>
            </div>
            <div class="feature-card">
              <span class="icon">⚙️</span>
              <h3>系统设置</h3>
              <p>管理系统配置和参数</p>
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
            <div class="stat-label">用户数量</div>
            <div class="stat-value balance">0</div>
          </div>
        </div>
      </div>
      
      <!-- 普通用户界面 -->
      <div v-else class="user-panel">
        <div class="welcome-card">
          <h2>💰 个人财务记账</h2>
          <p>记录每一笔收入和支出</p>
          
          <div class="features">
            <div class="feature-item" @click="showAddDialog = true">
              <span class="icon">➕</span>
              <span>记一笔账</span>
            </div>
            <div class="feature-item">
              <span class="icon">📋</span>
              <span>账单明细</span>
            </div>
            <div class="feature-item">
              <span class="icon">📈</span>
              <span>数据报表</span>
            </div>
          </div>
        </div>
        
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-label">本月收入</div>
            <div class="stat-value income">¥0.00</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">本月支出</div>
            <div class="stat-value expense">¥0.00</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">本月结余</div>
            <div class="stat-value balance">¥0.00</div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 记账弹窗 -->
    <div class="modal" v-if="showAddDialog" @click.self="showAddDialog = false">
      <div class="add-dialog">
        <h2>记一笔账</h2>
        <form @submit.prevent="handleAddRecord">
          <div class="form-group">
            <label>类型</label>
            <select v-model="newRecord.type">
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div class="form-group">
            <label>金额</label>
            <input type="number" v-model="newRecord.amount" placeholder="请输入金额" required />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newRecord.category">
              <option value="工资">工资</option>
              <option value="奖金">奖金</option>
              <option value="理财">理财</option>
              <option value="餐饮">餐饮</option>
              <option value="交通">交通</option>
              <option value="购物">购物</option>
              <option value="娱乐">娱乐</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input type="text" v-model="newRecord.note" placeholder="可选备注" />
          </div>
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="showAddDialog = false">取消</button>
            <button type="submit" class="submit-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const showAddDialog = ref(false)
const newRecord = ref({
  type: 'expense',
  amount: '',
  category: '餐饮',
  note: ''
})

onMounted(() => {
  // 从本地存储获取用户信息
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  } else {
    // 没有登录，跳转到登录页
    router.push('/login')
  }
})

const handleLogout = () => {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // 跳转到登录页
  router.push('/login')
}

const handleAddRecord = () => {
  console.log('记账:', newRecord.value)
  alert('记账功能开发中...')
  showAddDialog.value = false
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
  gap: 15px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.role-badge.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.role-badge.user {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
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

.welcome-card.admin {
  background: linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%);
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

.features, .admin-features {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.feature-item, .feature-card {
  padding: 20px 30px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-item:hover, .feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-card {
  text-align: center;
  min-width: 180px;
}

.feature-item .icon, .feature-card .icon {
  font-size: 28px;
}

.feature-card h3 {
  margin: 10px 0 5px;
  color: #333;
}

.feature-card p {
  font-size: 12px;
  margin-bottom: 0;
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

/* 弹窗样式 */
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

.add-dialog {
  background: white;
  padding: 30px;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  margin: 20px;
}

.add-dialog h2 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #333;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .submit-btn {
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

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}
</style>
