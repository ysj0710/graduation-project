<template>
  <div class="admin-dashboard">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <Users :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">用户总数</div>
          <div v-if="stats.newUsersToday > 0" class="stat-trend positive">
            <ArrowUp :size="14" :stroke-width="2" />
            <span>+{{ stats.newUsersToday }} 今日新增</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <CreditCard :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.monthlyTransactions }}</div>
          <div class="stat-label">本月交易</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon red">
          <AlertTriangle :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.highRiskUsers }}</div>
          <div class="stat-label">高风险用户</div>
          <div v-if="stats.mediumRiskUsers > 0" class="stat-trend warning">
            <span>{{ stats.mediumRiskUsers }} 中风险</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <BarChart3 :size="22" :stroke-width="1.5" />
        </div>
        <div class="stat-body">
          <div class="stat-value">¥{{ formatNumber(stats.monthlyTotal) }}</div>
          <div class="stat-label">本月流水</div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-row">
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <TrendingUp :size="18" :stroke-width="1.5" />
            <span>消费趋势（近6个月）</span>
          </div>
        </div>
        <div ref="trendChartRef" class="chart-area"></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <PieChart :size="18" :stroke-width="1.5" />
            <span>用户风险分布</span>
          </div>
        </div>
        <div ref="riskChartRef" class="chart-area"></div>
      </div>
    </div>

    <!-- Risk Users Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <AlertTriangle :size="18" :stroke-width="1.5" />
          <span>风险用户预警</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary" :disabled="selectedUsers.length === 0" @click="batchSendReminder">
            批量提醒 ({{ selectedUsers.length }})
          </button>
          <button class="btn btn-primary" @click="$router.push('/admin/risk')">
            查看全部
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px"><input type="checkbox" @change="toggleAllSelection" :checked="isAllSelected" /></th>
              <th>用户</th>
              <th style="width: 120px">预算</th>
              <th style="width: 120px">已用</th>
              <th style="width: 140px">使用率</th>
              <th style="width: 100px">风险等级</th>
              <th style="width: 100px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in riskUsers" :key="user.id">
              <td><input type="checkbox" :checked="selectedIds.includes(user.id)" @change="toggleSelection(user)" /></td>
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ user.name.charAt(0) }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="num">¥{{ formatNumber(user.budget) }}</td>
              <td class="num expense">¥{{ formatNumber(user.spent) }}</td>
              <td>
                <div class="progress-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: user.usageRate + '%' }" :class="getProgressClass(user.usageRate)"></div>
                  </div>
                  <span class="progress-text">{{ user.usageRate }}%</span>
                </div>
              </td>
              <td><span class="risk-badge" :class="user.riskLevel">{{ user.riskLabel }}</span></td>
              <td>
                <button class="btn-small" @click="sendReminder(user)">提醒</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="riskUsers.length === 0" class="empty-state">
          <div class="empty-icon"><CheckCircle2 :size="48" :stroke-width="1" /></div>
          <p>暂无风险用户</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Users, CreditCard, AlertTriangle, BarChart3, PieChart, TrendingUp, ArrowUp, CheckCircle2 } from 'lucide-vue-next'
import axios from 'axios'

const stats = ref({
  totalUsers: 0, newUsersToday: 0, activeUsers: 0,
  monthlyTransactions: 0, monthlyTotal: 0,
  highRiskUsers: 0, mediumRiskUsers: 0, lowRiskUsers: 0
})
const riskUsers = ref([])
const selectedIds = ref([])
const selectedUsers = computed(() => riskUsers.value.filter(u => selectedIds.value.includes(u.id)))
const isAllSelected = computed(() => riskUsers.value.length > 0 && selectedIds.value.length === riskUsers.value.length)

const trendChartRef = ref(null)
const riskChartRef = ref(null)

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const getProgressClass = (rate) => {
  const r = parseFloat(rate)
  if (r >= 90) return 'danger'
  if (r >= 70) return 'warning'
  return 'safe'
}

const toggleSelection = (user) => {
  const idx = selectedIds.value.indexOf(user.id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(user.id)
}

const toggleAllSelection = () => {
  if (isAllSelected.value) selectedIds.value = []
  else selectedIds.value = riskUsers.value.map(u => u.id)
}

// Fetch data
const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/dashboard-stats', { headers: { Authorization: `Bearer ${token}` } })
    stats.value = res.data
  } catch (e) { console.error('获取统计数据失败:', e) }
}

const fetchRiskUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-users', { params: { page: 1, pageSize: 5 }, headers: { Authorization: `Bearer ${token}` } })
    riskUsers.value = res.data.users || []
  } catch (e) { console.error('获取风险用户失败:', e) }
}

const fetchTrendData = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/trend-data', { headers: { Authorization: `Bearer ${token}` } })
    renderTrendChart(res.data)
  } catch (e) { console.error('获取趋势数据失败:', e) }
}

const fetchRiskDistribution = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/risk-distribution', { headers: { Authorization: `Bearer ${token}` } })
    renderRiskChart(res.data.distribution)
  } catch (e) { console.error('获取风险分布失败:', e) }
}

// Charts
let trendChartInstance = null
let riskChartInstance = null

const handleResize = () => {
  trendChartInstance?.resize()
  riskChartInstance?.resize()
}

const renderTrendChart = (data) => {
  if (!trendChartRef.value) return
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  trendChartInstance = echarts.init(trendChartRef.value)
  const months = data.map(item => item.month)
  const income = data.map(item => item.income)
  const expense = data.map(item => item.expense)

  trendChartInstance.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { data: ['收入', '支出'], bottom: 0, textStyle: { color: '#57534E' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#57534E' }, axisLine: { lineStyle: { color: '#E7E5E4' } } },
    yAxis: { type: 'value', axisLabel: { formatter: v => '¥' + (v/1000).toFixed(0) + 'k', color: '#57534E' }, splitLine: { lineStyle: { color: '#E7E5E4', type: 'dashed' } } },
    series: [
      { name: '收入', type: 'bar', data: income, itemStyle: { color: '#10B981', borderRadius: [6,6,0,0] }, barWidth: '40%' },
      { name: '支出', type: 'bar', data: expense, itemStyle: { color: '#EF4444', borderRadius: [6,6,0,0] }, barWidth: '40%' }
    ]
  })
}

const renderRiskChart = (distribution) => {
  if (!riskChartRef.value) return
  if (riskChartInstance) {
    riskChartInstance.dispose()
  }
  riskChartInstance = echarts.init(riskChartRef.value)
  riskChartInstance.setOption({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E7E5E4', textStyle: { color: '#1C1917' } },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#57534E' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: distribution.low, name: '低风险', itemStyle: { color: '#10B981' } },
        { value: distribution.medium, name: '中风险', itemStyle: { color: '#F59E0B' } },
        { value: distribution.high, name: '高风险', itemStyle: { color: '#EF4444' } }
      ]
    }]
  })
}

// Actions
const sendReminder = async (user) => {
  try {
    await ElMessageBox.confirm(`确定向用户 "${user.name}" 发送预算超标提醒吗？`, '发送提醒', { confirmButtonText: '发送', cancelButtonText: '取消', type: 'warning' })
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/send-alert', { userId: user.id, message: `您的本月支出已达到预算的 ${user.usageRate}%，请注意控制消费。` }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success(`已向 ${user.name} 发送提醒`)
  } catch (e) { if (e !== 'cancel') console.error('发送提醒失败:', e) }
}

const batchSendReminder = async () => {
  if (selectedUsers.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定向选中的 ${selectedUsers.value.length} 位用户发送提醒吗？`, '批量发送提醒', { confirmButtonText: '发送', cancelButtonText: '取消', type: 'warning' })
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/batch-alert', { userIds: selectedUsers.value.map(u => u.id), message: '您的预算使用率较高，请注意控制消费。' }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success(`已向 ${selectedUsers.value.length} 位用户发送提醒`)
    selectedIds.value = []
  } catch (e) { if (e !== 'cancel') console.error('批量发送失败:', e) }
}

onMounted(() => {
  fetchStats()
  fetchRiskUsers()
  nextTick(() => { fetchTrendData(); fetchRiskDistribution() })
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onUnmounted(() => {
  trendChartInstance?.dispose()
  riskChartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})
</script>

<style scoped>
.admin-dashboard { display: flex; flex-direction: column; gap: 24px; }

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
  transition: all var(--transition-fast);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon.blue { background: var(--color-primary-soft); color: var(--color-primary); }
.stat-icon.green { background: var(--color-income-soft); color: var(--color-income); }
.stat-icon.red { background: var(--color-expense-soft); color: var(--color-expense); }
.stat-icon.orange { background: var(--color-warning-soft); color: var(--color-warning); }

.stat-body { flex: 1; min-width: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--color-text-primary); line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.stat-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; margin-top: 8px; }
.stat-trend.positive { color: var(--color-income); }
.stat-trend.warning { color: var(--color-warning); }

/* Charts */
.charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
@media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
.chart-area { height: 280px; }

/* Cards */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}
.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.card-actions { display: flex; gap: 10px; }

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-primary {
  border: none;
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); }
.btn-secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
}
.btn-secondary:hover:not(:disabled) { background: var(--color-surface-hover); color: var(--color-text-primary); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-small {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-small:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }

/* Table */
.table-wrap { padding: 0 24px 24px; }
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 12px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}
.table td {
  padding: 16px 8px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.table tbody tr:hover { background: var(--color-surface-hover); }
.table tbody tr:last-child td { border-bottom: none; }
.num { font-weight: 600; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.expense { color: var(--color-expense); }

/* User cell */
.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.user-email { font-size: 12px; color: var(--color-text-muted); }

/* Progress */
.progress-cell { display: flex; align-items: center; gap: 10px; }
.progress-bar { flex: 1; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.progress-fill.safe { background: var(--color-income); }
.progress-fill.warning { background: var(--color-warning); }
.progress-fill.danger { background: var(--color-expense); }
.progress-text { font-size: 12px; color: var(--color-text-secondary); font-weight: 500; min-width: 36px; }

/* Risk badge */
.risk-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.risk-badge.high { background: var(--color-expense-bg); color: var(--color-expense); }
.risk-badge.medium { background: var(--color-warning-soft); color: var(--color-warning); }
.risk-badge.low { background: var(--color-income-bg); color: var(--color-income); }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.5; }
.empty-state p { font-size: 14px; color: var(--color-text-muted); margin-top: 12px; }

/* ============================================
   Mobile Responsive Styles
   ============================================ */
@media (max-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr !important;
  }

  .chart-area {
    height: 240px;
  }

  .card-header {
    padding: 14px 16px;
    flex-wrap: wrap;
  }

  .card-actions {
    width: 100%;
    margin-top: 8px;
  }

  .btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  /* 表格在移动端滚动 */
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table {
    min-width: 600px;
  }

  .table th,
  .table td {
    padding: 10px 6px;
    font-size: 12px;
  }

  .user-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .user-name {
    font-size: 13px;
  }

  .user-email {
    font-size: 11px;
  }

  .progress-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .progress-text {
    font-size: 11px;
  }

  .risk-badge {
    padding: 3px 8px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 14px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }
}
</style>