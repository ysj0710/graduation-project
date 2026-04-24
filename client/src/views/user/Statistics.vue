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
      <div class="stat-card income-stat">
        <div class="stat-card-bg income-bg"></div>
        <div class="stat-card-content">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-label">总收入</div>
            <div class="stat-value income">¥{{ formatNumber(statistics.totalIncome) }}</div>
          </div>
        </div>
      </div>
      <div class="stat-card expense-stat">
        <div class="stat-card-bg expense-bg"></div>
        <div class="stat-card-content">
          <div class="stat-icon">💳</div>
          <div class="stat-info">
            <div class="stat-label">总支出</div>
            <div class="stat-value expense">¥{{ formatNumber(statistics.totalExpense) }}</div>
          </div>
        </div>
      </div>
      <div class="stat-card balance-stat">
        <div class="stat-card-bg balance-bg"></div>
        <div class="stat-card-content">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-label">结余</div>
            <div class="stat-value" :class="statistics.balance >= 0 ? 'positive' : 'negative'">¥{{ formatNumber(statistics.balance) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 收支对比面积图 -->
    <div class="ios-card">
      <h3>📈 收入 vs 支出对比</h3>
      <div ref="compareChartRef" class="chart-container"></div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <div class="ios-card">
        <h3>📊 消费趋势</h3>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="ios-card">
        <h3>🥧 支出分类</h3>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
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
const compareChartRef = ref(null)
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
  renderCompareChart()
  renderTrendChart()
  renderPieChart()
}

// 收支对比面积图
const renderCompareChart = () => {
  if (!compareChartRef.value) return
  const chart = echarts.init(compareChartRef.value)

  let xData, expenseData, incomeData
  if (timeRange.value === 'week') {
    xData = dailyData.value.map(item => {
      const d = new Date(item.date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    expenseData = dailyData.value.map(item => item.amount)
    incomeData = dailyData.value.map(item => item.income || 0)
  } else if (timeRange.value === 'year') {
    const monthMap = { expense: {}, income: {} }
    dailyData.value.forEach(item => {
      const month = item.date.substring(0, 7)
      monthMap.expense[month] = (monthMap.expense[month] || 0) + item.amount
      monthMap.income[month] = (monthMap.income[month] || 0) + (item.income || 0)
    })
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    xData = months
    expenseData = months.map((_, i) => {
      const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`
      return monthMap.expense[key] || 0
    })
    incomeData = months.map((_, i) => {
      const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`
      return monthMap.income[key] || 0
    })
  } else {
    xData = dailyData.value.map(item => {
      const day = parseInt(item.date.split('-')[2])
      return `${day}日`
    })
    expenseData = dailyData.value.map(item => item.amount)
    incomeData = dailyData.value.map(item => item.income || 0)
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 13 }
    },
    legend: {
      data: ['支出', '收入'],
      top: 0,
      textStyle: { fontSize: 13, color: '#666' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 11, color: '#8E8E93' },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#8E8E93',
        formatter: val => val >= 1000 ? `¥${(val / 1000).toFixed(1)}k` : `¥${val}`
      },
      splitLine: { lineStyle: { color: '#F0F0F5', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 59, 48, 0.3)' },
            { offset: 1, color: 'rgba(255, 59, 48, 0.02)' }
          ])
        },
        itemStyle: { color: '#FF3B30' },
        lineStyle: { width: 2.5 },
        symbol: 'circle',
        symbolSize: 4,
        animationDuration: 1000
      },
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: incomeData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(52, 199, 89, 0.3)' },
            { offset: 1, color: 'rgba(52, 199, 89, 0.02)' }
          ])
        },
        itemStyle: { color: '#34C759' },
        lineStyle: { width: 2.5 },
        symbol: 'circle',
        symbolSize: 4,
        animationDuration: 1000,
        animationDelay: 200
      }
    ]
  })
}

// 趋势图
const renderTrendChart = () => {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)

  let xData, chartData
  if (timeRange.value === 'week') {
    xData = dailyData.value.map(item => {
      const d = new Date(item.date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    chartData = dailyData.value.map(item => item.amount)
  } else if (timeRange.value === 'year') {
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
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 13 },
      formatter: params => {
        const val = params[0]?.value || 0
        return `${params[0]?.axisValue}<br/><b>支出: ¥${formatNumber(val)}</b>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 11, color: '#8E8E93' },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#8E8E93',
        formatter: val => val >= 1000 ? `¥${(val / 1000).toFixed(1)}k` : `¥${val}`
      },
      splitLine: { lineStyle: { color: '#F0F0F5', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        data: chartData,
        barWidth: '55%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#FF6B6B' },
            { offset: 0.5, color: '#FF3B30' },
            { offset: 1, color: '#E84545' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(255, 59, 48, 0.3)'
          }
        },
        showBackground: true,
        backgroundStyle: {
          color: '#F5F5F7',
          borderRadius: [6, 6, 0, 0]
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  })
}

// 饼图
const renderPieChart = () => {
  if (!pieChartRef.value) return
  const chart = echarts.init(pieChartRef.value)
  const colors = ['#FF3B30', '#007AFF', '#FF9500', '#34C759', '#5856D6', '#FF2D55', '#AF52DE', '#5AC8FA']

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 13 }
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
        scaleSize: 8
      },
      data: categoryData.value.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] }
      })),
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: (idx) => idx * 80
    }]
  })
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

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  z-index: 0;
}

.income-bg { background: linear-gradient(135deg, #34C759, #28A745); }
.expense-bg { background: linear-gradient(135deg, #FF3B30, #E84545); }
.balance-bg { background: linear-gradient(135deg, #007AFF, #0056D6); }

.stat-card-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-value.income { color: #34C759; }
.stat-value.expense { color: #FF3B30; }
.stat-value.positive { color: #007AFF; }
.stat-value.negative { color: #FF3B30; }

/* 卡片 */
.ios-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
