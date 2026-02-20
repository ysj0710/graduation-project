<template>
  <div class="user-page">
    <div class="page-header">
      <h2>📊 统计分析</h2>
    </div>
    
    <!-- 时间筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="small" @change="fetchData">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="year">本年</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">总收入</div>
        <div class="stat-value income">¥{{ formatNumber(statistics.totalIncome) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总支出</div>
        <div class="stat-value expense">¥{{ formatNumber(statistics.totalExpense) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">结余</div>
        <div class="stat-value">¥{{ formatNumber(statistics.balance) }}</div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="ios-card">
      <h3>📈 消费趋势</h3>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>
    
    <div class="ios-card">
      <h3>🥧 支出分类</h3>
      <div ref="pieChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const timeRange = ref('month')
const statistics = ref({ totalIncome: 0, totalExpense: 0, balance: 0 })
const trendChartRef = ref(null)
const pieChartRef = ref(null)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/transactions/statistics', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    statistics.value = {
      totalIncome: res.data.income?.total || 0,
      totalExpense: res.data.expense?.total || 0,
      balance: res.data.balance || 0
    }
    
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const renderCharts = () => {
  // 趋势图
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周'] },
      yAxis: { type: 'value' },
      series: [
        { name: '支出', type: 'bar', data: [1200, 900, 1500, 1100], itemStyle: { color: '#007AFF' } }
      ]
    })
  }
  
  // 饼图
  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: '餐饮', value: 1200, itemStyle: { color: '#FF3B30' } },
          { name: '购物', value: 800, itemStyle: { color: '#007AFF' } },
          { name: '交通', value: 400, itemStyle: { color: '#FF9500' } }
        ]
      }]
    })
  }
}

onMounted(() => {
  fetchData()
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #000;
}

.stat-value.income {
  color: #34C759;
}

.stat-value.expense {
  color: #FF3B30;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.chart-container {
  height: 250px;
}
</style>
