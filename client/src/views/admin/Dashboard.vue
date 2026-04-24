<template>
  <div class="admin-dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">
            用户总数
            <span v-if="stats.newUsersToday > 0" class="stat-badge">+{{ stats.newUsersToday }}今日</span>
          </div>
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
          <div class="stat-value">{{ stats.highRiskUsers }}</div>
          <div class="stat-label">
            高风险用户
            <span v-if="stats.mediumRiskUsers > 0" class="stat-badge orange">{{ stats.mediumRiskUsers }}中风险</span>
          </div>
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
        <h3>📈 消费趋势（近6个月）</h3>
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
        <div class="header-actions">
          <el-button 
            type="primary" 
            size="small" 
            :disabled="selectedUsers.length === 0"
            @click="batchSendReminder"
          >
            批量提醒 ({{ selectedUsers.length }})
          </el-button>
          <el-button type="primary" size="small" @click="$router.push('/admin/risk')">查看全部</el-button>
        </div>
      </div>
      <el-table :data="riskUsers" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="用户">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
              <div class="user-info">
                <div class="user-name">{{ row.name }}</div>
                <div class="user-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预算" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.budget) }}
          </template>
        </el-table-column>
        <el-table-column label="已用" width="120">
          <template #default="{ row }">
            <span class="expense">¥{{ formatNumber(row.spent) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="100">
          <template #default="{ row }">
            <el-progress 
              :percentage="parseFloat(row.usageRate)" 
              :status="getProgressStatus(row.usageRate)"
            />
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <span :class="['risk-badge', row.riskLevel]">{{ row.riskLabel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="sendReminder(row)">提醒</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="riskUsers.length === 0" description="暂无风险用户" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const stats = ref({
  totalUsers: 0,
  newUsersToday: 0,
  activeUsers: 0,
  monthlyTransactions: 0,
  monthlyTotal: 0,
  highRiskUsers: 0,
  mediumRiskUsers: 0,
  lowRiskUsers: 0
})

const riskUsers = ref([])
const selectedUsers = ref([])

const trendChartRef = ref(null)
const riskChartRef = ref(null)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getProgressStatus = (rate) => {
  const r = parseFloat(rate)
  if (r >= 100) return 'exception'
  if (r >= 80) return 'warning'
  return 'success'
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    stats.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 获取风险用户
const fetchRiskUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-users', {
      params: { page: 1, pageSize: 5 },
      headers: { Authorization: `Bearer ${token}` }
    })
    riskUsers.value = res.data.users || []
  } catch (error) {
    console.error('获取风险用户失败:', error)
    ElMessage.error('获取风险用户失败')
  }
}

// 获取趋势数据
const fetchTrendData = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/trend-data', {
      headers: { Authorization: `Bearer ${token}` }
    })
    renderTrendChart(res.data)
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

// 获取风险分布
const fetchRiskDistribution = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-distribution', {
      headers: { Authorization: `Bearer ${token}` }
    })
    renderRiskChart(res.data.distribution)
  } catch (error) {
    console.error('获取风险分布失败:', error)
  }
}

// 渲染趋势图
const renderTrendChart = (data) => {
  if (!trendChartRef.value) return
  
  const chart = echarts.init(trendChartRef.value)
  const months = data.map(item => item.month)
  const income = data.map(item => item.income)
  const expense = data.map(item => item.expense)
  
  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(param => {
          result += param.marker + ' ' + param.seriesName + ': ¥' + formatNumber(param.value) + '<br/>'
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0
    },
    grid: { 
      left: '3%', 
      right: '4%', 
      bottom: '15%', 
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      data: months,
      axisLabel: { rotate: 30 }
    },
    yAxis: { 
      type: 'value',
      axisLabel: {
        formatter: (value) => '¥' + (value / 1000).toFixed(0) + 'k'
      }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: income,
        itemStyle: { 
          color: '#34C759',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '支出',
        type: 'bar',
        data: expense,
        itemStyle: { 
          color: '#FF3B30',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  })
}

// 渲染风险分布饼图
const renderRiskChart = (distribution) => {
  if (!riskChartRef.value) return
  
  const chart = echarts.init(riskChartRef.value)
  
  chart.setOption({
    tooltip: { 
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: [
        { 
          value: distribution.low, 
          name: '低风险', 
          itemStyle: { color: '#34C759' } 
        },
        { 
          value: distribution.medium, 
          name: '中风险', 
          itemStyle: { color: '#FF9500' } 
        },
        { 
          value: distribution.high, 
          name: '高风险', 
          itemStyle: { color: '#FF3B30' } 
        }
      ]
    }]
  })
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

// 发送提醒
const sendReminder = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定向用户 "${user.name}" 发送预算超标提醒吗？`,
      '发送提醒',
      {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/send-alert', {
      userId: user.id,
      message: `您的本月支出已达到预算的 ${user.usageRate}%，请注意控制消费。`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    ElMessage.success(`已向 ${user.name} 发送提醒`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发送提醒失败:', error)
      ElMessage.error('发送提醒失败')
    }
  }
}

// 批量发送提醒
const batchSendReminder = async () => {
  if (selectedUsers.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定向选中的 ${selectedUsers.value.length} 位用户发送提醒吗？`,
      '批量发送提醒',
      {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const token = localStorage.getItem('token')
    const userIds = selectedUsers.value.map(u => u.id)
    
    await axios.post('/api/admin/batch-alert', {
      userIds,
      message: '您的预算使用率较高，请注意控制消费。'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    ElMessage.success(`已向 ${selectedUsers.value.length} 位用户发送提醒`)
    selectedUsers.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量发送失败:', error)
      ElMessage.error('批量发送失败')
    }
  }
}

onMounted(() => {
  fetchStats()
  fetchRiskUsers()
  nextTick(() => {
    fetchTrendData()
    fetchRiskDistribution()
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #34C759;
  color: white;
}

.stat-badge.orange {
  background: #FF9500;
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

.header-actions {
  display: flex;
  gap: 8px;
}

.chart-container {
  height: 280px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.user-email {
  font-size: 12px;
  color: #8E8E93;
}

.expense {
  color: #FF3B30;
  font-weight: 600;
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
