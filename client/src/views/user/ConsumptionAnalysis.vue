<template>
  <div class="page-container">
    <!-- 核心指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon expense">
          <Wallet :size="24" :stroke-width="1.8" />
        </div>
        <div class="metric-info">
          <div class="metric-label">本月总支出</div>
          <div class="metric-amount">¥{{ formatNumber(totalExpense) }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon primary">
          <TrendingUp :size="24" :stroke-width="1.8" />
        </div>
        <div class="metric-info">
          <div class="metric-label">恩格尔系数</div>
          <div class="metric-amount" :class="engCoefficientClass">{{ engCoefficient }}%</div>
          <div class="metric-desc">{{ engCoefficientDesc }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon neutral">
          <ArrowUpDown :size="24" :stroke-width="1.8" />
        </div>
        <div class="metric-info">
          <div class="metric-label">消费笔数</div>
          <div class="metric-amount">{{ transactionCount }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon neutral">
          <ShoppingBag :size="24" :stroke-width="1.8" />
        </div>
        <div class="metric-info">
          <div class="metric-label">平均单笔</div>
          <div class="metric-amount">¥{{ formatNumber(avgExpense) }}</div>
        </div>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <BarChart3 :size="18" :stroke-width="1.5" />
          <span>消费分析</span>
        </div>
        <div class="btn-group">
          <button class="btn small" :class="{ active: timeRange === 'week' }" @click="timeRange = 'week'; fetchData()">本周</button>
          <button class="btn small" :class="{ active: timeRange === 'month' }" @click="timeRange = 'month'; fetchData()">本月</button>
          <button class="btn small" :class="{ active: timeRange === 'quarter' }" @click="timeRange = 'quarter'; fetchData()">本季度</button>
          <button class="btn small" :class="{ active: timeRange === 'year' }" @click="timeRange = 'year'; fetchData()">本年</button>
        </div>
      </div>

      <div class="card-body">
        <!-- 图表网格 -->
        <div class="charts-grid">
          <div class="chart-section">
            <div class="section-title">
              <PieChart :size="16" :stroke-width="1.5" />
              消费分类占比
            </div>
            <div ref="pieChart" class="chart-area"></div>
          </div>

          <div class="chart-section">
            <div class="section-title">
              <TrendingUp :size="16" :stroke-width="1.5" />
              消费趋势
            </div>
            <div ref="trendChart" class="chart-area"></div>
          </div>

          <div class="chart-section">
            <div class="section-title">
              <Target :size="16" :stroke-width="1.5" />
              消费风格画像
            </div>
            <div ref="radarChart" class="chart-area"></div>
            <div class="radar-legend" v-if="radarLegendData.length > 0">
              <div class="radar-legend-item" v-for="item in radarLegendData" :key="item.name">
                <span class="radar-legend-dot" :style="{ background: item.color }"></span>
                <span class="radar-legend-name">{{ item.name }}</span>
                <span class="radar-legend-value">¥{{ formatNumber(item.value) }}</span>
              </div>
            </div>
          </div>

          <div class="chart-section">
            <div class="section-title">
              <BarChart3 :size="16" :stroke-width="1.5" />
              月度消费对比
            </div>
            <div ref="barChart" class="chart-area"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消费建议 -->
    <div class="card suggestions-card" v-if="suggestions.length > 0">
      <div class="card-header">
        <div class="card-title">
          <Lightbulb :size="18" :stroke-width="1.5" />
          <span>消费优化建议</span>
          <div class="tip-wrapper">
            <Info :size="14" class="tip-icon" />
            <div class="tip-popup">
              以下建议基于恩格尔系数、餐饮占比、娱乐占比、储蓄率等多个维度综合计算得出
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="suggestions-list">
          <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item" :class="suggestion.type">
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-desc">{{ suggestion.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 恩格尔系数说明 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <BookOpen :size="18" :stroke-width="1.5" />
          <span>恩格尔系数说明</span>
        </div>
      </div>
      <div class="card-body">
        <div class="eng-levels">
          <div v-for="level in engLevels" :key="level.range" class="eng-level">
            <span class="eng-range">{{ level.range }}%</span>
            <span class="eng-name" :class="level.class">{{ level.name }}</span>
            <span class="eng-desc">{{ level.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  BarChart3, PieChart, Target, TrendingUp, Wallet, ArrowUpDown,
  ShoppingBag, Lightbulb, BookOpen, Info
} from 'lucide-vue-next'
import axios from 'axios'

const timeRange = ref('month')
const records = ref([])
const totalExpense = ref(0)
const totalIncome = ref(0)
const transactionCount = ref(0)
const avgExpense = ref(0)
const monthlyExpenseData = ref({})

const pieChart = ref(null)
const trendChart = ref(null)
const radarChart = ref(null)
const barChart = ref(null)

const engCoefficient = computed(() => {
  if (totalIncome.value === 0) return 0
  return Math.round((totalExpense.value / totalIncome.value) * 100)
})

const engCoefficientClass = computed(() => {
  const coef = engCoefficient.value
  if (coef < 30) return 'excellent'
  if (coef < 40) return 'good'
  if (coef < 50) return 'normal'
  return 'poor'
})

const engCoefficientDesc = computed(() => {
  const coef = engCoefficient.value
  if (coef < 30) return '非常富裕'
  if (coef < 40) return '比较富裕'
  if (coef < 50) return '小康水平'
  if (coef < 60) return '温饱状态'
  return '绝对贫困'
})

const engLevels = [
  { range: '< 30', name: '非常富裕', class: 'excellent', desc: '食品支出占收入低于30%' },
  { range: '30-40', name: '比较富裕', class: 'good', desc: '食品支出占收入30%-40%' },
  { range: '40-50', name: '小康水平', class: 'normal', desc: '食品支出占收入40%-50%' },
  { range: '50-60', name: '温饱状态', class: 'warning', desc: '食品支出占收入50%-60%' },
  { range: '> 60', name: '绝对贫困', class: 'poor', desc: '食品支出占收入超过60%' }
]

const radarLegendData = computed(() => {
  const data = getCategoryData()
  return data.slice(0, 8).map(d => ({ name: d.name, value: d.value, color: getCategoryColor(d.name) }))
})

const suggestions = computed(() => {
  const result = []
  const coef = engCoefficient.value
  const total = totalExpense.value
  const income = totalIncome.value
  const balance = income - total
  const savingsRate = income > 0 ? (balance / income) * 100 : 0
  const categoryData = getCategoryData()

  const cat = (name) => categoryData.find(c => c.name === name)?.value || 0
  const ratio = (val) => total > 0 ? (val / total) * 100 : 0

  // 1. 恩格尔系数
  if (coef > 60) {
    result.push({ type: 'danger', title: '恩格尔系数过高', desc: `食品支出占收入达${coef}%，处于绝对贫困区间，建议优先保障必要支出，减少非必要消费。`, dimension: 'eng' })
  } else if (coef > 50) {
    result.push({ type: 'warning', title: '恩格尔系数偏高', desc: `食品支出占收入的${coef}%，建议适当控制餐饮频率，增加储蓄以提升抗风险能力。`, dimension: 'eng' })
  } else if (coef < 30 && coef > 0) {
    result.push({ type: 'success', title: '恩格尔系数优秀', desc: `食品支出仅占收入${coef}%，消费结构非常健康，继续保持！`, dimension: 'eng' })
  }

  // 2. 储蓄率
  if (income > 0) {
    if (savingsRate < 0) {
      result.push({ type: 'danger', title: '入不敷出', desc: `本月支出超过收入，储蓄率为负数，建议尽快梳理必要与非必要支出，控制在收入范围内。`, dimension: 'savings' })
    } else if (savingsRate < 10) {
      result.push({ type: 'warning', title: '储蓄率偏低', desc: `储蓄率仅${savingsRate.toFixed(1)}%，建议设定每月储蓄目标，逐步提升至收入20%以上。`, dimension: 'savings' })
    } else if (savingsRate >= 30) {
      result.push({ type: 'success', title: '储蓄率良好', desc: `储蓄率达${savingsRate.toFixed(1)}%，财务状况稳健，建议适当增加投资理财。`, dimension: 'savings' })
    }
  }

  // 3. 娱乐消费占比
  const entRatio = ratio(cat('娱乐'))
  if (entRatio > 25) {
    result.push({ type: 'warning', title: '娱乐消费偏高', desc: `娱乐支出占总支出${entRatio.toFixed(1)}%，建议审视订阅会员、游戏等非必要支出。`, dimension: 'entertainment' })
  } else if (entRatio > 0 && entRatio <= 25) {
    result.push({ type: 'info', title: '娱乐消费合理', desc: `娱乐支出占比${entRatio.toFixed(1)}%，处于合理范围内。`, dimension: 'entertainment' })
  }

  // 4. 餐饮消费占比
  const dinRatio = ratio(cat('餐饮'))
  if (dinRatio > 40) {
    result.push({ type: 'warning', title: '餐饮支出过高', desc: `餐饮支出占总支出${dinRatio.toFixed(1)}%，建议多在家做饭，减少外卖和外出就餐。`, dimension: 'dining' })
  } else if (dinRatio > 0) {
    result.push({ type: 'info', title: '餐饮支出正常', desc: `餐饮支出占比${dinRatio.toFixed(1)}%，属于正常范围。`, dimension: 'dining' })
  }

  // 5. 交通消费占比
  const transRatio = ratio(cat('交通'))
  if (transRatio > 20) {
    result.push({ type: 'warning', title: '交通费用较高', desc: `交通支出占总支出${transRatio.toFixed(1)}%，可考虑优化通勤方式或拼车出行。`, dimension: 'transport' })
  }

  // 6. 购物消费占比
  const shopRatio = ratio(cat('购物'))
  if (shopRatio > 30) {
    result.push({ type: 'warning', title: '购物支出较大', desc: `购物支出占总支出${shopRatio.toFixed(1)}%，建议购物前先列清单，避免冲动消费。`, dimension: 'shopping' })
  }

  // 7. 医疗教育保障
  const medRatio = ratio(cat('医疗'))
  const eduRatio = ratio(cat('教育'))
  const insuranceRatio = ratio(cat('保险'))
  if (medRatio === 0 && eduRatio === 0 && insuranceRatio === 0 && total > 0) {
    result.push({ type: 'info', title: '保障类支出为零', desc: '本月无医疗、教育、保险支出，建议预留这部分预算以应对突发情况。', dimension: 'security' })
  }

  // 8. 综合评分
  if (result.length === 0 || (result.length <= 2 && result.every(r => r.type === 'success' || r.type === 'info'))) {
    result.length = 0
    result.push({ type: 'success', title: '消费结构健康', desc: '各维度指标均表现良好，继续保持理性消费习惯！', dimension: 'overall' })
  }

  return result
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getTimeRange = () => {
  const now = new Date()
  let startDate, endDate

  endDate = new Date(now)

  switch (timeRange.value) {
    case 'week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
  }

  return { startDate, endDate }
}

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token')
    const { startDate, endDate } = getTimeRange()

    const res = await axios.get('/api/transactions', {
      params: {
        page: 1,
        pageSize: 10000,
        type: 'expense',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    records.value = res.data.transactions || []
    totalExpense.value = Math.round(records.value.reduce((sum, r) => sum + r.amount, 0) * 100) / 100
    transactionCount.value = records.value.length
    avgExpense.value = records.value.length > 0 ? totalExpense.value / records.value.length : 0

    const incomeRes = await axios.get('/api/transactions', {
      params: {
        page: 1,
        pageSize: 10000,
        type: 'income',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const incomeRecords = incomeRes.data.transactions || []
    totalIncome.value = Math.round(incomeRecords.reduce((sum, r) => sum + r.amount, 0) * 100) / 100

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const allRes = await axios.get('/api/transactions', {
      params: {
        page: 1,
        pageSize: 10000,
        startDate: sixMonthsAgo.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const allRecords = allRes.data.transactions || []
    const expenseRecords = allRecords.filter(r => r.type === 'expense')
    const incomeRecordsAll = allRecords.filter(r => r.type === 'income')

    const monthlyData = {}
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { expense: 0, income: 0 }
    }

    expenseRecords.forEach(r => {
      const key = r.date.substring(0, 7)
      if (monthlyData[key]) monthlyData[key].expense += r.amount
    })

    incomeRecordsAll.forEach(r => {
      const key = r.date.substring(0, 7)
      if (monthlyData[key]) monthlyData[key].income += r.amount
    })

    monthlyExpenseData.value = monthlyData

    await nextTick()
    initCharts()
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const getCategoryData = () => {
  const categoryMap = {}
  records.value.forEach(r => {
    if (r.category === '收入') return
    const cat = r.category || '其他'
    categoryMap[cat] = (categoryMap[cat] || 0) + Math.round(r.amount * 100) / 100
  })

  return Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

const getCategoryColor = (category) => {
  const colors = {
    '餐饮': '#FF6B6B',
    '交通': '#4ECDC4',
    '购物': '#FFE66D',
    '娱乐': '#95E1D3',
    '医疗': '#F38181',
    '教育': '#AA96DA',
    '住房': '#FCBAD3',
    '通讯': '#A8D8EA',
    '生活缴费': '#C9B1FF',
    '保险': '#A8D8EA',
    '充值': '#FFD93D',
    '日用百货': '#FF9F43',
    '运动户外': '#0EA5E9',
    '其他支出': '#C9B1FF',
    '工资': '#10B981',
    '奖金': '#34D399',
    '理财': '#6EE7D0',
    '兼职': '#A7F3D0',
    '其他收入': '#10B981',
    '其他': '#6C5CE7'
  }
  return colors[category] || '#6C5CE7'
}

const initCharts = () => {
  initPieChart()
  initTrendChart()
  initRadarChart()
  initBarChart()
}

const initPieChart = () => {
  if (!pieChart.value) return
  const chart = echarts.init(pieChart.value)
  const data = getCategoryData()

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { orient: 'vertical', left: 'left', top: 'center', textStyle: { fontSize: 12, color: '#78716C' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: getCategoryColor(d.name) } }))
    }]
  })
}

const initTrendChart = () => {
  if (!trendChart.value) return
  const chart = echarts.init(trendChart.value)

  const { startDate, endDate } = getTimeRange()
  const range = timeRange.value
  let sortedDates = []
  let values = []

  if (range === 'quarter') {
    // 季度：按月聚合，显示3个数据点
    const monthMap = {}
    records.value.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + Math.round(r.amount * 100) / 100
    })
    const start = new Date(startDate)
    for (let i = 0; i < 3; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}月`
      sortedDates.push(label)
      values.push(monthMap[key] || 0)
    }
  } else {
    // 周/月/年：按天展示
    const dayMap = {}
    records.value.forEach(r => {
      const date = new Date(r.date).toLocaleDateString('zh-CN')
      dayMap[date] = (dayMap[date] || 0) + Math.round(r.amount * 100) / 100
    })
    const start = new Date(startDate)
    const end = new Date(endDate)
    while (start <= end) {
      sortedDates.push(start.toLocaleDateString('zh-CN'))
      start.setDate(start.getDate() + 1)
    }
    values = sortedDates.map(d => dayMap[d] || 0)
  }

  chart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: ¥{c}', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    xAxis: { type: 'category', data: sortedDates, axisLabel: { rotate: 45, fontSize: 10, color: '#78716C' }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}', color: '#78716C' }, splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } } },
    series: [{
      type: 'line',
      smooth: true,
      data: values,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(239, 68, 68, 0.2)' }, { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }]) },
      itemStyle: { color: '#EF4444' },
      lineStyle: { width: 3 }
    }]
  })
}

const initRadarChart = () => {
  if (!radarChart.value) return
  const chart = echarts.init(radarChart.value)

  const categoryData = getCategoryData()
  const maxValue = Math.max(...categoryData.map(d => d.value), 1)

  const indicators = categoryData.slice(0, 8).map(d => ({ name: d.name, max: Math.ceil(maxValue * 1.2) }))
  const values = categoryData.slice(0, 8).map(d => d.value)

  chart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#92400E', fontSize: 12, fontWeight: 600 },
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 247, 237, 0.9)', 'rgba(255, 231, 201, 0.8)', 'rgba(253, 186, 116, 0.7)', 'rgba(252, 162, 73, 0.6)']
        }
      },
      splitLine: {
        lineStyle: {
          color: '#FDE68A'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#FDE68A'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '消费分布',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(251, 146, 60, 0.55)' },
              { offset: 1, color: 'rgba(245, 101, 101, 0.2)' }
            ]
          }
        },
        lineStyle: { color: '#F97316', width: 2.5 },
        itemStyle: { color: '#F97316' }
      }]
    }]
  })
}

const initBarChart = () => {
  if (!barChart.value) return
  const chart = echarts.init(barChart.value)

  const months = []
  const expenses = []
  const incomes = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    const monthName = `${m.getMonth() + 1}月`
    months.push(monthName)

    const data = monthlyExpenseData.value[key] || { expense: 0, income: 0 }
    expenses.push(Math.round(data.expense * 100) / 100)
    incomes.push(Math.round(data.income * 100) / 100)
  }

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { data: ['支出', '收入'], top: 0, textStyle: { fontSize: 13, color: '#78716C' } },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#78716C' }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}', color: '#78716C' }, splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } } },
    series: [
      { name: '支出', type: 'bar', data: expenses, itemStyle: { color: '#EF4444', borderRadius: [6, 6, 0, 0] } },
      { name: '收入', type: 'bar', data: incomes, itemStyle: { color: '#10B981', borderRadius: [6, 6, 0, 0] } }
    ]
  })
}

onMounted(() => {
  fetchData()
})

watch(timeRange, () => {
  fetchData()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.expense { background: var(--color-expense-bg); color: var(--color-expense); }
.metric-icon.income { background: var(--color-income-bg); color: var(--color-income); }
.metric-icon.primary { background: var(--color-primary-soft); color: var(--color-primary); }
.metric-icon.neutral { background: var(--color-surface-hover); color: var(--color-text-muted); }

.metric-info { flex: 1; }
.metric-label { font-size: 13px; color: var(--color-text-muted); margin-bottom: 8px; }
.metric-amount { font-size: 24px; font-weight: 700; color: var(--color-text-primary); }
.metric-amount.excellent { color: var(--color-income); }
.metric-amount.good { color: '#10B981'; }
.metric-amount.normal { color: var(--color-warning); }
.metric-amount.warning { color: var(--color-warning); }
.metric-amount.poor { color: var(--color-expense); }
.metric-desc { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

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

.card-body { padding: 24px; }

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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-section { display: flex; flex-direction: column; gap: 16px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.chart-area { height: 280px; }

.suggestions-list { display: flex; flex-direction: column; gap: 12px; }

.suggestion-item { padding: 16px; border-radius: var(--radius-lg); }
.suggestion-item.warning { background: rgba(251, 191, 36, 0.1); border-left: 3px solid var(--color-warning); }
.suggestion-item.info { background: rgba(99, 102, 241, 0.1); border-left: 3px solid var(--color-primary); }
.suggestion-item.success { background: var(--color-income-bg); border-left: 3px solid var(--color-income); }
.suggestion-item.danger { background: rgba(239, 68, 68, 0.08); border-left: 3px solid var(--color-expense); }

.suggestion-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.suggestion-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

.eng-levels { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }

.eng-level { text-align: center; padding: 16px; border-radius: var(--radius-lg); background: var(--color-surface-hover); }
.eng-range { display: block; font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; }
.eng-name { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.eng-name.excellent { color: var(--color-income); }
.eng-name.good { color: '#10B981'; }
.eng-name.normal { color: var(--color-warning); }
.eng-name.warning { color: var(--color-expense); }
.eng-name.poor { color: var(--color-expense); }
.eng-desc { display: block; font-size: 11px; color: var(--color-text-muted); }

@media (max-width: 1200px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
  .eng-levels { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .eng-levels { grid-template-columns: repeat(2, 1fr); }
}

/* 雷达图分类颜色图例 */
.radar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  padding: 0 4px;
}
.radar-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.radar-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.radar-legend-name {
  color: var(--color-text-secondary);
  font-weight: 500;
}
.radar-legend-value {
  color: var(--color-text-muted);
  font-size: 11px;
}

/* 建议卡片提示 */
.tip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: default;
}
.tip-icon {
  color: var(--color-text-muted);
  margin-left: 4px;
}
.tip-popup {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.tip-popup::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 12px;
  width: 10px;
  height: 10px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  transform: rotate(45deg);
}
.tip-wrapper:hover .tip-popup {
  display: block;
}
</style>