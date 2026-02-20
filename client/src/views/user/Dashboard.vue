<template>
  <div class="user-app-container">
    <!-- 顶部导航 -->
    <div class="web-header">
      <div class="header-left">
        <span class="logo">💰 随手记账</span>
      </div>
      <div class="header-center">
        <span class="time">{{ currentTime }}</span>
      </div>
      <div class="header-right">
        <el-button class="icon-btn" :icon="Brush" circle @click="showThemePicker = true" />
        <el-button class="icon-btn" :icon="Setting" circle @click="$router.push('/profile')" />
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="header-card" :style="{ background: userStore.theme.background }">
      <div class="user-row">
        <el-avatar :size="48" :src="userStore.profile.avatar">
          {{ userStore.profile.nickname?.charAt(0) || 'U' }}
        </el-avatar>
        <span class="username">欢迎，{{ userStore.profile.nickname || userStore.profile.username }}</span>
      </div>
      <div class="balance-display">
        <span class="label">本月结余</span>
        <span class="amount" :class="{ 'negative': userStore.statistics.balance < 0 }">
          ¥{{ formatNumber(userStore.statistics.balance) }}
        </span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card income">
        <el-icon :size="24"><TrendCharts /></el-icon>
        <div class="label">本月收入</div>
        <div class="amount">¥{{ formatNumber(userStore.statistics.monthlyIncome) }}</div>
      </div>
      <div class="stat-card expense">
        <el-icon :size="24"><Money /></el-icon>
        <div class="label">本月支出</div>
        <div class="amount">¥{{ formatNumber(userStore.statistics.monthlyExpense) }}</div>
      </div>
      <div class="stat-card budget">
        <el-icon :size="24"><PieChart /></el-icon>
        <div class="label">预算剩余</div>
        <div class="percent">{{ userStore.budgetPercent }}%</div>
        <div class="remain">¥{{ formatNumber(userStore.budgetRemain) }}</div>
      </div>
    </div>

    <!-- 快速记账 -->
    <div class="quick-add-section">
      <div class="section-header">
        <h3>⚡ 快速记账</h3>
        <span class="hint">点击类别直接记</span>
      </div>
      <div class="category-grid">
        <div 
          v-for="cat in quickCategories" 
          :key="cat.id"
          class="category-btn"
          :style="{ background: cat.color + '20', color: cat.color }"
          @click="quickAdd(cat)"
        >
          <span class="icon">{{ cat.icon }}</span>
          <span class="name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section" v-if="trendChartData">
      <div class="chart-card">
        <div class="card-header">
          <h3>📈 消费趋势</h3>
          <el-select v-model="timeRange" size="small" @change="fetchTrendData">
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本年" value="year" />
          </el-select>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="records-section">
      <div class="section-header">
        <h3>📝 今日明细</h3>
        <el-button type="primary" size="small" @click="$router.push('/add')">记一笔 +</el-button>
      </div>
      <div class="records-list" v-if="userStore.recentRecords.length > 0">
        <div 
          v-for="record in userStore.recentRecords" 
          :key="record.id"
          class="record-item"
        >
          <div 
            class="record-icon" 
            :style="{ background: record.categoryColor + '20', color: record.categoryColor }"
          >
            {{ record.categoryIcon }}
          </div>
          <div class="record-info">
            <div class="title">{{ record.title }}</div>
            <div class="time">{{ record.time }}</div>
          </div>
          <div class="amount" :class="{ 'expense': record.type === 'expense' }">
            {{ record.type === 'expense' ? '-' : '+' }}¥{{ record.amount }}
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无记录" :image-size="80" />
    </div>

    <!-- 主题选择器 -->
    <el-drawer v-model="showThemePicker" title="选择主题" size="300px">
      <div class="theme-picker">
        <h4>选择主题背景</h4>
        <div class="preset-colors">
          <div 
            v-for="theme in presetThemes" 
            :key="theme.id"
            class="color-circle"
            :style="{ background: theme.background }"
            :class="{ 'active': userStore.theme.background === theme.background }"
            @click="selectTheme(theme)"
          >
            <el-icon v-if="userStore.theme.background === theme.background" color="#fff"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useUserStore } from '../../stores/user'
import { Brush, Setting, TrendCharts, Money, PieChart, Check } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const userStore = useUserStore()
const currentTime = ref('')
const timeRange = ref('month')
const showThemePicker = ref(false)
const trendChartRef = ref(null)
const trendChartData = ref(null)

const presetThemes = [
  { id: 'green', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', primaryColor: '#10B981' },
  { id: 'blue', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', primaryColor: '#3B82F6' },
  { id: 'purple', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', primaryColor: '#8B5CF6' },
  { id: 'pink', background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', primaryColor: '#EC4899' },
  { id: 'orange', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', primaryColor: '#F59E0B' },
  { id: 'red', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', primaryColor: '#EF4444' }
]

const quickCategories = computed(() => {
  return [
    ...userStore.categories.expense.slice(0, 4),
    { id: 'salary', name: '工资', icon: '💰', color: '#10B981', type: 'income' },
    { id: 'food', name: '餐饮', icon: '🍜', color: '#EF4444', type: 'expense' },
    { id: 'shopping', name: '购物', icon: '🛍️', color: '#EF4444', type: 'expense' },
    { id: 'transport', name: '交通', icon: '🚗', color: '#EF4444', type: 'expense' }
  ]
})

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const selectTheme = (theme) => {
  userStore.updateTheme({
    background: theme.background,
    primaryColor: theme.primaryColor
  })
  showThemePicker.value = false
}

const quickAdd = (cat) => {
  userStore.$router.push(`/add?type=${cat.type}&category=${cat.name}`)
}

const fetchTrendData = async () => {
  // Mock data for trend chart
  trendChartData.value = {
    dates: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
    income: [1000, 500, 2000, 800, 1500, 1200, 3000],
    expense: [800, 600, 1200, 900, 1100, 800, 1500]
  }
  await nextTick()
  renderTrendChart()
}

const renderTrendChart = () => {
  if (!trendChartRef.value || !trendChartData.value) return
  
  const chart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trendChartData.value.dates },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'line', data: trendChartData.value.income, smooth: true, itemStyle: { color: '#10B981' } },
      { name: '支出', type: 'line', data: trendChartData.value.expense, smooth: true, itemStyle: { color: '#EF4444' } }
    ]
  }
  chart.setOption(option)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000)
  userStore.fetchProfile()
  userStore.fetchDashboard()
  fetchTrendData()
})
</script>

<style scoped>
.user-app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #F3F4F6;
  position: relative;
}

.web-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: transparent;
  position: relative;
  z-index: 10;
}

.logo {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.time {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.header-card {
  border-radius: 0 0 24px 24px;
  padding: 32px 20px 32px;
  color: white;
  position: relative;
  overflow: hidden;
  margin: 0 -16px;
}

.header-card::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 150px;
  height: 150px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.balance-display .label {
  font-size: 13px;
  opacity: 0.9;
}

.balance-display .amount {
  font-size: 32px;
  font-weight: 700;
  display: block;
  margin-top: 4px;
}

.balance-display .amount.negative {
  color: #FEE2E2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px;
  margin-top: -16px;
  position: relative;
  z-index: 5;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}

.stat-card .el-icon {
  color: #6B7280;
  margin-bottom: 6px;
}

.stat-card.income .el-icon { color: #10B981; }
.stat-card.expense .el-icon { color: #EF4444; }
.stat-card.budget .el-icon { color: #3B82F6; }

.stat-card .label {
  font-size: 12px;
  color: #6B7280;
  margin: 4px 0;
}

.stat-card .amount, .stat-card .percent {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.stat-card.income .amount { color: #10B981; }
.stat-card.expense .amount { color: #EF4444; }

.stat-card .remain {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 2px;
}

.quick-add-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.hint {
  font-size: 12px;
  color: #9CA3AF;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.category-btn {
  border: none;
  border-radius: 14px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.category-btn:active {
  transform: scale(0.95);
}

.category-btn .icon {
  font-size: 24px;
}

.category-btn .name {
  font-size: 11px;
  font-weight: 500;
}

.chart-section {
  padding: 0 16px;
}

.chart-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.chart-container {
  height: 180px;
}

.records-section {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin: 0 16px 16px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  transition: background 0.2s;
}

.record-item:hover {
  background: #F9FAFB;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 12px;
}

.record-info {
  flex: 1;
}

.record-info .title {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
}

.record-info .time {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
}

.amount {
  font-weight: 600;
  font-size: 15px;
}

.amount.expense {
  color: #EF4444;
}

.amount:not(.expense) {
  color: #10B981;
}

.theme-picker h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.color-circle {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.color-circle.active {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
</style>
