<template>
  <div class="home-container">
    <header class="header">
      <h1>个人财务记账系统</h1>
      <div class="user-info">
        <span>欢迎，{{ user?.nickname || user?.username }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>
    
    <main class="main-content">
      <div class="welcome-card">
        <h2>💰 个人财务记账</h2>
        <p>记录每一笔收入和支出</p>
        
        <div class="features">
          <div class="feature-item" @click="showAddDialog = true">
            <span class="icon">➕</span>
            <span>记一笔账</span>
          </div>
          <div class="feature-item" @click="showRecords">
            <span class="icon">📋</span>
            <span>账单明细</span>
          </div>
          <div class="feature-item" @click="showStats">
            <span class="icon">📈</span>
            <span>数据报表</span>
          </div>
        </div>
      </div>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">本月收入</div>
          <div class="stat-value income">¥{{ monthStats.income.toFixed(2) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">本月支出</div>
          <div class="stat-value expense">¥{{ monthStats.expense.toFixed(2) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">本月结余</div>
          <div class="stat-value" :class="monthStats.balance >= 0 ? 'income' : 'expense'">
            ¥{{ monthStats.balance.toFixed(2) }}
          </div>
        </div>
      </div>

      <!-- 最近交易记录 -->
      <div class="recent-records" v-if="recentTransactions.length > 0">
        <h3>📝 最近交易</h3>
        <div class="record-list">
          <div 
            v-for="record in recentTransactions" 
            :key="record._id" 
            class="record-item"
          >
            <div class="record-info">
              <span class="record-category">{{ record.category }}</span>
              <span class="record-note" v-if="record.note">{{ record.note }}</span>
              <span class="record-date">{{ formatDate(record.date) }}</span>
            </div>
            <div class="record-amount" :class="record.type">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
            </div>
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
            <input type="number" v-model="newRecord.amount" placeholder="请输入金额" required step="0.01" min="0" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newRecord.category">
              <option value="" disabled>请选择分类</option>
              <optgroup v-if="newRecord.type === 'income'" label="收入分类">
                <option value="工资">工资</option>
                <option value="奖金">奖金</option>
                <option value="理财">理财</option>
                <option value="兼职">兼职</option>
                <option value="其他收入">其他收入</option>
              </optgroup>
              <optgroup v-if="newRecord.type === 'expense'" label="支出分类">
                <option value="餐饮">餐饮</option>
                <option value="交通">交通</option>
                <option value="购物">购物</option>
                <option value="娱乐">娱乐</option>
                <option value="住房">住房</option>
                <option value="医疗">医疗</option>
                <option value="教育">教育</option>
                <option value="其他支出">其他支出</option>
              </optgroup>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input type="text" v-model="newRecord.note" placeholder="可选备注" />
          </div>
          <div class="form-group">
            <label>日期</label>
            <input type="date" v-model="newRecord.date" />
          </div>
          <div class="modal-buttons">
            <button type="button" class="cancel-btn" @click="showAddDialog = false">取消</button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const user = ref(null)
const loading = ref(false)
const showAddDialog = ref(false)
const recentTransactions = ref([])

const monthStats = reactive({
  income: 0,
  expense: 0,
  balance: 0
})

const newRecord = reactive({
  type: 'expense',
  amount: '',
  category: '',
  note: '',
  date: new Date().toISOString().split('T')[0]
})

// API 请求配置
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

// 请求拦截器 - 添加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
    fetchMonthStats()
    fetchRecentTransactions()
  } else {
    router.push('/login')
  }
})

const fetchMonthStats = async () => {
  try {
    const response = await api.get('/transactions/month-stats')
    monthStats.income = response.data.income || 0
    monthStats.expense = response.data.expense || 0
    monthStats.balance = response.data.balance || 0
  } catch (error) {
    console.error('获取月度统计失败:', error)
  }
}

const fetchRecentTransactions = async () => {
  try {
    const response = await api.get('/transactions', {
      params: { pageSize: 5 }
    })
    recentTransactions.value = response.data.transactions || []
  } catch (error) {
    console.error('获取交易记录失败:', error)
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const handleAddRecord = async () => {
  if (!newRecord.amount || !newRecord.category) {
    alert('请填写完整信息')
    return
  }
  
  loading.value = true
  try {
    await api.post('/transactions', {
      type: newRecord.type,
      amount: parseFloat(newRecord.amount),
      category: newRecord.category,
      note: newRecord.note,
      date: newRecord.date
    })
    
    alert('记账成功！')
    showAddDialog.value = false
    
    // 重置表单
    newRecord.amount = ''
    newRecord.category = ''
    newRecord.note = ''
    newRecord.date = new Date().toISOString().split('T')[0]
    
    // 刷新数据
    fetchMonthStats()
    fetchRecentTransactions()
  } catch (error) {
    console.error('记账失败:', error)
    alert(error.response?.data?.message || '记账失败，请重试')
  } finally {
    loading.value = false
  }
}

const showRecords = () => {
  alert('账单明细页面开发中...')
}

const showStats = () => {
  alert('数据报表页面开发中...')
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
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
  gap: 30px;
  flex-wrap: wrap;
}

.feature-item {
  padding: 20px 30px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-item .icon {
  font-size: 28px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.recent-records {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.recent-records h3 {
  color: #333;
  margin-bottom: 16px;
  font-size: 18px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-category {
  font-weight: 600;
  color: #333;
}

.record-note {
  font-size: 12px;
  color: #666;
}

.record-date {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-size: 18px;
  font-weight: bold;
}

.record-amount.income {
  color: #27ae60;
}

.record-amount.expense {
  color: #e74c3c;
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
