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
        <div class="pagination" v-if="total > 0">
          <div class="page-info">共 {{ total }} 条消息</div>
          <div class="page-controls">
            <select v-model="pageSize" @change="handleSizeChange">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
            <div class="page-buttons">
              <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--; fetchNotifications()">
                <ChevronLeft :size="16" />
              </button>
              <span class="page-current">{{ currentPage }}</span>
              <button class="page-btn" :disabled="currentPage >= Math.ceil(total / pageSize)" @click="currentPage++; fetchNotifications()">
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, AlertTriangle, ShieldAlert, Megaphone, Wallet, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import axios from 'axios'

const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const currentTab = ref('all')
const selectedIds = ref([])

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
.page-container { display: flex; flex-direction: column; gap: 24px; }

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

.pagination {
  margin-top: 20px;
  padding: 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-info { font-size: 13px; color: var(--color-text-muted); }
.page-controls { display: flex; align-items: center; gap: 16px; }

.page-controls select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
}

.page-buttons { display: flex; align-items: center; gap: 8px; }

.page-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) { background: var(--color-surface-hover); color: var(--color-text-primary); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-current { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
</style>