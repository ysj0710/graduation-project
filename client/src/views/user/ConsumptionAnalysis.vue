<template>
  <div class="analysis-page">
    <div class="page-header">
      <h2>📊 消费分析</h2>
    </div>

    <!-- 筛选时间 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="small" @change="fetchData">
        <el-radio-button value="week">本周</el-radio-button>
        <el-radio-button value="month">本月</el-radio-button>
        <el-radio-button value="quarter">本季度</el-radio-button>
        <el-radio-button value="year">本年</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-cards">
      <div class="metric-card">
        <div class="metric-icon" style="background: #FF6B6B15; color: #FF6B6B">💰</div>
        <div class="metric-content">
          <div class="metric-label">本月总支出</div>
          <div class="metric-value">¥{{ formatNumber(totalExpense) }}</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: #4ECDC415; color: #4ECDC4">📈</div>
        <div class="metric-content">
          <div class="metric-label">恩格尔系数</div>
          <div class="metric-value" :class="engCoefficientClass">{{ engCoefficient }}%</div>
          <div class="metric-desc">{{ engCoefficientDesc }}</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: #45B7D115; color: #45B7D1">🏃</div>
        <div class="metric-content">
          <div class="metric-label">消费笔数</div>
          <div class="metric-value">{{ transactionCount }}</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: #96CEB415; color: #96CEB4">📉</div>
        <div class="metric-content">
          <div class="metric-label">平均单笔</div>
          <div class="metric-value">¥{{ formatNumber(avgExpense) }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 消费分类饼图 -->
      <div class="chart-card">
        <h3>🍩 消费分类占比</h3>
        <div ref="pieChart" class="chart-container"></div>
      </div>

      <!-- 消费趋势折线图 -->
      <div class="chart-card">
        <h3>📈 消费趋势</h3>
        <div ref="trendChart" class="chart-container"></div>
      </div>

      <!-- 消费风格雷达图 -->
      <div class="chart-card">
        <h3>🎯 消费风格画像</h3>
        <div ref="radarChart" class="chart-container"></div>
      </div>

      <!-- 月度对比柱状图 -->
      <div class="chart-card">
        <h3>📊 月度消费对比</h3>
        <div ref="barChart" class="chart-container"></div>
      </div>
    </div>

    <!-- 消费建议 -->
    <div class="suggestions-card" v-if="suggestions.length > 0">
      <h3>💡 消费优化建议</h3>
      <div class="suggestions-list">
        <div 
          v-for="(suggestion, index) in suggestions" 
          :key="index"
          class="suggestion-item"
          :class="suggestion.type"
        >
          <span class="suggestion-icon">{{ suggestion.icon }}</span>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 恩格尔系数说明 -->
    <div class="info-card">
      <h3>📚 恩格尔系数说明</h3>
      <div class="eng-description">
        <div class="eng-level" v-for="level in engLevels" :key="level.range">
          <span class="eng-range">{{ level.range }}%</span>
          <span class="eng-name" :class="level.class">{{ level.name }}</span>
          <span class="eng-desc">{{ level.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const timeRange = ref('month')
const records = ref([])
const totalExpense = ref(0)
const totalIncome = ref(0)
const transactionCount = ref(0)
const avgExpense = ref(0)
const monthlyExpenseData = ref({})

// 图表引用
const pieChart = ref(null)
const trendChart = ref(null)
const radarChart = ref(null)
const barChart = ref(null)

// 恩格尔系数相关
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

// 恩格尔系数等级说明
const engLevels = [
  { range: '< 30', name: '非常富裕', class: 'excellent', desc: '食品支出占收入低于30%' },
  { range: '30-40', name: '比较富裕', class: 'good', desc: '食品支出占收入30%-40%' },
  { range: '40-50', name: '小康水平', class: 'normal', desc: '食品支出占收入40%-50%' },
  { range: '50-60', name: '温饱状态', class: 'warning', desc: '食品支出占收入50%-60%' },
  { range: '> 60', name: '绝对贫困', class: 'poor', desc: '食品支出占收入超过60%' }
]

// 建议列表
const suggestions = computed(() => {
  const result = []
  const coef = engCoefficient.value
  const categoryData = getCategoryData()
  const entertainment = categoryData.find(c => c.name === '娱乐')?.value || 0
  const dining = categoryData.find(c => c.name === '餐饮')?.value || 0
  
  // 恩格尔系数建议
  if (coef > 50) {
    result.push({
      type: 'warning',
      icon: '⚠️',
      title: '恩格尔系数偏高',
      desc: `您的食品支出占总支出的${coef}%，建议适当增加储蓄和其他投资。`
    })
  } else if (coef > 40) {
    result.push({
      type: 'info',
      icon: '💡',
      title: '注意消费结构',
      desc: '建议适当控制餐饮支出，增加储蓄比例。'
    })
  }
  
  // 娱乐消费建议
  if (totalExpense.value > 0 && entertainment / totalExpense.value > 0.2) {
    result.push({
      type: 'warning',
      icon: '🎮',
      title: '娱乐消费偏高',
      desc: '您的娱乐消费占比超过20%，建议适当控制游戏、会员等支出。'
    })
  }
  
  // 餐饮消费建议
  if (totalExpense.value > 0 && dining / totalExpense.value > 0.3) {
    result.push({
      type: 'info',
      icon: '🍜',
      title: '餐饮支出较高',
      desc: '建议尽量在家做饭，减少外卖和外出就餐频率。'
    })
  }
  
  // 理性消费建议
  if (result.length === 0) {
    result.push({
      type: 'success',
      icon: '✅',
      title: '消费结构健康',
      desc: '您的消费结构合理，保持良好的理财习惯！'
    })
  }
  
  return result
})

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

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
    
    // 获取支出数据
    const res = await axios.get('http://localhost:3000/api/transactions', {
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
    
    // 获取收入数据（用于恩格尔系数）
    const incomeRes = await axios.get('http://localhost:3000/api/transactions', {
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
    
    // 获取最近6个月的所有数据（用于月度对比）
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const allRes = await axios.get('http://localhost:3000/api/transactions', {
      params: {
        page: 1,
        pageSize: 10000,
        startDate: sixMonthsAgo.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // 合并所有记录用于月度对比
    const allRecords = allRes.data.transactions || []
    const expenseRecords = allRecords.filter(r => r.type === 'expense')
    const incomeRecordsAll = allRecords.filter(r => r.type === 'income')
    
    // 计算每月支出和收入
    const monthlyData = {}
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { expense: 0, income: 0 }
    }
    
    expenseRecords.forEach(r => {
      const key = r.date.substring(0, 7)
      if (monthlyData[key]) {
        monthlyData[key].expense += r.amount
      }
    })
    
    incomeRecordsAll.forEach(r => {
      const key = r.date.substring(0, 7)
      if (monthlyData[key]) {
        monthlyData[key].income += r.amount
      }
    })
    
    // 存储月度数据
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
    // 过滤掉错误的分类（收入不应该出现在支出分类中）
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
    '购物': '#45B7D1',
    '娱乐': '#96CEB4',
    '住房': '#FFEAA7',
    '医疗': '#DDA0DD',
    '教育': '#98D8C8',
    '充值': '#F7DC6F',
    '生活缴费': '#BB8FCE',
    '保险': '#85C1E9',
    '日用百货': '#F8B500',
    '运动户外': '#00CED1',
    '其他': '#A0A0A0'
  }
  return colors[category] || '#A0A0A0'
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
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
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
      data: data.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: getCategoryColor(d.name) }
      }))
    }]
  })
}

const initTrendChart = () => {
  if (!trendChart.value) return
  const chart = echarts.init(trendChart.value)
  
  // 按天聚合数据
  const dayMap = {}
  records.value.forEach(r => {
    const date = new Date(r.date).toLocaleDateString('zh-CN')
    dayMap[date] = (dayMap[date] || 0) + Math.round(r.amount * 100) / 100
  })
  
  const sortedDates = Object.keys(dayMap).sort((a, b) => new Date(a) - new Date(b))
  const values = sortedDates.map(d => dayMap[d])
  
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      type: 'line',
      smooth: true,
      data: values,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
          { offset: 1, color: 'rgba(255, 107, 107, 0.05)' }
        ])
      },
      itemStyle: {
        color: '#FF6B6B'
      },
      lineStyle: {
        width: 3
      }
    }]
  })
}

const initRadarChart = () => {
  if (!radarChart.value) return
  const chart = echarts.init(radarChart.value)
  
  const categoryData = getCategoryData()
  const maxValue = Math.max(...categoryData.map(d => d.value), 1)
  
  const indicators = categoryData.slice(0, 8).map(d => ({
    name: d.name,
    max: Math.ceil(maxValue * 1.2)
  }))
  
  const values = categoryData.slice(0, 8).map(d => d.value)
  
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#666'
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 107, 107, 0.02)', 'rgba(255, 107, 107, 0.04)', 
                  'rgba(255, 107, 107, 0.06)', 'rgba(255, 107, 107, 0.08)']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '消费分布',
        areaStyle: {
          color: 'rgba(255, 107, 107, 0.3)'
        },
        lineStyle: {
          color: '#FF6B6B'
        },
        itemStyle: {
          color: '#FF6B6B'
        }
      }]
    }]
  })
}

const initBarChart = () => {
  if (!barChart.value) return
  const chart = echarts.init(barChart.value)
  
  // 获取最近6个月的真实数据
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
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['支出', '收入'],
      top: 0
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        data: expenses,
        itemStyle: { color: '#FF6B6B' }
      },
      {
        name: '收入',
        type: 'bar',
        data: incomes,
        itemStyle: { color: '#4ECDC4' }
      }
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
.analysis-page {
  padding: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0 0 20px 0;
}

.filter-bar {
  margin-bottom: 20px;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #000;
}

.metric-value.excellent { color: #34C759; }
.metric-value.good { color: #4ECDC4; }
.metric-value.normal { color: #FF9500; }
.metric-value.poor { color: #FF3B30; }

.metric-desc {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.chart-container {
  height: 300px;
}

.suggestions-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.suggestions-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #F5F5F7;
}

.suggestion-item.warning {
  background: #FFF3CD;
  border-left: 4px solid #FF9500;
}

.suggestion-item.info {
  background: #D1ECF1;
  border-left: 4px solid #17A2B8;
}

.suggestion-item.success {
  background: #D4EDDA;
  border-left: 4px solid #28A745;
}

.suggestion-icon {
  font-size: 24px;
}

.suggestion-title {
  font-weight: 600;
  color: #000;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.eng-description {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.eng-level {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background: #F5F5F7;
}

.eng-range {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 4px;
}

.eng-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.eng-name.excellent { color: #34C759; }
.eng-name.good { color: #4ECDC4; }
.eng-name.normal { color: #FF9500; }
.eng-name.warning { color: #FF6B6B; }
.eng-name.poor { color: #FF3B30; }

.eng-desc {
  display: block;
  font-size: 11px;
  color: #8E8E93;
}

@media (max-width: 1200px) {
  .metrics-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .eng-description {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-cards {
    grid-template-columns: 1fr;
  }
  
  .eng-description {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
