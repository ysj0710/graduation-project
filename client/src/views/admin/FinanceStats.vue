<template>
  <div class="finance-stats-page">
    <!-- 时间筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="timeRange" size="small">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="year">本年</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总收入</div>
        <div class="stat-value income">¥{{ formatNumber(stats.totalIncome) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总支出</div>
        <div class="stat-value expense">¥{{ formatNumber(stats.totalExpense) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">结余</div>
        <div class="stat-value">¥{{ formatNumber(stats.balance) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">交易笔数</div>
        <div class="stat-value">{{ stats.transactionCount }}</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="ios-card">
      <h3>📊 每日消费柱状图</h3>
      <div ref="chartRef" class="chart-container"></div>
    </div>

    <!-- 分类明细 -->
    <div class="ios-card">
      <h3>📁 分类支出明细</h3>
      <div class="category-table">
        <div class="table-header">
          <span>分类</span>
          <span>笔数</span>
          <span>金额</span>
          <span>占比</span>
        </div>
        <div class="table-row" v-for="cat in categories" :key="cat.name">
          <div class="category-cell">
            <span class="cat-icon">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </div>
          <span>{{ cat.count }}</span>
          <span class="expense">¥{{ formatNumber(cat.amount) }}</span>
          <div class="percent-bar">
            <div class="percent-fill" :style="{ width: cat.percent + '%', background: cat.color }"></div>
            <span>{{ cat.percent }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const timeRange = ref('month')
const chartRef = ref(null)

const stats = ref({
  totalIncome: 28000,
  totalExpense: 15600,
  balance: 12400,
  transactionCount: 234
})

const categories = ref([
  { name: '餐饮', icon: '🍜', count: 45, amount: 3200, percent: 21, color: '#FF3B30' },
  { name: '购物', icon: '🛍️', count: 28, amount: 4100, percent: 26, color: '#007AFF' },
  { name: '交通', icon: '🚗', count: 32, amount: 1800, percent: 12, color: '#FF9500' },
  { name: '娱乐', icon: '🎮', count: 15, amount: 2200, percent: 14, color: '#AF52DE' },
  { name: '住房', icon: '🏠', count: 5, amount: 3500, percent: 22, color: '#34C759' }
])

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const renderChart = () => {
  if (!chartRef.value) return
  
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
      axisLabel: { fontSize: 11 }
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1500)),
      itemStyle: { 
        color: (params) => params.dataIndex >= 25 ? '#FF9500' : '#007AFF',
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '60%'
    }]
  })
}

onMounted(() => {
  nextTick(() => renderChart())
})
</script>

<style scoped>
.finance-stats-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
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
  font-size: 24px;
  font-weight: 700;
  color: #000;
}

.stat-value.income { color: #34C759; }
.stat-value.expense { color: #FF3B30; }

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.chart-container {
  height: 300px;
}

.category-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  padding: 12px 16px;
  background: #F5F5F7;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  padding: 14px 16px;
  border-bottom: 1px solid #F2F2F7;
  align-items: center;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-icon {
  font-size: 20px;
}

.expense {
  color: #FF3B30;
  font-weight: 600;
}

.percent-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.percent-fill {
  height: 8px;
  border-radius: 4px;
  flex: 1;
}

.percent-bar span {
  font-size: 12px;
  color: #8E8E93;
  width: 40px;
}
</style>
