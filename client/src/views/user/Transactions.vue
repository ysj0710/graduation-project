<template>
  <div class="user-page">
    <div class="page-header">
      <h2>📋 交易记录</h2>
    </div>
    
    <!-- 筛选器 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterType" size="small">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="expense">支出</el-radio-button>
        <el-radio-button label="income">收入</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 交易列表 -->
    <div class="transactions-list">
      <div 
        v-for="record in filteredRecords" 
        :key="record._id"
        class="transaction-item"
      >
        <div class="transaction-icon" :style="{ background: record.type === 'income' ? '#34C75915' : '#FF3B3015', color: record.type === 'income' ? '#34C759' : '#FF3B30' }">
          {{ getCategoryIcon(record.category) }}
        </div>
        <div class="transaction-info">
          <div class="transaction-title">{{ record.category }}</div>
          <div class="transaction-note" v-if="record.note">{{ record.note }}</div>
          <div class="transaction-time">{{ formatTime(record.date) }}</div>
        </div>
        <div class="transaction-amount" :class="record.type">
          {{ record.type === 'income' ? '+' : '-' }}¥{{ formatNumber(record.amount) }}
        </div>
      </div>
      
      <el-empty v-if="filteredRecords.length === 0" description="暂无记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import axios from 'axios'

const userStore = useUserStore()
const records = ref([])
const filterType = ref('all')

const filteredRecords = computed(() => {
  if (filterType.value === 'all') return records.value
  return records.value.filter(r => r.type === filterType.value)
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getCategoryIcon = (category) => {
  const icons = {
    '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
    '住房': '🏠', '医疗': '💊', '教育': '📚', '其他': '📦',
    '工资': '💰', '奖金': '🎁', '理财': '📈', '兼职': '💼'
  }
  return icons[category] || '💰'
}

const fetchRecords = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    records.value = res.data.transactions || []
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.user-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.filter-bar {
  margin-bottom: 20px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #F5F5F7;
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.transaction-note {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}

.transaction-time {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 4px;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 700;
}

.transaction-amount.expense {
  color: #FF3B30;
}

.transaction-amount.income {
  color: #34C759;
}
</style>
