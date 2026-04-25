<template>
  <div class="page-container">
    <!-- 顶部：时间范围选择器 + 年份选择器 + 核心指标 -->
    <div class="header-row">
      <!-- 时间范围标签 -->
      <div class="range-tabs">
        <button
          v-for="r in rangeOptions"
          :key="r.value"
          class="range-tab"
          :class="{ active: timeRange === r.value }"
          @click="setRange(r.value)"
        >
          {{ r.label }}
        </button>
      </div>

      <!-- 年份选择器（季度/月/年时显示） -->
      <div v-if="timeRange !== 'week'" class="year-selector">
        <button class="selector-btn" @click="selectedYear--">
          <ChevronLeft :size="16" />
        </button>
        <span class="year-label">{{ selectedYear }}年</span>
        <button class="selector-btn" @click="selectedYear++" :disabled="selectedYear >= currentYear">
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- 季度选择器（季度范围时显示） -->
      <div v-if="timeRange === 'quarter'" class="quarter-selector">
        <button class="selector-btn" @click="prevQuarter">
          <ChevronLeft :size="16" />
        </button>
        <span class="year-label">{{ currentQuarterLabel }}</span>
        <button class="selector-btn" @click="nextQuarter" :disabled="isCurrentQuarter">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!loading && !hasData" class="empty-chart-card">
      <div class="empty-icon"><BarChart3 :size="48" :stroke-width="1" /></div>
      <div class="empty-title">{{ fetchError ? '获取数据失败' : '暂无数据' }}</div>
      <div class="empty-subtitle">
        {{ fetchError ? '请检查网络或重新登录' : (timeRange === 'week' ? '本周' : timeRange === 'quarter' ? currentQuarterLabel : timeRange === 'month' ? `${selectedYear}年${currentMonth}月` : `${selectedYear}年`) + '暂无交易记录' }}
      </div>
      <button v-if="fetchError" class="btn small active" style="margin-top:8px" @click="fetchData()">重试</button>
    </div>

    <!-- 核心指标 -->
    <div v-if="hasData" class="stats-row">
      <div class="stat-mini">
        <div class="stat-mini-label">总收入</div>
        <div class="stat-mini-value income">¥{{ formatNumber(totalIncome) }}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">总支出</div>
        <div class="stat-mini-value expense">¥{{ formatNumber(totalExpense) }}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">结余</div>
        <div class="stat-mini-value" :class="totalBalance >= 0 ? 'income' : 'expense'">
          ¥{{ formatNumber(Math.abs(totalBalance)) }}
        </div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-label">{{ avgLabel }}</div>
        <div class="stat-mini-value">¥{{ formatNumber(avgExpense) }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div v-if="hasData" class="charts-grid">
      <!-- 收支对比柱状图 -->
      <div class="card chart-card wide">
        <div class="card-header">
          <div class="card-title">
            <BarChart3 :size="16" :stroke-width="1.5" />
            <span>{{ chartTitle('收支对比') }}</span>
          </div>
        </div>
        <div ref="barChartRef" class="chart-area"></div>
      </div>

      <!-- 结余趋势折线图 -->
      <div class="card chart-card wide">
        <div class="card-header">
          <div class="card-title">
            <TrendingUp :size="16" :stroke-width="1.5" />
            <span>{{ chartTitle('结余走势') }}</span>
          </div>
        </div>
        <div ref="lineChartRef" class="chart-area"></div>
      </div>

      <!-- 支出环比增长率 -->
      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title">
            <Activity :size="16" :stroke-width="1.5" />
            <span>{{ chartTitle('支出环比变化') }}</span>
          </div>
        </div>
        <div ref="growthChartRef" class="chart-area"></div>
      </div>

      <!-- 收支占比环形图 -->
      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title">
            <PieChart :size="16" :stroke-width="1.5" />
            <span>收支结构</span>
          </div>
        </div>
        <div ref="ratioChartRef" class="chart-area"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { BarChart3, TrendingUp, PieChart, Activity, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const selectedYear = ref(currentYear)
const timeRange = ref('year')

const rangeOptions = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季' },
  { value: 'year', label: '本年' }
]

const barChartRef = ref(null)
const lineChartRef = ref(null)
const growthChartRef = ref(null)
const ratioChartRef = ref(null)

const trendData = ref([])
const loading = ref(false)
const hasData = ref(false)
const fetchError = ref(false)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// 当前季度标签
const currentQuarter = computed(() => Math.floor((currentMonth - 1) / 3) + 1)
const currentQuarterLabel = computed(() => `${selectedYear.value}年Q${currentQuarter.value}`)
const isCurrentQuarter = computed(() => selectedYear.value === currentYear && currentQuarter.value === Math.floor((currentMonth - 1) / 3) + 1)

const setRange = (range) => {
  timeRange.value = range
  fetchData()
}

const prevQuarter = () => {
  if (currentQuarter.value === 1) {
    selectedYear.value--
  }
}
const nextQuarter = () => {
  if (isCurrentQuarter.value) return
  if (currentQuarter.value === 4) selectedYear.value++
}

// 核心指标
const totalIncome = computed(() => trendData.value.reduce((s, d) => s + d.income, 0))
const totalExpense = computed(() => trendData.value.reduce((s, d) => s + d.expense, 0))
const totalBalance = computed(() => totalIncome.value - totalExpense.value)
const avgLabel = computed(() => {
  if (timeRange.value === 'week') return '日均支出'
  if (timeRange.value === 'quarter') return '月均支出'
  if (timeRange.value === 'year') return '月均支出'
  return '日均支出'
})
const avgExpense = computed(() => {
  const count = trendData.value.filter(d => d.expense > 0).length
  if (count === 0) return 0
  return totalExpense.value / count
})

const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#A855F7', '#14B8A6', '#0EA5E9'
]

const chartTitle = (base) => {
  if (timeRange.value === 'week') return base
  if (timeRange.value === 'quarter') return `${selectedYear.value}年Q${currentQuarter.value} ${base}`
  if (timeRange.value === 'year') return `${selectedYear.value}年 ${base}`
  return `${selectedYear.value}年${currentMonth}月 ${base}`
}

// 生成 x 轴标签
const xLabels = computed(() => {
  if (timeRange.value === 'week') {
    const labels = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    }
    return labels
  }
  if (timeRange.value === 'quarter') {
    const q = Math.floor((currentMonth - 1) / 3) + 1
    return [`${selectedYear.value}年Q${q} 1月`, `${selectedYear.value}年Q${q} 2月`, `${selectedYear.value}年Q${q} 3月`]
  }
  if (timeRange.value === 'year') {
    return trendData.value.map(d => d.month.replace(`${selectedYear.value}年`, ''))
  }
  return trendData.value.map(d => d.month.replace(`${selectedYear.value}年`, ''))
})

const fetchData = async () => {
  loading.value = true
  fetchError.value = false
  try {
    const token = localStorage.getItem('token')
    const params = { months: 12 }

    if (timeRange.value === 'week') {
      // 周：生成7天数据
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }
      const res = await axios.get('/api/admin/daily-trend', {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: days[0], endDate: days[days.length - 1] }
      })
      const map = {}
      ;(res.data.data || []).forEach(d => { map[d.date] = d })
      trendData.value = days.map(date => ({
        month: date,
        income: map[date]?.income || 0,
        expense: map[date]?.expense || 0,
        balance: (map[date]?.income || 0) - (map[date]?.expense || 0),
        expenseGrowth: null,
        incomeGrowth: null
      }))
    } else if (timeRange.value === 'quarter') {
      const q = Math.floor((currentMonth - 1) / 3) + 1
      const qStart = (q - 1) * 3 + 1  // Q1=1, Q2=4, Q3=7, Q4=10
      const qEnd = qStart + 2          // Q1=3, Q2=6, Q3=9, Q4=12
      const res = await axios.get('/api/admin/trend-data', {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear.value }
      })
      // 过滤出本季度3个月
      trendData.value = res.data
        .filter(d => d.monthIndex + 1 >= qStart && d.monthIndex + 1 <= qEnd)
        .slice(0, 3)
    } else if (timeRange.value === 'year') {
      const res = await axios.get('/api/admin/trend-data', {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear.value }
      })
      trendData.value = res.data
    } else {
      // month
      const res = await axios.get('/api/admin/trend-data', {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear.value }
      })
      trendData.value = res.data.filter(d => d.monthIndex + 1 === currentMonth)
    }

    hasData.value = trendData.value.some(d => d.income > 0 || d.expense > 0)
    // Also show stats if there's expense data even without income
    const hasExpense = trendData.value.some(d => d.expense > 0)
    if (hasExpense) hasData.value = true
    await nextTick()
    if (hasData.value) renderCharts()
  } catch (error) {
    fetchError.value = true
    console.error('获取数据失败', error)
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderBarChart()
  renderLineChart()
  renderGrowthChart()
  renderRatioChart()
}

const renderBarChart = () => {
  if (!barChartRef.value) return
  const chart = echarts.init(barChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { data: ['收入', '支出'], top: 4, textStyle: { fontSize: 12, color: '#78716C' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: { type: 'category', data: xLabels.value, axisLabel: { color: '#78716C', fontSize: 11, rotate: timeRange.value === 'year' ? 0 : 0 }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: { type: 'value', axisLabel: { formatter: v => { if (v >= 10000) return '¥' + (v / 1000).toFixed(0) + 'k'; if (v >= 1000) return '¥' + (v / 1000).toFixed(1) + 'k'; return '¥' + v }, color: '#78716C' }, splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } } },
    series: [
      { name: '收入', type: 'bar', data: trendData.value.map(d => d.income), itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' },
      { name: '支出', type: 'bar', data: trendData.value.map(d => d.expense), itemStyle: { color: '#EF4444', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' }
    ]
  })
}

const renderLineChart = () => {
  if (!lineChartRef.value) return
  const chart = echarts.init(lineChartRef.value)
  const balances = trendData.value.map(d => d.balance)
  const maxBal = Math.max(...balances.map(Math.abs), 1)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const v = params[0].value
        return `${params[0].name}<br/>结余：<b style="color:${v >= 0 ? '#10B981' : '#EF4444'}">¥${Number(v).toFixed(2)}</b>`
      },
      backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 16, containLabel: true },
    xAxis: { type: 'category', data: xLabels.value, axisLabel: { color: '#78716C', fontSize: 11 }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: {
      type: 'value',
      max: maxBal * 1.2,
      min: -maxBal * 0.3,
      axisLabel: { formatter: v => '¥' + (Math.abs(v) / 1000).toFixed(0) + 'k', color: '#78716C' },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [{
      type: 'line',
      data: balances,
      smooth: true,
      lineStyle: { width: 2.5 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16,185,129,0.15)' },
          { offset: 1, color: 'rgba(16,185,129,0.01)' }
        ])
      },
      itemStyle: { color: '#10B981' },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#E7E5E4', type: 'dashed' }, data: [{ yAxis: 0 }] }
    }]
  })
}

const renderGrowthChart = () => {
  if (!growthChartRef.value) return
  const chart = echarts.init(growthChartRef.value)
  // 从第2个开始（跳过第1个无上月数据）
  const dataWithGrowth = trendData.value.slice(1)
  const xLabels = xLabels.value.slice(1)
  const growths = dataWithGrowth.map(d => d.expenseGrowth ?? 0)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const v = params[0].value
        return `${params[0].name}<br/>环比：<b style="color:${v >= 0 ? '#EF4444' : '#10B981'}">${v > 0 ? '+' : ''}${v}%</b>`
      },
      backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 16, containLabel: true },
    xAxis: { type: 'category', data: xLabels, axisLabel: { color: '#78716C', fontSize: 11 }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: v => (v > 0 ? '+' : '') + v + '%', color: '#78716C' },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: growths.map(v => ({ value: v, itemStyle: { color: v >= 0 ? '#EF4444' : '#10B981', borderRadius: [4, 4, 0, 0] } })),
      barWidth: '50%'
    }]
  })
}

const renderRatioChart = () => {
  if (!ratioChartRef.value) return
  const chart = echarts.init(ratioChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { fontSize: 11, color: '#78716C' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: [
        { name: '支出', value: totalExpense.value, itemStyle: { color: '#EF4444' } },
        { name: '收入', value: totalIncome.value, itemStyle: { color: '#10B981' } }
      ]
    }]
  })
}

watch([selectedYear, timeRange], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

/* 顶部行 */
.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.range-tabs { display: flex; gap: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px; }
.range-tab {
  padding: 7px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.range-tab.active { background: var(--color-primary); color: white; }
.range-tab:hover:not(.active) { background: var(--color-surface-hover); color: var(--color-text-primary); }

.year-selector, .quarter-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 6px 12px;
}

.selector-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.selector-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.selector-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.year-label { font-size: 14px; font-weight: 700; color: var(--color-text-primary); min-width: 60px; text-align: center; }

/* 空数据 */
.empty-chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
.empty-subtitle { font-size: 14px; color: var(--color-text-muted); }

/* 统计行 */
.stats-row {
  display: flex;
  gap: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.stat-mini { flex: 1; padding: 14px 20px; border-right: 1px solid var(--color-border); }
.stat-mini:last-child { border-right: none; }
.stat-mini-label { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 500; }
.stat-mini-value { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-mini-value.income { color: #10B981; }
.stat-mini-value.expense { color: #EF4444; }

/* 图表网格 */
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.chart-card { display: flex; flex-direction: column; }
.chart-card.wide { grid-column: span 2; }
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 10px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.chart-area { height: 260px; }

@media (max-width: 1024px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.wide { grid-column: span 1; }
  .stats-row { flex-wrap: wrap; }
  .stat-mini { min-width: 50%; }
}
</style>
