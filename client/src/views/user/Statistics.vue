<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card income">
        <div class="stat-icon">
          <Wallet :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-label">总收入</div>
          <div class="stat-amount">¥{{ formatNumber(statistics.totalIncome) }}</div>
        </div>
      </div>

      <div class="stat-card expense">
        <div class="stat-icon">
          <CreditCard :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-label">总支出</div>
          <div class="stat-amount">¥{{ formatNumber(statistics.totalExpense) }}</div>
        </div>
      </div>

      <div class="stat-card balance">
        <div class="stat-icon">
          <BarChart3 :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-label">预算剩余</div>
          <div class="stat-amount" :class="statistics.budgetRemaining >= 0 ? 'positive' : 'negative'">¥{{ formatNumber(statistics.budgetRemaining) }}</div>
        </div>
      </div>

      <div class="stat-card real-balance">
        <div class="stat-icon">
          <TrendingUp :size="24" :stroke-width="1.8" />
        </div>
        <div class="stat-info">
          <div class="stat-label">实际结余</div>
          <div class="stat-amount" :class="statistics.balance >= 0 ? 'positive' : 'negative'">¥{{ formatNumber(statistics.balance) }}</div>
        </div>
      </div>
    </div>

    <!-- 收支对比 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <TrendingUp :size="18" :stroke-width="1.5" />
          <span>收入 vs 支出对比</span>
        </div>
        <div class="btn-group">
          <button class="btn small" :class="{ active: timeRange === 'week' }" @click="timeRange = 'week'; fetchData()">本周</button>
          <button class="btn small" :class="{ active: timeRange === 'month' }" @click="timeRange = 'month'; fetchData()">本月</button>
          <button class="btn small" :class="{ active: timeRange === 'year' }" @click="timeRange = 'year'; fetchData()">本年</button>
        </div>
      </div>
      <div ref="compareChartRef" class="chart-area"></div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <BarChart3 :size="18" :stroke-width="1.5" />
            <span>消费趋势</span>
          </div>
        </div>
        <div ref="trendChartRef" class="chart-area"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <PieChart :size="18" :stroke-width="1.5" />
            <span>支出分类</span>
          </div>
        </div>
        <div ref="pieChartRef" class="chart-area pie"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { BarChart3, Wallet, CreditCard, TrendingUp, PieChart } from 'lucide-vue-next'
import { useUserStore } from '../../stores/user'
import axios from 'axios'

const userStore = useUserStore()

const timeRange = ref('month')
const statistics = ref({ totalIncome: 0, totalExpense: 0, balance: 0, budgetRemaining: 0 })
const trendChartRef = ref(null)
const pieChartRef = ref(null)
const compareChartRef = ref(null)
const dailyData = ref([])
const categoryData = ref([])
const loading = ref(true)

let trendChart = null
let pieChart = null
let compareChart = null

const getCategoryColor = (category) => userStore.getCategoryColor(category)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getDateRange = () => {
  const now = new Date()
  let startDate, endDate

  if (timeRange.value === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    endDate = now
  } else if (timeRange.value === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear() + 1, 0, 1)
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

    // 并行请求统计数据和用户设置
    const [statsRes, settingsRes] = await Promise.all([
      axios.get('/api/transactions/statistics', {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])

    const monthlyBudget = settingsRes.data.settings?.budget?.monthly || 5000
    const yearlyBudget = settingsRes.data.settings?.budget?.yearly || 60000
    const rangeExpense = statsRes.data.expense?.total || 0
    const rangeIncome = statsRes.data.income?.total || 0

    // 如果当前时间范围内收入为0，且是周视图或月视图，回退到查询本月收入
    let displayIncome = rangeIncome
    if (rangeIncome === 0 && (timeRange.value === 'week' || timeRange.value === 'month')) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      try {
        const monthRes = await axios.get('/api/transactions/statistics', {
          params: {
            startDate: monthStart.toISOString().split('T')[0],
            endDate: monthEnd.toISOString().split('T')[0]
          },
          headers: { Authorization: `Bearer ${token}` }
        })
        displayIncome = monthRes.data.income?.total || 0
      } catch (e) {
        console.error('回退查询月度收入失败:', e)
      }
    }

    statistics.value = {
      totalIncome: displayIncome,
      totalExpense: rangeExpense,
      balance: displayIncome - rangeExpense,       // 实际收支结余
      budgetRemaining: timeRange.value === 'year'
        ? (yearlyBudget - rangeExpense)  // 年预算剩余（用于年视图）
        : (monthlyBudget - rangeExpense) // 月预算剩余（用于周/月视图）
    }

    const dailyRes = await axios.get('/api/transactions/daily-stats', {
      params: { range: timeRange.value },
      headers: { Authorization: `Bearer ${token}` }
    })
    dailyData.value = dailyRes.data || []

    const expenseCats = statsRes.data.byCategory?.expense || []
    categoryData.value = expenseCats.map(cat => ({ name: cat.category, value: cat.total }))

    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const renderCharts = () => {
  if (trendChartRef.value && !trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (pieChartRef.value && !pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  if (compareChartRef.value && !compareChart) {
    compareChart = echarts.init(compareChartRef.value)
  }
  if (trendChart) renderTrendChart()
  if (pieChart) renderPieChart()
  if (compareChart) renderCompareChart()
}

const renderCompareChart = () => {
  if (!compareChart) return

  let xData, expenseData, incomeData
  if (timeRange.value === 'week') {
    const now = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    xData = days.map(d => {
      const date = new Date(d)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
    expenseData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? item.amount : 0
    })
    incomeData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? (item.income || 0) : 0
    })
  } else if (timeRange.value === 'year') {
    const monthMap = { expense: {}, income: {} }
    dailyData.value.forEach(item => {
      const month = item.date.substring(0, 7)
      monthMap.expense[month] = (monthMap.expense[month] || 0) + item.amount
      monthMap.income[month] = (monthMap.income[month] || 0) + (item.income || 0)
    })
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const year = new Date().getFullYear()
    expenseData = xData.map((_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return monthMap.expense[key] || 0
    })
    incomeData = xData.map((_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return monthMap.income[key] || 0
    })
  } else {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`)
    }
    xData = days.map(d => `${parseInt(d.split('-')[2])}日`)
    expenseData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? item.amount : 0
    })
    incomeData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? (item.income || 0) : 0
    })
  }

  compareChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917', fontSize: 13 }
    },
    legend: {
      data: ['支出', '收入'],
      top: 4,
      textStyle: { fontSize: 12, color: '#78716C' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 11, color: '#78716C' },
      axisLine: { lineStyle: { color: '#E7E5E4' } }
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: {
        fontSize: 11,
        color: '#78716C',
        formatter: val => {
          if (val >= 10000) return `¥${(val / 1000).toFixed(0)}k`
          if (val >= 1000) return `¥${(val / 1000).toFixed(1)}k`
          return `¥${val}`
        }
      },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [
      {
        name: '支出',
        type: 'line',
        smooth: 0.4,
        data: expenseData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        },
        itemStyle: { color: '#EF4444' },
        lineStyle: { width: 2.5 }
      },
      {
        name: '收入',
        type: 'line',
        smooth: 0.4,
        data: incomeData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
          ])
        },
        itemStyle: { color: '#10B981' },
        lineStyle: { width: 2.5 }
      }
    ]
  })
}

const renderTrendChart = () => {
  if (!trendChart) return

  let xData, chartData
  if (timeRange.value === 'week') {
    const now = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    xData = days.map(d => {
      const date = new Date(d)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
    chartData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? item.amount : 0
    })
  } else if (timeRange.value === 'year') {
    const monthMap = {}
    dailyData.value.forEach(item => {
      const month = item.date.substring(0, 7)
      monthMap[month] = (monthMap[month] || 0) + item.amount
    })
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const year = new Date().getFullYear()
    chartData = xData.map((_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return monthMap[key] || 0
    })
  } else {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`)
    }
    xData = days.map(d => `${parseInt(d.split('-')[2])}日`)
    chartData = days.map(d => {
      const item = dailyData.value.find(item => item.date === d)
      return item ? item.amount : 0
    })
  }

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917', fontSize: 13 },
      formatter: params => `${params[0]?.axisValue}<br/><b>支出: ¥${formatNumber(params[0]?.value || 0)}</b>`
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { fontSize: 11, color: '#78716C' },
      axisLine: { lineStyle: { color: '#E7E5E4' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#78716C',
        formatter: val => {
          if (val >= 10000) return `¥${(val / 1000).toFixed(0)}k`
          if (val >= 1000) return `¥${(val / 1000).toFixed(1)}k`
          return `¥${val}`
        }
      },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: chartData,
      barWidth: '55%',
      itemStyle: { color: '#6366F1', borderRadius: [4, 4, 0, 0] }
    }]
  })
}

const renderPieChart = () => {
  if (!pieChart) return

  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917', fontSize: 13 }
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: { fontSize: 12, color: '#57534E' }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '55%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: categoryData.value.map(item => ({
        ...item,
        itemStyle: { color: getCategoryColor(item.name) }
      }))
    }]
  })
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onUnmounted(() => {
  trendChart?.dispose()
  pieChart?.dispose()
  compareChart?.dispose()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})

const handleResize = () => {
  nextTick(() => {
    trendChart?.resize()
    pieChart?.resize()
    compareChart?.resize()
  })
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; padding: 28px 32px; max-width: 1080px; margin: 0 auto; width: 100%; overflow-x: hidden; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.income .stat-icon { background: var(--color-income-bg); color: var(--color-income); }
.stat-card.expense .stat-icon { background: var(--color-expense-bg); color: var(--color-expense); }
.stat-card.balance .stat-icon { background: var(--color-primary-soft); color: var(--color-primary); }
.stat-card.real-balance .stat-icon { background: rgba(249, 115, 22, 0.12); color: #F97316; }

.stat-info { flex: 1; }
.stat-label { font-size: 13px; color: var(--color-text-muted); margin-bottom: 8px; }
.stat-amount { font-size: 24px; font-weight: 700; color: var(--color-text-primary); }
.stat-amount.positive { color: var(--color-income); }
.stat-amount.negative { color: var(--color-expense); }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }

.btn-group { display: flex; gap: 4px; }

.btn.small {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  background: var(--color-surface-hover);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn.small.active { background: var(--color-primary-soft); color: var(--color-primary); }

.chart-area { height: 280px; padding: 24px; }
.chart-area.pie { height: 320px; padding: 24px; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .charts-grid { grid-template-columns: 1fr; gap: 12px; }
  .page-container { padding: 12px; gap: 12px; }

  .stat-card {
    padding: 12px;
    gap: 10px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-info {
    min-width: 0;
    overflow: hidden;
  }

  .stat-label {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .stat-amount {
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-area {
    height: 240px;
    padding: 12px;
  }

  .chart-area.pie {
    height: 280px;
    padding: 12px;
  }

  .btn-group {
    flex-wrap: wrap;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    padding: 14px 16px;
  }

  .card-title {
    font-size: 14px;
  }
}
</style>