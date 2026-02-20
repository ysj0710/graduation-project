<template>
  <div class="user-app-container">
    <!-- 顶部导航 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" circle @click="$router.back()" />
      <span class="title">统计</span>
      <div style="width: 60px;"></div>
    </div>

    <!-- 时间筛选 -->
    <div class="time-filter">
      <el-radio-group v-model="timeRange" size="small" @change="fetchData">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="year">本年</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card income">
        <div class="label">总收入</div>
        <div class="amount">¥{{ formatNumber(statistics.income?.total || 0) }}</div>
        <div class="count">{{ statistics.income?.count || 0 }} 笔</div>
      </div>
      <div class="overview-card expense">
        <div class="label">总支出</div>
        <div class="amount">¥{{ formatNumber(statistics.expense?.total || 0) }}</div>
        <div class="count">{{ statistics.expense?.count || 0 }} 笔</div>
      </div>
      <div class="overview-card balance">
        <div class="label">结余</div>
        <div class="amount" :class="{ negative: statistics.balance < 0 }">
          ¥{{ formatNumber(statistics.balance || 0) }}
        </div>
      </div>
    </div>

    <!-- 趋势图 - 每日消费柱状图 -->
    <div class="chart-card">
      <div class="card-header">
        <h3>📊 每日消费</h3>
      </div>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>

    <!-- 分类统计 -->
    <div class="chart-card">
      <div class="card-header">
        <h3>🥧 支出结构</h3>
      </div>
      <div ref="pieChartRef" class="chart-container"></div>
    </div>

    <!-- 分类明细 -->
    <div class="category-detail" v-if="categoryList.length > 0">
      <div class="card-header">
        <h3>📋 分类明细</h3>
      </div>
      <div class="category-list">
        <div 
          v-for="(item, index) in categoryList" 
          :key="index"
          class="category-row"
        >
          <div class="category-info">
            <span class="icon">{{ item.icon }}</span>
            <span class="name">{{ item.category }}</span>
          </div>
          <div class="category-stats">
            <div class="progress-bar">
              <div 
                class="progress" 
                :style="{ width: item.percent + '%', background: item.color }"
              ></div>
            </div>
            <span class="amount">¥{{ formatNumber(item.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useUserStore } from '../../stores/user'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

const userStore = useUserStore()

const timeRange = ref('month')
const statistics = ref({ income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, balance: 0 })
const categoryList = ref([])
const trendChartRef = ref(null)
// 存储每日数据
const dailyData = ref([])

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 获取日期范围内的所有日期
const getDateRange = (start, end) => {
  const dates = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// 获取趋势数据
const fetchTrendData = async () => {
  try {
    const token = localStorage.getItem('token')
    const now = new Date()
    let startDate, endDate
    
    if (timeRange.value === 'week') {
      // 本周：从周一到周日
      const day = now.getDay() || 7
      startDate = new Date(now)
      startDate.setDate(now.getDate() - day + 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else if (timeRange.value === 'month') {
      // 本月
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else {
      // 本年
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
    }
    
    // 获取该时间段的所有记录
    const response = await axios.get('http://localhost:3000/api/transactions', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const transactions = response.data.transactions || []
    
    // 获取所有日期
    const allDates = getDateRange(startDate, endDate)
    
    // 初始化每日数据
    const dateMap = {}
    allDates.forEach(date => {
      const key = `${date.getMonth() + 1}-${date.getDate()}`
      dateMap[key] = { date: key, income: 0, expense: 0 }
    })
    
    // 填充数据
    transactions.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getMonth() + 1}-${date.getDate()}`
      if (dateMap[key]) {
        if (t.type === 'income') {
          dateMap[key].income += t.amount
        } else {
          dateMap[key].expense += t.amount
        }
      }
    })
    
    dailyData.value = Object.values(dateMap)
  } catch (error) {
    console.error('Failed to fetch trend data:', error)
    dailyData.value = []
  }
}

const fetchData = async () => {
  try {
    const res = await userStore.fetchStatistics(timeRange.value)
    statistics.value = {
      income: { total: res.income?.total || 0, count: res.income?.count || 0 },
      expense: { total: res.expense?.total || 0, count: res.expense?.count || 0 },
      balance: res.balance || 0
    }
    
    // 处理分类数据
    const expenseCats = res.byCategory?.expense || []
    const totalExpense = expenseCats.reduce((sum, cat) => sum + cat.total, 0)
    categoryList.value = expenseCats.map((cat) => ({
      category: cat.category,
      total: cat.total,
      count: cat.count,
      percent: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
      icon: getCategoryIcon(cat.category),
      color: '#EF4444'
    }))
    
    await fetchTrendData()
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  }
}

const getCategoryIcon = (category) => {
  const icons = {
    '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
    '住房': '🏠', '医疗': '💊', '教育': '📚', '其他': '📦',
    '工资': '💰', '奖金': '🎁', '理财': '📈', '兼职': '💼', '其他收入': '💵'
  }
  return icons[category] || '💰'
}

const renderCharts = () => {
  // 趋势图 - 每日消费柱状图
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    
    const dates = dailyData.value.map(d => d.date)
    const incomeData = dailyData.value.map(d => d.income)
    const expenseData = dailyData.value.map(d => d.expense)
    
    chart.setOption({
      tooltip: { 
        trigger: 'axis',
        formatter: (params) => {
          let result = `${params[0].name}<br/>`
          params.forEach(p => {
            result += `${p.seriesName}: ¥${p.value}<br/>`
          })
          return result
        }
      },
      legend: { data: ['收入', '支出'], top: 0, textStyle: { fontSize: 12 } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLabel: { fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [
        { 
          name: '收入', 
          type: 'bar', 
          data: incomeData, 
          itemStyle: { color: '#10B981' },
          barGap: 0
        },
        { 
          name: '支出', 
          type: 'bar', 
          data: expenseData, 
          itemStyle: { color: '#EF4444' }
        }
      ]
    })
  }
  
  // 饼图
  if (pieChartRef.value) {
    const pieData = categoryList.value.map(cat => ({
      name: cat.category,
      value: cat.total,
      itemStyle: { color: getCategoryColor(cat.category) }
    }))
    
    if (pieData.length === 0) {
      pieData.push({ name: '暂无数据', value: 1, itemStyle: { color: '#E5E7EB' } })
    }
    
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: pieData
      }]
    })
  }
}

const getCategoryColor = (category) => {
  const colors = {
    '餐饮': '#EF4444', '交通': '#F59E0B', '购物': '#8B5CF6',
    '娱乐': '#EC4899', '住房': '#3B82F6', '医疗': '#10B981',
    '教育': '#6366F1', '其他': '#6B7280'
  }
  return colors[category] || '#6B7280'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #F3F4F6;
  padding-bottom: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.time-filter {
  padding: 12px 16px;
  background: white;
}

.time-filter :deep(.el-radio-button__inner) {
  font-size: 13px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 16px;
  margin-top: 8px;
}

.overview-card {
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
}

.overview-card .label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 6px;
}

.overview-card .amount {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.overview-card.income .amount { color: #10B981; }
.overview-card.expense .amount { color: #EF4444; }

.overview-card .count {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
}

.chart-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin: 16px;
}

.card-header {
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.chart-container {
  height: 200px;
}

.category-detail {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin: 0 16px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-info .icon {
  font-size: 20px;
}

.category-info .name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.category-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 20px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.category-stats .amount {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  min-width: 80px;
  text-align: right;
}
</style>
