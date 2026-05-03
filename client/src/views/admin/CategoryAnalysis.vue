<template>
  <div class="page-container">
    <!-- 顶部控制栏 -->
    <div class="controls-row">
      <!-- 时间范围 -->
      <div class="range-tabs">
        <button
          v-for="r in rangeOptions"
          :key="r.value"
          class="range-tab"
          :class="{ active: timeRange === r.value }"
          @click="timeRange = r.value; fetchData()"
        >
          {{ r.label }}
        </button>
      </div>

      <!-- 年份选择器 -->
      <div class="year-selector">
        <button class="selector-btn" @click="selectedYear--">
          <ChevronLeft :size="16" />
        </button>
        <span class="year-label">{{ selectedYear }}年</span>
        <button class="selector-btn" @click="selectedYear++" :disabled="selectedYear >= currentYear">
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- 收支类型切换 -->
      <div class="type-tabs">
        <button class="type-tab" :class="{ active: activeType === 'expense' }" @click="activeType = 'expense'">
          支出分类
        </button>
        <button class="type-tab" :class="{ active: activeType === 'income' }" @click="activeType = 'income'">
          收入分类
        </button>
      </div>
    </div>

    <!-- 无数据 -->
    <div v-if="!loading && !hasData" class="empty-chart-card">
      <div class="empty-icon"><PieChart :size="48" :stroke-width="1" /></div>
      <div class="empty-title">暂无{{ activeType === 'expense' ? '支出' : '收入' }}数据</div>
      <div class="empty-subtitle">该时间段内暂无分类记录</div>
    </div>

    <!-- 有数据 -->
    <template v-if="hasData">
      <!-- 汇总指标 -->
      <div class="stats-row">
        <div class="stat-mini">
          <div class="stat-mini-label">{{ activeType === 'expense' ? '总支出' : '总收入' }}</div>
          <div class="stat-mini-value" :class="activeType">
            ¥{{ formatNumber(activeType === 'expense' ? totalExpense : totalIncome) }}
          </div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-label">活跃分类数</div>
          <div class="stat-mini-value">{{ currentPieData.length }}个</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-label">TOP1占比</div>
          <div class="stat-mini-value primary">{{ currentPieData[0]?.percent || 0 }}%</div>
        </div>
      </div>

      <!-- 图表区域：环形图 + 排名列表 -->
      <div class="charts-grid">
        <!-- 分类占比环形图 -->
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">
              <PieChart :size="16" :stroke-width="1.5" />
              <span>分类占比</span>
            </div>
          </div>
          <div ref="pieChartRef" class="chart-area"></div>
        </div>

        <!-- 分类排名柱状图 -->
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">
              <BarChart3 :size="16" :stroke-width="1.5" />
              <span>分类金额排行</span>
            </div>
          </div>
          <div ref="barChartRef" class="chart-area"></div>
        </div>

        <!-- 分类明细表格 -->
        <div class="card chart-card wide">
          <div class="card-header">
            <div class="card-title">
              <List :size="16" :stroke-width="1.5" />
              <span>分类明细</span>
            </div>
          </div>
          <el-table :data="currentPieData" stripe size="small">
            <el-table-column label="排名" width="70">
              <template #default="{ $index }">
                <span class="rank-badge" :class="getRankClass($index)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分类" min-width="140">
              <template #default="{ row }">
                <span class="name-cell">
                  <span class="cat-dot" :style="{ background: row.color }"></span>
                  {{ row.name }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }">
                <span class="amount-cell" :class="activeType">
                  ¥{{ formatNumber(row.value) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="占比" width="160">
              <template #default="{ row }">
                <div class="percent-cell">
                  <div class="percent-bar-wrap">
                    <div class="percent-bar" :style="{ width: row.percent + '%', background: row.color }"></div>
                  </div>
                  <span class="percent-text">{{ row.percent }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="趋势" width="80">
              <template #default="{ row }">
                <span v-if="row.trend > 0" class="trend up">{{ row.trend }}%</span>
                <span v-else-if="row.trend < 0" class="trend down">{{ Math.abs(row.trend) }}%</span>
                <span v-else class="trend flat">—</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { PieChart, BarChart3, List, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const selectedYear = ref(currentYear)
const timeRange = ref('year')
const activeType = ref('expense')
const loading = ref(false)
const hasData = ref(false)

const expensePieData = ref([])
const incomePieData = ref([])
const barData = ref([])
const totalExpense = ref(0)
const totalIncome = ref(0)

let pieChartInstance = null
let barChartInstance = null

const rangeOptions = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季' },
  { value: 'year', label: '本年' }
]

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const currentPieData = computed(() => activeType.value === 'expense' ? expensePieData.value : incomePieData.value)

const getRankClass = (idx) => {
  if (idx === 0) return 'gold'
  if (idx === 1) return 'silver'
  if (idx === 2) return 'bronze'
  return ''
}

const pieChartRef = ref(null)
const barChartRef = ref(null)

// 图表resize处理
const handleResize = () => {
  pieChartInstance?.resize()
  barChartInstance?.resize()
}

const fetchData = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = { timeRange: timeRange.value, year: selectedYear.value }
    const res = await axios.get('/api/admin/category-analysis', {
      headers: { Authorization: `Bearer ${token}` },
      params
    })

    expensePieData.value = res.data.expensePieData || []
    incomePieData.value = res.data.incomePieData || []
    barData.value = res.data.barData || []
    totalExpense.value = res.data.totalExpense || 0
    totalIncome.value = res.data.totalIncome || 0
    hasData.value = res.data.hasData || false

    await nextTick()
    if (hasData.value) {
      renderPieChart()
      renderBarChart()
    }
  } catch (error) {
    console.error('获取分类分析数据失败', error)
    ElMessage.error('获取数据失败，请检查网络或重新登录')
    hasData.value = false
  } finally {
    loading.value = false
  }
}

const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  pieChartInstance = echarts.init(pieChartRef.value)
  const data = currentPieData.value.slice(0, 8)
  pieChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>¥${formatNumber(p.value)} (${p.percent}%)`,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917' }
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'center',
      textStyle: { fontSize: 11, color: '#57534E' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['38%', '50%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: data.map(item => ({ name: item.name, value: item.value, itemStyle: { color: item.color } }))
    }]
  })
}

const renderBarChart = () => {
  if (!barChartRef.value) return
  if (barChartInstance) {
    barChartInstance.dispose()
  }
  barChartInstance = echarts.init(barChartRef.value)
  const data = currentPieData.value.slice(0, 8)
  barChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (p) => `${p[0].name}<br/>¥${formatNumber(p[0].value)} (${data[p[0].dataIndex]?.percent}%)`,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: { color: '#78716C', fontSize: 10, rotate: 15 },
      axisLine: { lineStyle: { color: '#E7E5E4' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: v => '¥' + (v / 1000).toFixed(0) + 'k', color: '#78716C' },
      splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: data.map(item => ({ value: item.value, itemStyle: { color: item.color, borderRadius: [4, 4, 0, 0] } })),
      barWidth: '55%'
    }]
  })
}

watch([activeType], () => {
  nextTick(() => {
    if (hasData.value) {
      renderPieChart()
      renderBarChart()
    }
  })
})

watch([selectedYear, timeRange], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onUnmounted(() => {
  pieChartInstance?.dispose()
  barChartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

.controls-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.range-tabs { display: flex; gap: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px; }
.range-tab { padding: 6px 14px; border: none; background: transparent; color: var(--color-text-secondary); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.range-tab.active { background: var(--color-primary); color: white; }
.range-tab:hover:not(.active) { background: var(--color-surface-hover); }

.year-selector { display: flex; align-items: center; gap: 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 6px 12px; }
.selector-btn { width: 28px; height: 28px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
.selector-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.selector-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.year-label { font-size: 14px; font-weight: 700; color: var(--color-text-primary); min-width: 60px; text-align: center; }

.type-tabs { display: flex; gap: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px; margin-left: auto; }
.type-tab { padding: 6px 14px; border: none; background: transparent; color: var(--color-text-secondary); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.type-tab.active { background: var(--color-expense); color: white; }
.type-tab:last-child.active { background: var(--color-income); }
.type-tab:hover:not(.active) { background: var(--color-surface-hover); }

/* 空数据 */
.empty-chart-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 64px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
.empty-subtitle { font-size: 14px; color: var(--color-text-muted); }

/* 统计行 */
.stats-row { display: flex; gap: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.stat-mini { flex: 1; padding: 14px 20px; border-right: 1px solid var(--color-border); }
.stat-mini:last-child { border-right: none; }
.stat-mini-label { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 500; }
.stat-mini-value { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-mini-value.expense { color: #EF4444; }
.stat-mini-value.income { color: #10B981; }
.stat-mini-value.primary { color: var(--color-primary); }

/* 图表网格 */
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.chart-card { display: flex; flex-direction: column; }
.chart-card.wide { grid-column: span 2; }
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 10px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.chart-area { height: 280px; }

/* 分类表格 */
.category-table { padding: 0; }
.table-header { display: grid; grid-template-columns: 60px 1fr 120px 160px 80px; gap: 12px; padding: 12px 24px; background: var(--color-surface-hover); font-size: 12px; font-weight: 600; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
.table-row { display: grid; grid-template-columns: 60px 1fr 120px 160px 80px; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border); align-items: center; transition: background var(--transition-fast); }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: var(--color-surface-hover); }

.rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; background: var(--color-border); color: var(--color-text-muted); }
.rank-badge.gold { background: #F59E0B; color: white; }
.rank-badge.silver { background: #9CA3AF; color: white; }
.rank-badge.bronze { background: #CD7F32; color: white; }

.name-cell { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.amount-cell { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.amount-cell.expense { color: #EF4444; }
.amount-cell.income { color: #10B981; }

.percent-cell { display: flex; align-items: center; gap: 8px; }
.percent-bar-wrap { flex: 1; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.percent-bar { height: 100%; border-radius: 3px; transition: width 0.5s; }
.percent-text { font-size: 12px; color: var(--color-text-muted); min-width: 36px; text-align: right; }

.trend-cell { font-size: 13px; font-weight: 600; }
.trend.up { color: #EF4444; }
.trend.down { color: #10B981; }
.trend.flat { color: var(--color-text-muted); }

@media (max-width: 1024px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.wide { grid-column: span 1; }
  .controls-row { flex-wrap: wrap; }
  .type-tabs { margin-left: 0; }
  .table-header, .table-row { grid-template-columns: 50px 1fr 100px 120px 70px; font-size: 11px; }
}

/* ============================================
   Mobile Responsive Styles
   ============================================ */
@media (max-width: 768px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .range-tabs {
    justify-content: center;
  }

  .type-tabs {
    margin-left: 0;
    justify-content: center;
  }

  .year-selector {
    justify-content: center;
  }

  .stats-row {
    flex-direction: column;
    gap: 0;
  }

  .stat-mini {
    padding: 12px 16px;
  }

  .stat-mini-value {
    font-size: 16px;
  }

  .chart-area {
    height: 240px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px 1fr 80px 100px 60px;
    gap: 8px;
    padding: 10px 16px;
    font-size: 11px;
  }

  .rank-badge {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }

  .name-cell {
    font-size: 12px;
  }

  .amount-cell {
    font-size: 12px;
  }

  .percent-bar-wrap {
    min-width: 40px;
  }

  .percent-text {
    font-size: 10px;
    min-width: 28px;
  }

  .trend-cell {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .chart-area {
    height: 200px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 36px 1fr 70px 80px 50px;
    gap: 6px;
    padding: 8px 12px;
  }

  .cat-dot {
    width: 8px;
    height: 8px;
  }

  .trend-cell {
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
}
</style>
