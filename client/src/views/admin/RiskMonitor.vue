<template>
  <div class="page-container">
    <!-- 顶部数据概览 -->
    <div class="overview-row">
      <div class="overview-card danger" @click="filterLevel = 'high'">
        <div class="overview-icon"><AlertTriangle :size="20" /></div>
        <div class="overview-info">
          <div class="overview-count">{{ riskCounts.high }}</div>
          <div class="overview-label">高风险用户</div>
        </div>
        <button v-if="riskCounts.high > 0 && filterLevel !== 'high'" class="batch-btn" @click.stop="openBatchSend('high')">
          <Bell :size="12" />批量提醒
        </button>
      </div>
      <div class="overview-card warning" @click="filterLevel = 'medium'">
        <div class="overview-icon"><AlertTriangle :size="20" /></div>
        <div class="overview-info">
          <div class="overview-count">{{ riskCounts.medium }}</div>
          <div class="overview-label">中风险用户</div>
        </div>
        <button v-if="riskCounts.medium > 0 && filterLevel !== 'medium'" class="batch-btn" @click.stop="openBatchSend('medium')">
          <Bell :size="12" />批量提醒
        </button>
      </div>
      <div class="overview-card safe" @click="filterLevel = 'low'">
        <div class="overview-icon"><CheckCircle2 :size="20" /></div>
        <div class="overview-info">
          <div class="overview-count">{{ riskCounts.low }}</div>
          <div class="overview-label">低风险用户</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <AlertTriangle :size="18" :stroke-width="1.5" />
          <span>风险用户列表</span>
          <span class="total-hint">共 {{ total }} 人</span>
        </div>
        <div class="filter-tabs">
          <button class="filter-tab" :class="{ active: filterLevel === 'all' }" @click="filterLevel = 'all'">全部</button>
          <button class="filter-tab danger" :class="{ active: filterLevel === 'high' }" @click="filterLevel = 'high'">
            高风险<span v-if="riskCounts.high > 0" class="tab-count">{{ riskCounts.high }}</span>
          </button>
          <button class="filter-tab warning" :class="{ active: filterLevel === 'medium' }" @click="filterLevel = 'medium'">
            中风险<span v-if="riskCounts.medium > 0" class="tab-count">{{ riskCounts.medium }}</span>
          </button>
          <button class="filter-tab" :class="{ active: filterLevel === 'low' }" @click="filterLevel = 'low'">低风险</button>
          <button
            v-if="filterLevel !== 'all' && filterLevel !== 'low' && (filterLevel === 'high' ? riskCounts.high : riskCounts.medium) > 0"
            class="filter-tab batch-action"
            @click="openBatchSend(filterLevel)"
          >
            <Bell :size="13" />批量发送提醒
          </button>
        </div>
      </div>

      <div class="risk-cards">
        <div class="risk-card" :class="user.riskLevel" v-for="user in users" :key="user.id">
          <div class="risk-header">
            <div class="avatar">{{ user.name.charAt(0) }}</div>
            <div class="user-detail">
              <div class="name">{{ user.name }}</div>
              <div class="email">{{ user.email }}</div>
            </div>
            <span class="risk-badge" :class="user.riskLevel">{{ user.riskLabel }}</span>
          </div>

          <div class="risk-stats">
            <div class="stat-item">
              <div class="stat-label">预算</div>
              <div class="stat-value">¥{{ formatNumber(user.budget) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">已用</div>
              <div class="stat-value expense">¥{{ formatNumber(user.spent) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">使用率</div>
              <div class="stat-value" :class="getUsageClass(user.usageRate)">{{ user.usageRate }}%</div>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(user.usageRate, 100) + '%' }" :class="getProgressClass(user.usageRate)"></div>
          </div>

          <div class="risk-actions">
            <button v-if="user.riskLevel === 'high' || user.riskLevel === 'medium'" class="btn-small warning-btn" @click="sendReminder(user)">
              <Bell :size="14" :stroke-width="1.5" />发送提醒
            </button>
            <button class="btn-small" @click="openConsumptionPopup(user)">
              <Eye :size="14" :stroke-width="1.5" />查看消费
            </button>
            <button class="btn-small primary" @click="adjustBudget(user)">
              <Settings :size="14" :stroke-width="1.5" />调整预算
            </button>
          </div>
        </div>

        <div v-if="users.length === 0 && !loading" class="empty-state">
          <div class="empty-icon"><CheckCircle2 :size="48" :stroke-width="1" /></div>
          <p>暂无{{ filterLevel === 'all' ? '' : (filterLevel === 'high' ? '高风险' : filterLevel === 'medium' ? '中风险' : '低风险') }}用户</p>
        </div>
      </div>

      <div v-if="total > pageSize" class="pagination-wrap">
        <span class="page-indicator">第 {{ currentPage }} / {{ Math.ceil(total / pageSize) }} 页</span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- 查看消费弹窗 -->
    <div v-if="consumptionPopup.visible" class="popup-overlay" @click.self="consumptionPopup.visible = false">
      <div class="consumption-popup">
        <div class="popup-header">
          <div class="popup-title">
            <Eye :size="18" :stroke-width="1.5" />
            <span>{{ consumptionPopup.user?.name }} — 消费总览</span>
          </div>
          <button class="popup-close" @click="consumptionPopup.visible = false"><X :size="18" /></button>
        </div>

        <!-- 时间范围选择 -->
        <div class="popup-range-row">
          <div class="range-tabs">
            <button class="range-tab" :class="{ active: consumptionRange === 'month' }" @click="consumptionRange = 'month'; fetchUserConsumption()">月</button>
            <button class="range-tab" :class="{ active: consumptionRange === 'quarter' }" @click="consumptionRange = 'quarter'; fetchUserConsumption()">季</button>
            <button class="range-tab" :class="{ active: consumptionRange === 'year' }" @click="consumptionRange = 'year'; fetchUserConsumption()">年</button>
          </div>
          <div class="year-selector">
            <button class="selector-btn" @click="consumptionYear--"><ChevronLeft :size="14" /></button>
            <span>{{ consumptionYear }}年</span>
            <button class="selector-btn" @click="consumptionYear++" :disabled="consumptionYear >= currentYear"><ChevronRight :size="14" /></button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="consumptionPopup.loading" class="popup-loading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <!-- 数据展示 -->
        <div v-else-if="consumptionPopup.data" class="popup-content">
          <div class="popup-stats">
            <div class="popup-stat income">
              <div class="popup-stat-label">总收入</div>
              <div class="popup-stat-value">¥{{ formatNumber(consumptionPopup.data.income) }}</div>
            </div>
            <div class="popup-stat expense">
              <div class="popup-stat-label">总支出</div>
              <div class="popup-stat-value">¥{{ formatNumber(consumptionPopup.data.expense) }}</div>
            </div>
            <div class="popup-stat balance">
              <div class="popup-stat-label">结余</div>
              <div class="popup-stat-value" :class="consumptionPopup.data.balance >= 0 ? 'income-text' : 'expense-text'">
                ¥{{ formatNumber(Math.abs(consumptionPopup.data.balance)) }}
              </div>
            </div>
          </div>

          <!-- 预算进度 -->
          <div class="budget-section">
            <div class="budget-row">
              <span>月度预算：¥{{ formatNumber(consumptionPopup.data.budget) }}</span>
              <span :class="consumptionPopup.data.usageRate >= 100 ? 'expense-text' : consumptionPopup.data.usageRate >= 80 ? 'warning-text' : 'income-text'">
                使用率 {{ consumptionPopup.data.usageRate }}%
              </span>
            </div>
            <div class="budget-progress">
              <div class="budget-fill" :style="{ width: Math.min(consumptionPopup.data.usageRate, 100) + '%' }"
                :class="getProgressClass(consumptionPopup.data.usageRate)"></div>
            </div>
          </div>

          <!-- 月度趋势图表 -->
          <div v-if="consumptionPopup.data.monthlyData?.length > 0" class="mini-chart-section">
            <div class="mini-chart-title">月度趋势</div>
            <div ref="miniChartRef" class="mini-chart-area"></div>
          </div>

          <div v-else class="popup-empty">
            <span>该时间段内暂无月度数据</span>
          </div>
        </div>

        <div v-else class="popup-empty">
          <span>暂无消费数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AlertTriangle, Bell, Eye, Settings, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import axios from 'axios'
import * as echarts from 'echarts'

const router = useRouter()
const currentYear = new Date().getFullYear()
const filterLevel = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const users = ref([])
const loading = ref(false)
const riskCounts = reactive({ high: 0, medium: 0, low: 0 })

const consumptionPopup = reactive({ visible: false, user: null, data: null, loading: false })
const consumptionRange = ref('month')
const consumptionYear = ref(currentYear)
const miniChartRef = ref(null)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getUsageClass = (rate) => {
  rate = Number(rate)
  if (rate >= 90) return 'danger-text'
  if (rate >= 70) return 'warning-text'
  return ''
}

const getProgressClass = (rate) => {
  rate = Number(rate)
  if (rate >= 90) return 'danger'
  if (rate >= 70) return 'warning'
  return 'safe'
}

// 打开消费弹窗
const openConsumptionPopup = async (user) => {
  consumptionPopup.visible = true
  consumptionPopup.user = user
  consumptionPopup.data = null
  consumptionYear.value = currentYear
  consumptionRange.value = 'month'
  await fetchUserConsumption()
}

const fetchUserConsumption = async () => {
  if (!consumptionPopup.user) return
  consumptionPopup.loading = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/user-consumption', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        userId: consumptionPopup.user.id,
        timeRange: consumptionRange.value,
        year: consumptionYear.value
      }
    })
    consumptionPopup.data = res.data
    await nextTick()
    renderMiniChart()
  } catch (e) {
    ElMessage.error('获取消费数据失败')
  } finally {
    consumptionPopup.loading = false
  }
}

const renderMiniChart = () => {
  if (!miniChartRef.value || !consumptionPopup.data?.monthlyData?.length) return
  const chart = echarts.init(miniChartRef.value)
  const data = consumptionPopup.data.monthlyData
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (p) => `${p[0].name}<br/>收入：<b style="color:#10B981">¥${formatNumber(p[0].value)}</b><br/>支出：<b style="color:#EF4444">¥${formatNumber(p[1]?.value || 0)}</b>`,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E7E5E4',
      textStyle: { color: '#1C1917' }
    },
    legend: { data: ['收入', '支出'], top: 2, textStyle: { fontSize: 10, color: '#78716C' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 32, containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLabel: { color: '#78716C', fontSize: 10 }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: { type: 'value', axisLabel: { formatter: v => '¥' + (v / 1000).toFixed(0) + 'k', color: '#78716C' }, splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } } },
    series: [
      { name: '收入', type: 'bar', data: data.map(d => d.income), itemStyle: { color: '#10B981', borderRadius: [3, 3, 0, 0] }, barWidth: '30%' },
      { name: '支出', type: 'bar', data: data.map(d => d.expense), itemStyle: { color: '#EF4444', borderRadius: [3, 3, 0, 0] }, barWidth: '30%' }
    ]
  })
}

// 批量发送提醒
const openBatchSend = async (level) => {
  const levelLabel = level === 'high' ? '高风险' : '中风险'
  try {
    const { value: message } = await ElMessageBox.prompt(
      `将向所有「${levelLabel}」用户发送风险提醒，请输入提醒内容：`,
      `批量发送提醒（${levelLabel}）`,
      {
        confirmButtonText: '确认发送',
        cancelButtonText: '取消',
        inputPlaceholder: '您的消费已超出预算，请注意控制支出...',
        inputValue: '您的消费状况已触发风险预警，请注意控制支出，保持理性消费。'
      }
    )
    loading.value = true
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-users-all', {
      headers: { Authorization: `Bearer ${token}` },
      params: { level }
    })
    const allUsers = res.data.users || []
    if (allUsers.length === 0) { ElMessage.warning('该级别暂无用户'); return }
    const userIds = allUsers.map(u => u._id || u.id)
    await axios.post('/api/admin/batch-alert', { userIds, message, type: 'risk_warning' }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success(`已向 ${userIds.length} 位${levelLabel}用户发送提醒`)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '发送失败')
  } finally {
    loading.value = false
  }
}

const fetchOverview = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-counts', { headers: { Authorization: `Bearer ${token}` } })
    riskCounts.high = res.data.high || 0
    riskCounts.medium = res.data.medium || 0
    riskCounts.low = res.data.low || 0
  } catch (e) { console.error('获取风险统计失败', e) }
}

const fetchRiskUsers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = { page: currentPage.value, pageSize: pageSize.value }
    if (filterLevel.value !== 'all') params.level = filterLevel.value
    const response = await axios.get('/api/admin/risk-users', {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    users.value = response.data.users.map(u => ({
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      budget: u.budget,
      spent: u.spent,
      usageRate: u.usageRate,
      riskLevel: u.riskLevel,
      riskLabel: u.riskLabel,
      riskScore: u.riskScore
    }))
    total.value = response.data.total
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取风险用户失败')
  } finally {
    loading.value = false
  }
}

watch([filterLevel, currentPage], () => { fetchRiskUsers() })

onMounted(() => { fetchOverview(); fetchRiskUsers() })

const sendReminder = async (user) => {
  try {
    const riskLabel = user.riskLevel === 'high' ? '高风险' : '中风险'
    const { value: message } = await ElMessageBox.prompt(
      `向用户「${user.name}」发送${riskLabel}提醒：`,
      '发送风险提醒',
      {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入提醒内容...',
        inputValue: user.riskLevel === 'high'
          ? '您当前消费已严重超出预算，已被标记为高风险，请立即调整消费行为！'
          : '您的消费已接近预算上限，请注意控制支出。'
      }
    )
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/send-alert', { userId: user.id, message, type: 'risk_warning' }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success(`已向用户 ${user.name} 发送风险提醒`)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '发送提醒失败')
  }
}

const viewTransactions = (user) => { router.push(`/admin/users/${user.id}`) }

const adjustBudget = async (user) => {
  try {
    const { value: budget } = await ElMessageBox.prompt('请输入新的月度预算', '调整预算', {
      confirmButtonText: '确定', cancelButtonText: '取消',
      inputPattern: /^[0-9]+$/, inputErrorMessage: '预算必须是正整数', inputValue: user.budget
    })
    const token = localStorage.getItem('token')
    await axios.put(`/api/admin/users/${user.id}`, { budget: Number(budget) }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success('预算调整成功')
    fetchRiskUsers()
    fetchOverview()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '调整预算失败')
  }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; }

/* 概览卡片 */
.overview-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.overview-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: var(--radius-xl); cursor: pointer; transition: all var(--transition-fast); border: 1px solid transparent; }
.overview-card.danger { background: var(--color-expense-bg); border-color: var(--color-expense); }
.overview-card.warning { background: var(--color-warning-soft); border-color: var(--color-warning); }
.overview-card.safe { background: var(--color-income-bg); border-color: var(--color-income); }
.overview-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.overview-icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.danger .overview-icon { background: var(--color-expense); color: white; }
.warning .overview-icon { background: var(--color-warning); color: white; }
.safe .overview-icon { background: var(--color-income); color: white; }
.overview-info { flex: 1; }
.overview-count { font-size: 28px; font-weight: 700; color: var(--color-text-primary); }
.overview-label { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.batch-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.4); border-radius: var(--radius-full); background: rgba(255,255,255,0.2); color: white; font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); backdrop-filter: blur(4px); }
.batch-btn:hover { background: rgba(255,255,255,0.35); transform: scale(1.03); }

/* Card */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 12px; }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.total-hint { font-size: 13px; color: var(--color-text-muted); font-weight: 400; }
.filter-tabs { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.filter-tab { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.filter-tab:hover { background: var(--color-surface-hover); }
.filter-tab.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
.filter-tab.danger.active { border-color: var(--color-expense); color: var(--color-expense); background: var(--color-expense-bg); }
.filter-tab.warning.active { border-color: var(--color-warning); color: var(--color-warning); background: var(--color-warning-soft); }
.tab-count { padding: 1px 6px; border-radius: var(--radius-full); background: rgba(255,255,255,0.3); font-size: 11px; }
.batch-action { border-color: var(--color-warning); color: var(--color-warning); background: var(--color-warning-soft); }
.batch-action:hover { background: var(--color-warning); color: white; border-color: var(--color-warning); }

/* Risk Cards */
.risk-cards { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.risk-card { border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 20px; transition: all var(--transition-fast); }
.risk-card.high { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
.risk-card.medium { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.04); }
.risk-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 600; flex-shrink: 0; }
.user-detail { flex: 1; }
.name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.email { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.risk-badge { padding: 5px 12px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600; flex-shrink: 0; }
.risk-badge.high { background: var(--color-expense); color: white; }
.risk-badge.medium { background: var(--color-warning); color: white; }
.risk-badge.low { background: var(--color-income); color: white; }
.risk-stats { display: flex; gap: 32px; margin-bottom: 14px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; color: var(--color-text-muted); }
.stat-value { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.danger-text { color: var(--color-expense); }
.warning-text { color: var(--color-warning); }
.expense { color: var(--color-expense); }
.progress-bar { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.progress-fill.safe { background: var(--color-income); }
.progress-fill.warning { background: var(--color-warning); }
.progress-fill.danger { background: var(--color-expense); }
.risk-actions { display: flex; gap: 10px; }
.btn-small { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; cursor: pointer; transition: all var(--transition-fast); }
.btn-small:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }
.btn-small.warning-btn { border-color: var(--color-warning); color: var(--color-warning); background: var(--color-warning-soft); }
.btn-small.warning-btn:hover { background: var(--color-warning); color: white; }
.btn-small.primary:hover { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-primary); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.5; }
.empty-state p { font-size: 14px; color: var(--color-text-muted); margin-top: 12px; }
.pagination-wrap { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 24px; border-top: 1px solid var(--color-border); }
.page-indicator { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }

/* 消费弹窗 */
.popup-overlay { position: fixed; inset: 0; background: rgba(28,25,23,0.6); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; }
.consumption-popup { width: 560px; max-height: 85vh; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); }
.popup-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.popup-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.popup-close { width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--color-surface-hover); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); transition: all var(--transition-fast); }
.popup-close:hover { background: var(--color-surface-active); color: var(--color-text-primary); }

.popup-range-row { padding: 12px 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--color-border); }
.range-tabs { display: flex; gap: 4px; background: var(--color-surface-hover); border-radius: var(--radius-md); padding: 3px; }
.range-tab { padding: 5px 12px; border: none; background: transparent; color: var(--color-text-secondary); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.range-tab.active { background: var(--color-primary); color: white; }
.year-selector { display: flex; align-items: center; gap: 8px; margin-left: auto; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.selector-btn { width: 26px; height: 26px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
.selector-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.selector-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.popup-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px; color: var(--color-text-muted); font-size: 14px; }
.loading-spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.popup-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.popup-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.popup-stat { padding: 14px 16px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px; }
.popup-stat.income { background: var(--color-income-bg); border-color: var(--color-income); }
.popup-stat.expense { background: var(--color-expense-bg); border-color: var(--color-expense); }
.popup-stat.balance { background: var(--color-surface-hover); }
.popup-stat-label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
.popup-stat-value { font-size: 18px; font-weight: 700; }
.income-text { color: var(--color-income); }
.expense-text { color: var(--color-expense); }

.budget-section { padding: 12px 16px; background: var(--color-surface-hover); border-radius: var(--radius-md); }
.budget-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-secondary); margin-bottom: 8px; }
.budget-progress { height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.budget-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.budget-fill.safe { background: var(--color-income); }
.budget-fill.warning { background: var(--color-warning); }
.budget-fill.danger { background: var(--color-expense); }

.mini-chart-section { display: flex; flex-direction: column; gap: 8px; }
.mini-chart-title { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.mini-chart-area { height: 160px; }
.popup-empty { display: flex; align-items: center; justify-content: center; padding: 32px; color: var(--color-text-muted); font-size: 14px; }

@media (max-width: 768px) {
  .overview-row { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: flex-start; }
  .consumption-popup { width: 100%; border-radius: 0; max-height: 100vh; }
  .popup-stats { grid-template-columns: 1fr; }
}
</style>
