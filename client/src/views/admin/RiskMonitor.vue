<template>
  <div class="risk-monitor-page">
    <div class="ios-card">
      <div class="card-header">
        <h3>⚠️ 风险监控中心</h3>
        <div class="filter-btns">
          <el-button size="small" :type="filterLevel === 'all' ? 'primary' : 'default'" @click="filterLevel = 'all'">全部</el-button>
          <el-button size="small" :type="filterLevel === 'high' ? 'danger' : 'default'" @click="filterLevel = 'high'">高风险</el-button>
          <el-button size="small" :type="filterLevel === 'medium' ? 'warning' : 'default'" @click="filterLevel = 'medium'">中风险</el-button>
        </div>
      </div>
      
      <div class="risk-cards">
        <div class="risk-card" :class="user.riskLevel" v-for="user in filteredUsers" :key="user.id">
          <div class="risk-user">
            <el-avatar :size="48">{{ user.name.charAt(0) }}</el-avatar>
            <div class="user-detail">
              <div class="name">{{ user.name }}</div>
              <div class="email">{{ user.email }}</div>
            </div>
            <span :class="['risk-badge', user.riskLevel]">{{ user.riskLabel }}</span>
          </div>
          
          <div class="risk-stats">
            <div class="stat">
              <span class="label">预算</span>
              <span class="value">¥{{ formatNumber(user.budget) }}</span>
            </div>
            <div class="stat">
              <span class="label">已用</span>
              <span class="value expense">¥{{ formatNumber(user.spent) }}</span>
            </div>
            <div class="stat">
              <span class="label">使用率</span>
              <span class="value">{{ user.usageRate }}%</span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div class="progress" :style="{ width: user.usageRate + '%', background: getProgressColor(user.usageRate) }"></div>
          </div>
          
          <div class="risk-actions">
            <el-button size="small" @click="sendReminder(user)">发送提醒</el-button>
            <el-button size="small" @click="viewTransactions(user)">查看消费</el-button>
            <el-button size="small" type="primary" @click="adjustBudget(user)">调整预算</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const filterLevel = ref('all')

const users = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', budget: 5000, spent: 4800, usageRate: 96, riskLevel: 'high', riskLabel: '高风险' },
  { id: 2, name: '李四', email: 'lisi@example.com', budget: 3000, spent: 2600, usageRate: 87, riskLevel: 'high', riskLabel: '高风险' },
  { id: 3, name: '王五', email: 'wangwu@example.com', budget: 4000, spent: 3200, usageRate: 80, riskLevel: 'medium', riskLabel: '中风险' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', budget: 3500, spent: 2100, usageRate: 60, riskLevel: 'medium', riskLabel: '中风险' }
])

const filteredUsers = computed(() => {
  if (filterLevel.value === 'all') return users.value
  return users.value.filter(u => u.riskLevel === filterLevel.value)
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getProgressColor = (rate) => {
  if (rate >= 90) return '#FF3B30'
  if (rate >= 70) return '#FF9500'
  return '#34C759'
}

const sendReminder = (user) => {
  ElMessage.success(`已向用户 ${user.name} 发送风险提醒`)
}

const viewTransactions = (user) => {
  ElMessage.info(`查看用户 ${user.name} 的消费记录`)
}

const adjustBudget = (user) => {
  ElMessage.info(`调整用户 ${user.name} 的预算`)
}
</script>

<style scoped>
.risk-monitor-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.filter-btns {
  display: flex;
  gap: 8px;
}

.risk-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.risk-card {
  border: 1px solid #E5E5EA;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
}

.risk-card.high {
  border-color: rgba(255, 59, 48, 0.3);
  background: rgba(255, 59, 48, 0.05);
}

.risk-card.medium {
  border-color: rgba(255, 149, 0, 0.3);
  background: rgba(255, 149, 0, 0.05);
}

.risk-user {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.user-detail {
  flex: 1;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.email {
  font-size: 13px;
  color: #8E8E93;
}

.risk-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.high { background: #FF3B30; color: white; }
.risk-badge.medium { background: #FF9500; color: white; }

.risk-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat .label {
  font-size: 12px;
  color: #8E8E93;
}

.stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.stat .value.expense {
  color: #FF3B30;
}

.progress-bar {
  height: 8px;
  background: #E5E5EA;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.risk-actions {
  display: flex;
  gap: 10px;
}
</style>
