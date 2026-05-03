<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <BellIcon :size="18" :stroke-width="1.5" />
          <span>消息中心</span>
        </div>
        <div class="header-actions">
          <el-button size="small" @click="markAllRead" v-if="unreadCount > 0">
            全部标记已读
          </el-button>
        </div>
      </div>
      <div class="card-body">
        <div class="notification-list">
          <div class="notification-item" v-for="notif in notifications" :key="notif.id">
            <div class="notif-icon" :class="notif.level">
              <AlertTriangle v-if="notif.level === 'danger'" :size="20" :stroke-width="1.5" />
              <User v-else-if="notif.level === 'info'" :size="20" :stroke-width="1.5" />
              <CheckCircle2 v-else :size="20" :stroke-width="1.5" />
            </div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-time">{{ notif.time }}</div>
            </div>
            <span class="notif-badge" :class="{ read: notif.read }">
              {{ notif.read ? '已读' : '未读' }}
            </span>
            <div class="notif-actions">
              <el-button v-if="!notif.read" class="btn-icon" size="small" @click="markRead(notif)">
                <Check :size="16" :stroke-width="1.5" />
              </el-button>
              <el-button class="btn-icon" size="small" type="danger" @click="deleteNotif(notif)">
                <TrashIcon :size="16" :stroke-width="1.5" />
              </el-button>
            </div>
          </div>

          <div v-if="notifications.length === 0 && !loading" class="empty-state">
            <div class="empty-icon"><BellIcon :size="48" :stroke-width="1" /></div>
            <p>暂无消息</p>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell as BellIcon, AlertTriangle, User, CheckCircle2, Check, Trash2 as TrashIcon } from 'lucide-vue-next'
import axios from 'axios'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })

    notifications.value = response.data.notifications.map(n => ({
      id: n._id,
      title: n.title,
      time: formatTime(n.createdAt),
      level: getNotificationLevel(n.type),
      read: n.isRead
    }))
    unreadCount.value = response.data.unreadCount || 0
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取消息列表失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const getNotificationLevel = (type) => {
  const levelMap = {
    budget_alert: 'danger',
    risk_warning: 'danger',
    system: 'info',
    transaction: 'success'
  }
  return levelMap[type] || 'info'
}

const markRead = async (notif) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/notifications/${notif.id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    notif.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '标记已读失败')
  }
}

const markAllRead = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '标记已读失败')
  }
}

const deleteNotif = async (notif) => {
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/notifications/${notif.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    notifications.value = notifications.value.filter(n => n.id !== notif.id)
    if (!notif.read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

watch(currentPage, () => {
  fetchNotifications()
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.header-actions { display: flex; gap: 12px; }
.card-body { padding: 24px; }

.btn-small {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-small:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }

.notification-list { display: flex; flex-direction: column; gap: 12px; }
.notification-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast);
}
.notification-item:hover { background: var(--color-surface-active); }

.notif-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.notif-icon.danger { background: var(--color-expense-bg); color: var(--color-expense); }
.notif-icon.success { background: var(--color-income-bg); color: var(--color-income); }
.notif-icon.info { background: var(--color-primary-soft); color: var(--color-primary); }

.notif-content { flex: 1; }
.notif-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.notif-time { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }

.notif-badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.notif-badge.read { background: var(--color-surface-hover); color: var(--color-text-muted); }

.notif-actions { display: flex; gap: 8px; }
.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.btn-icon:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.5; }
.empty-state p { font-size: 14px; color: var(--color-text-muted); margin-top: 12px; }

.pagination-wrap { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 0 4px; }
.page-indicator { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }
.page-buttons { display: flex; align-items: center; gap: 8px; }
.page-btn { width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); color: var(--color-text-secondary); }
.page-btn:hover:not(:disabled) { background: var(--color-surface-hover); color: var(--color-text-primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-current { font-size: 14px; font-weight: 600; color: var(--color-text-primary); min-width: 28px; text-align: center; }
</style>