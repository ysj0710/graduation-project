<template>
  <div class="admin-dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.monthlyTransactions }}</div>
          <div class="stat-label">本月交易</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon red">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.highRisk }}</div>
          <div class="stat-label">高风险用户</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon orange">📊</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatNumber(stats.monthlyTotal) }}</div>
          <div class="stat-label">本月流水</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="ios-card chart-card">
        <h3>📈 消费趋势</h3>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
      
      <div class="ios-card chart-card">
        <h3>🥧 用户风险分布</h3>
        <div ref="riskChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 风险用户列表 -->
    <div class="ios-card">
      <div class="card-header">
        <h3>⚠️ 风险用户预警</h3>
        <el-button type="primary" size="small" @click="$router.push('/admin/risk')">查看全部</el-button>
      </div>
      <div class="risk-table">
        <div class="table-header">
          <span>用户</span>
          <span>预算</span>
          <span>已用</span>
          <span>风险等级</span>
          <span>操作</span>
        </div>
        <div class="table-row" v-for="user in riskUsers" :key="user.id">
          <div class="user-cell">
            <el-avatar :size="32">{{ user.name.charAt(0) }}</el-avatar>
            <span>{{ user.name }}</span>
          </div>
          <span>¥{{ formatNumber(user.budget) }}</span>
          <span class="expense">¥{{ formatNumber(user.spent) }}</span>
          <span :class="['risk-badge', user.riskLevel]">{{ user.riskLabel }}</span>
          <el-button size="small" @click="sendReminder(user)">提醒</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const stats = ref({
  totalUsers: 156,
  monthlyTransactions: 2340,
  highRisk: 12,
  monthlyTotal: 156000
})

const riskUsers = ref([
  { id: 1, name: '张三', budget: 5000, spent: 4800, riskLevel: 'high', riskLabel: '高风险' },
  { id: 2, name: '李四', budget: 3000, spent: 2600, riskLevel: 'medium', riskLabel: '中风险' },
  { id: 3, name: '王五', budget: 4000, spent: 3200, riskLevel: 'medium', riskLabel: '中风险' }
])

const trendChartRef = ref(null)
const riskChartRef = ref(null)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const sendReminder = (user) => {
  ElMessage.success(`已向用户 ${user.name} 发送提醒`)
}

const renderCharts = () => {
  // 趋势图
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [12000, 15000, 11000, 18000, 14000, 16000],
        itemStyle: { color: '#007AFF', borderRadius: [8, 8, 0, 0] }
      }]
    })
  }
  
  // 风险分布饼图
  if (riskChartRef.value) {
    const chart = echarts.init(riskChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 120, name: '低风险', itemStyle: { color: '#34C759' } },
          { value: 24, name: '中风险', itemStyle: { color: '#FF9500' } },
          { value: 12, name: '高风险', itemStyle: { color: '#FF3B30' } }
        ]
      }]
    })
  }
}

onMounted(() => {
  nextTick(() => {
    renderCharts()
  })
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: rgba(0, 122, 255, 0.15); }
.stat-icon.green { background: rgba(52, 199, 89, 0.15); }
.stat-icon.red { background: rgba(255, 59, 48, 0.15); }
.stat-icon.orange { background: rgba(255, 149, 0, 0.15); }

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #000;
}

.stat-label {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
}

.chart-container {
  height: 280px;
}

.risk-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 100px;
  padding: 12px 16px;
  background: #F5F5F7;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 100px;
  padding: 16px;
  border-bottom: 1px solid #F2F2F7;
  align-items: center;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expense {
  color: #FF3B30;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.risk-badge.high {
  background: rgba(255, 59, 48, 0.15);
  color: #FF3B30;
}

.risk-badge.medium {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.risk-badge.low {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}
</style>
