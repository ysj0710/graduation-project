<template>
  <div class="user-page">
    <div class="page-header">
      <h2>📊 统计分析</h2>
    </div>
    
    <!-- 时间筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="small" @change="fetchData">
        <el-radio-button value="week">本周</el-radio-button>
        <el-radio-button value="month">本月</el-radio-button>
        <el-radio-button value="year">本年</el-radio-button>
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
const dailyData = ref([])
const categoryData = ref([])

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// 计算日期范围
const getDateRange = () => {
  const now = new Date()
  let startDate, endDate
  
  if (timeRange.value === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    endDate = now
  } else if (timeRange.value === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31)
  } else {
    // month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token')
    const { startDate, endDate } = getDateRange()
    
    // 获取统计数据
    const statsRes = await axios.get('https://ysj0710.xyz/api/transactions/statistics', {
      params: { startDate, endDate },
      headers: { Authorization: `Bearer ${token}` }
    })
    
    statistics.value = {
      totalIncome: statsRes.data.income?.total || 0,
      totalExpense: statsRes.data.expense?.total || 0,
      balance: statsRes.data.balance || 0
    }
    
    // 获取每日数据（趋势图）
    const dailyRes = await axios.get('https://ysj0710.xyz/api/transactions/daily-stats', {
      params: { range: timeRange.value },
      headers: { Authorization: `Bearer ${token}` }
    })
    dailyData.value = dailyRes.data || []
    
    // 获取分类数据（饼图）
    const expenseCats = statsRes.data.byCategory?.expense || []
    categoryData.value = expenseCats.map(cat => ({
      name: cat.category,
      value: cat.total
    }))
    
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
    
    let xData, chartData
    if (timeRange.value === 'week') {
      xData = dailyData.value.map(item => {
        const d = new Date(item.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      })
      chartData = dailyData.value.map(item => item.amount)
    } else if (timeRange.value === 'year') {
      // 按月汇总
      const monthMap = {}
      dailyData.value.forEach(item => {
        const month = item.date.substring(0, 7)
        monthMap[month] = (monthMap[month] || 0) + item.amount
      })
      xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      chartData = xData.map((_, i) => {
        const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`
        return monthMap[key] || 0
      })
    } else {
      xData = dailyData.value.map(item => {
        const day = parseInt(item.date.split('-')[2])
        return `${day}日`
      })
      chartData = dailyData.value.map(item => item.amount)
    }
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xData, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value' },
      series: [
        { name: '支出', type: 'bar', data: chartData, itemStyle: { color: '#007AFF' }, barWidth: '60%' }
      ]
    })
  }
  
  // 饼图
  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    const colors = ['#FF3B30', '#007AFF', '#FF9500', '#34C759', '#5856D6', '#FF2D55', '#AF52DE', '#5AC8FA']
    
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: categoryData.value.map((item, index) => ({
          ...item,
          itemStyle: { color: colors[index % colors.length] }
        }))
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-label {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-value.income {
  color: #34C759;
}

.stat-value.expense {
  color: #FF3B30;
}

.ios-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.ios-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.chart-container {
  height: 280px;
}
</style>
