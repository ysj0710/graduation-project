<template>
  <div class="page-container">
    <!-- Time Filter -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab" :class="{ active: viewMode === 'day' }" @click="setViewMode('day')">按日</button>
        <button class="filter-tab" :class="{ active: viewMode === 'month' }" @click="setViewMode('month')">按月</button>
        <button class="filter-tab" :class="{ active: viewMode === 'year' }" @click="setViewMode('year')">按年</button>
      </div>
      <div class="filter-selector">
        <button class="selector-btn" @click="prevPeriod"><ChevronLeft :size="16" /></button>
        <span class="selector-text">{{ periodLabel }}</span>
        <button class="selector-btn" @click="nextPeriod" :disabled="isCurrentPeriod"><ChevronRight :size="16" /></button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green">
          <ArrowUpCircle :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-label">总收入</div>
          <div class="stat-value income">¥{{ formatNumber(stats.totalIncome) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <ArrowDownCircle :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-label">总支出</div>
          <div class="stat-value expense">¥{{ formatNumber(stats.totalExpense) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <Wallet :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-label">结余</div>
          <div class="stat-value">¥{{ formatNumber(stats.balance) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <BarChart3 :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-label">交易笔数</div>
          <div class="stat-value">{{ stats.transactionCount }}</div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <TrendingUp :size="18" :stroke-width="1.5" />
          <span>{{ chartTitle }}</span>
        </div>
      </div>
      <div ref="chartRef" class="chart-area"></div>
    </div>

    <!-- Category Breakdown -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <PieChart :size="18" :stroke-width="1.5" />
          <span>分类支出明细</span>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>分类</th>
              <th style="width: 80px">笔数</th>
              <th style="width: 120px">金额</th>
              <th style="width: 150px">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.name">
              <td>
                <div class="category-cell">
                  <CategoryIcon :id="cat.iconId" :size="18" />
                  <span class="cat-name">{{ cat.name }}</span>
                </div>
              </td>
              <td class="num">{{ cat.count }}</td>
              <td class="num expense">¥{{ formatNumber(cat.amount) }}</td>
              <td>
                <div class="percent-cell">
                  <div class="percent-bar">
                    <div class="percent-fill" :style="{ width: cat.percent + '%', background: cat.color }"></div>
                  </div>
                  <span class="percent-text">{{ cat.percent }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import CategoryIcon from '../../components/CategoryIcon.vue'
import { ArrowUpCircle, ArrowDownCircle, Wallet, BarChart3, TrendingUp, PieChart, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const viewMode = ref('month') // 'day' | 'month' | 'year'
const chartRef = ref(null)
const loading = ref(false)
const now = new Date()
const currentYear = now.getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(now.getMonth() + 1) // 1-12

// 当前选中的时间段是否已是最新（不可再前进）
const isCurrentPeriod = computed(() => {
  if (viewMode.value === 'year') return selectedYear.value >= currentYear
  if (viewMode.value === 'month') {
    return selectedYear.value === currentYear && selectedMonth.value >= now.getMonth() + 1
  }
  return selectedYear.value === currentYear && selectedMonth.value === now.getMonth() + 1
})

const periodLabel = computed(() => {
  if (viewMode.value === 'year') return `${selectedYear.value}年`
  if (viewMode.value === 'month') return `${selectedYear.value}年${selectedMonth.value}月`
  // 按日显示
  return `${selectedYear.value}年${selectedMonth.value}月`
})

const chartTitle = computed(() => {
  if (viewMode.value === 'year') return `${selectedYear.value}年消费趋势`
  if (viewMode.value === 'month') return `${selectedYear.value}年${selectedMonth.value}月消费趋势`
  return `${selectedYear.value}年${selectedMonth.value}月每日消费`
})

// 时间范围传给后端的字段（保持兼容）
const timeRangeForApi = computed(() => viewMode.value)

function setViewMode(mode) {
  viewMode.value = mode
  fetchData()
}

function prevPeriod() {
  if (viewMode.value === 'year') {
    selectedYear.value--
  } else {
    selectedMonth.value--
    if (selectedMonth.value < 1) {
      selectedMonth.value = 12
      selectedYear.value--
    }
  }
  fetchData()
}

function nextPeriod() {
  if (isCurrentPeriod.value) return
  if (viewMode.value === 'year') {
    selectedYear.value++
  } else {
    selectedMonth.value++
    if (selectedMonth.value > 12) {
      selectedMonth.value = 1
      selectedYear.value++
    }
  }
  fetchData()
}

const stats = ref({ totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 })
const categories = ref([])
const dailyTrend = ref([])

const formatNumber = (num) => {
  if (!num || num === 0) return '0.00'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const fetchData = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')

    const [statsRes, categoryRes, trendRes] = await Promise.all([
      axios.get('/api/admin/finance-stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeRange: timeRangeForApi.value, year: selectedYear.value, month: selectedMonth.value }
      }),
      axios.get('/api/admin/category-breakdown', {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeRange: timeRangeForApi.value, year: selectedYear.value, month: selectedMonth.value }
      }),
      axios.get('/api/admin/daily-trend', {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeRange: timeRangeForApi.value, year: selectedYear.value, month: selectedMonth.value }
      })
    ])

    stats.value = statsRes.data.stats || {}
    categories.value = categoryRes.data.categories || []
    dailyTrend.value = trendRes.data.data || []

    await nextTick()
    renderChart()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value) return
  if (dailyTrend.value.length === 0) {
    // 空状态不渲染图表
    return
  }

  const chart = echarts.init(chartRef.value)
  let xData = []
  let chartData = []

  if (viewMode.value === 'year') {
    // 按月聚合
    const monthMap = {}
    dailyTrend.value.forEach(item => {
      const month = item.date.substring(0, 7)
      monthMap[month] = (monthMap[month] || 0) + Math.abs(item.expense)
    })
    xData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    chartData = xData.map((_, i) => {
      const key = `${selectedYear.value}-${String(i + 1).padStart(2, '0')}`
      return monthMap[key] || 0
    })
  } else if (viewMode.value === 'month') {
    // 按日展示当月每天
    const dayMap = {}
    dailyTrend.value.forEach(item => {
      dayMap[item.date] = (dayMap[item.date] || 0) + Math.abs(item.expense)
    })
    const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      xData.push(`${d}日`)
      chartData.push(dayMap[dateStr] || 0)
    }
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: '#57534E', fontSize: 11 },
      axisLine: { lineStyle: { color: '#E7E5E4' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#57534E' },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: chartData,
      itemStyle: { color: '#6366F1', borderRadius: [6, 6, 0, 0] },
      barWidth: '60%'
    }]
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

/* Filter */
.filter-bar { display: flex; align-items: center; gap: 16px; }
.filter-tabs { display: flex; gap: 8px; }

.filter-selector { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.selector-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.selector-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.selector-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.selector-text { font-size: 14px; font-weight: 600; color: var(--color-text-primary); min-width: 100px; text-align: center; }
.filter-tab {
  padding: 10px 18px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.filter-tab:hover { background: var(--color-surface-hover); }
.filter-tab.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon.green { background: var(--color-income-soft); color: var(--color-income); }
.stat-icon.red { background: var(--color-expense-soft); color: var(--color-expense); }
.stat-icon.blue { background: var(--color-primary-soft); color: var(--color-primary); }
.stat-icon.orange { background: var(--color-warning-soft); color: var(--color-warning); }

.stat-body { flex: 1; }
.stat-label { font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 700; color: var(--color-text-primary); }
.income { color: var(--color-income); }
.expense { color: var(--color-expense); }

/* Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.chart-area { height: 300px; padding: 0 24px 24px; }

/* Table */
.table-wrap { padding: 0 24px 24px; }
.table { width: 100%; border-collapse: collapse; }
.table th { text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); background: var(--color-surface-hover); }
.table td { padding: 14px 8px; border-bottom: 1px solid var(--color-border); }
.table tbody tr:last-child td { border-bottom: none; }
.num { font-weight: 600; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }

.category-cell { display: flex; align-items: center; gap: 10px; }
.cat-name { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }

.percent-cell { display: flex; align-items: center; gap: 10px; }
.percent-bar { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.percent-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.percent-text { font-size: 12px; color: var(--color-text-muted); font-weight: 500; min-width: 36px; }
</style>