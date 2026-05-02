<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Bell :size="18" :stroke-width="1.5" />
          <span>消息中心</span>
        </div>
        <div class="header-actions">
          <button v-if="unreadCount > 0" class="btn secondary" @click="markAllRead">
            全部标记为已读
          </button>
          <button v-if="selectedIds.length > 0" class="btn danger" @click="batchDelete">
            <Trash2 :size="16" :stroke-width="2" />
            批量删除 ({{ selectedIds.length }})
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- 筛选标签 -->
        <div class="filter-tabs">
          <button class="tab-btn" :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">
            全部消息
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>
          <button class="tab-btn" :class="{ active: currentTab === 'unread' }" @click="currentTab = 'unread'">未读消息</button>
          <button class="tab-btn" :class="{ active: currentTab === 'budget_alert' }" @click="currentTab = 'budget_alert'">预算预警</button>
          <button class="tab-btn" :class="{ active: currentTab === 'system' }" @click="currentTab = 'system'">系统通知</button>
        </div>

        <!-- 消息列表 -->
        <div class="notifications-list" v-loading="loading">
          <div v-for="notification in filteredNotifications" :key="notification._id" class="notification-item" :class="{ unread: !notification.isRead }" @click="viewNotification(notification)">
            <input
              type="checkbox"
              :checked="selectedIds.includes(notification._id)"
              @click.stop
              @change="(e) => toggleSelect(notification._id, e.target.checked)"
            />

            <div class="notification-icon" :class="notification.type">
              <AlertTriangle v-if="notification.type === 'budget_alert'" :size="20" :stroke-width="1.8" />
              <ShieldAlert v-else-if="notification.type === 'risk_warning'" :size="20" :stroke-width="1.8" />
              <Megaphone v-else-if="notification.type === 'system'" :size="20" :stroke-width="1.8" />
              <Wallet v-else :size="20" :stroke-width="1.8" />
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <span class="notification-title">{{ notification.title }}</span>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <div class="notification-body">{{ notification.content }}</div>
            </div>

            <div class="notification-actions" @click.stop>
              <button v-if="!notification.isRead" class="btn-text" @click="markAsRead(notification._id)">标记已读</button>
              <button class="btn-text danger" @click="deleteNotification(notification._id)">删除</button>
            </div>
          </div>

          <div v-if="filteredNotifications.length === 0" class="empty-state">
            <Bell :size="48" :stroke-width="1" />
            <p>暂无消息</p>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <div class="pagination-left">
            <span class="pagination-total">共 <strong>{{ total }}</strong> 条消息</span>
            <select v-model="pageSize" @change="handleSizeChange" class="page-size-select">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
          </div>
          <div class="pagination-right">
            <button class="page-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
              <ChevronLeft :size="16" />
            </button>
            <template v-for="item in pageRange" :key="item">
              <button v-if="item !== '...'" class="page-btn page-num desktop-only" :class="{ active: item === currentPage }" @click="goPage(item)">{{ item }}</button>
              <span v-else class="page-ellipsis desktop-only">···</span>
            </template>
            <span class="page-indicator mobile-only">{{ currentPage }}/{{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, AlertTriangle, ShieldAlert, Megaphone, Wallet, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import axios from 'axios'

const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const currentTab = ref('all')
const selectedIds = ref([])

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const pageRange = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const goPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchNotifications()
}

const filteredNotifications = computed(() => {
  if (currentTab.value === 'all') return notifications.value
  if (currentTab.value === 'unread') return notifications.value.filter(n => !n.isRead)
  return notifications.value.filter(n => n.type === currentTab.value)
})

const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/notifications', {
      params: { page: currentPage.value, pageSize: pageSize.value },
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value = res.data.notifications || []
    total.value = res.data.total || 0
    unreadCount.value = res.data.unreadCount || 0
  } catch (error) {
    console.error('获取消息失败:', error)
    ElMessage.error('获取消息失败')
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const notification = notifications.value.find(n => n._id === id)
    if (notification) notification.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const markAllRead = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('标记全部已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const deleteNotification = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('token')
    await axios.delete(`/api/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    notifications.value = notifications.value.filter(n => n._id !== id)
    total.value = Math.max(0, total.value - 1)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条消息吗？`, '批量删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('token')
    await axios.post('/api/notifications/batch-delete', {
      ids: selectedIds.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    notifications.value = notifications.value.filter(n => !selectedIds.value.includes(n._id))
    total.value = Math.max(0, total.value - selectedIds.value.length)
    selectedIds.value = []
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const toggleSelect = (id, checked) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
}

const viewNotification = (notification) => {
  if (!notification.isRead) markAsRead(notification._id)
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 172800000) return '昨天'

  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

watch(currentTab, () => {
  selectedIds.value = []
})

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px; max-width: 1080px; margin: 0 auto; width: 100%; overflow-x: hidden; }

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

.header-actions { display: flex; gap: 12px; }

.card-body { padding: 24px; }

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn.secondary { background: var(--color-surface-hover); color: var(--color-text-secondary); }
.btn.secondary:hover { background: var(--color-surface-active); }
.btn.danger { background: var(--color-expense); color: white; }
.btn.danger:hover { background: '#DC2626'; transform: translateY(-1px); }

.btn-text {
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.btn-text:hover { color: var(--color-primary); }
.btn-text.danger:hover { color: var(--color-expense); }

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  width: fit-content;
}

.tab-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover { background: 'rgba(0, 0, 0, 0.05)'; }
.tab-btn.active { background: var(--color-surface); color: var(--color-primary); font-weight: 500; }

.badge {
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-expense);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-list { display: flex; flex-direction: column; gap: 12px; }

.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.notification-item:hover { background: var(--color-surface-active); }
.notification-item.unread { background: var(--color-primary-soft); border-color: var(--color-primary); }

.notification-item input { width: 16px; height: 16px; cursor: pointer; }

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  color: var(--color-text-secondary);
}

.notification-icon.budget_alert { background: var(--color-expense-bg); color: var(--color-expense); }
.notification-icon.risk_warning { background: var(--color-warning-soft); color: var(--color-warning); }
.notification-icon.system { background: var(--color-primary-soft); color: var(--color-primary); }

.notification-content { flex: 1; min-width: 0; }

.notification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notification-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.notification-time { font-size: 12px; color: var(--color-text-muted); }

.notification-body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-actions { display: flex; gap: 4px; opacity: 0; transition: opacity var(--transition-fast); }
.notification-item:hover .notification-actions { opacity: 1; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--color-text-muted); }
.empty-state p { margin-top: 12px; font-size: 14px; }

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 4px;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-total {
  font-size: 13px;
  color: var(--color-text-muted);
}
.pagination-total strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.pagination-left select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
}
.pagination-left select:hover { border-color: var(--color-primary); }

.pagination-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
.page-btn.page-num.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  font-weight: 600;
}
.page-ellipsis {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 0 4px;
  line-height: 34px;
}

.page-indicator {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  padding: 0 8px;
  min-width: 48px;
  text-align: center;
}

.desktop-only { display: inline-flex; }
.mobile-only { display: none; }

/* ============================================
   Responsive Styles - Notifications
   ============================================ */
@media (max-width: 768px) {
  .page-container {
    padding: 12px;
    gap: 12px;
  }

  .card-body {
    padding: 16px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-tabs {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .notifications-list {
    gap: 8px;
  }

  .notification-item {
    padding: 12px;
    gap: 10px;
  }

  .notification-icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-body {
    font-size: 12px;
  }

  .notification-actions {
    opacity: 1;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .pagination-left,
  .pagination-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .desktop-only { display: none !important; }
  .mobile-only { display: inline !important; }
}
</style>