<template>
  <div class="notifications-page">
    <div class="page-header">
      <h2>🔔 消息中心</h2>
      <div class="header-actions">
        <el-button 
          v-if="unreadCount > 0" 
          type="primary" 
          size="small"
          @click="markAllRead"
        >
          全部标记为已读
        </el-button>
        <el-button 
          v-if="selectedIds.length > 0" 
          type="danger" 
          size="small"
          @click="batchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <div 
        class="tab-item" 
        :class="{ active: currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        全部消息
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: currentTab === 'unread' }"
        @click="currentTab = 'unread'"
      >
        未读消息
      </div>
      <div 
        class="tab-item" 
        :class="{ active: currentTab === 'budget_alert' }"
        @click="currentTab = 'budget_alert'"
      >
        预算预警
      </div>
      <div 
        class="tab-item" 
        :class="{ active: currentTab === 'system' }"
        @click="currentTab = 'system'"
      >
        系统通知
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="notifications-list" v-loading="loading">
      <el-empty v-if="filteredNotifications.length === 0" description="暂无消息" />
      
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification._id"
        class="notification-item"
        :class="{ unread: !notification.isRead }"
        @click="viewNotification(notification)"
      >
        <el-checkbox 
          :model-value="selectedIds.includes(notification._id)"
          @click.stop
          @change="(val) => toggleSelect(notification._id, val)"
        />
        
        <div class="notification-icon" :class="notification.type">
          {{ getIcon(notification.type) }}
        </div>
        
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-title">{{ notification.title }}</span>
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
          </div>
          <div class="notification-body">{{ notification.content }}</div>
        </div>
        
        <div class="notification-actions" @click.stop>
          <el-button 
            v-if="!notification.isRead" 
            size="small" 
            text
            @click="markAsRead(notification._id)"
          >
            标记已读
          </el-button>
          <el-button size="small" text type="danger" @click="deleteNotification(notification._id)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const currentTab = ref('all')
const selectedIds = ref([])

// 筛选后的消息
const filteredNotifications = computed(() => {
  if (currentTab.value === 'all') return notifications.value
  if (currentTab.value === 'unread') return notifications.value.filter(n => !n.isRead)
  return notifications.value.filter(n => n.type === currentTab.value)
})

// 获取消息列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/notifications', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      },
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

// 获取未读数量
const fetchUnreadCount = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    })
    unreadCount.value = res.data.count || 0
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

// 标记已读
const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const notification = notifications.value.find(n => n._id === id)
    if (notification) {
      notification.isRead = true
    }
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

// 全部标记已读
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

// 删除消息
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

// 批量删除
const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条消息吗？`,
      '批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
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

// 选择切换
const toggleSelect = (id, checked) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
}

// 查看消息详情
const viewNotification = (notification) => {
  if (!notification.isRead) {
    markAsRead(notification._id)
  }
}

// 获取图标
const getIcon = (type) => {
  const icons = {
    budget_alert: '⚠️',
    risk_warning: '🚨',
    system: '📢',
    transaction: '💰'
  }
  return icons[type] || '📬'
}

// 格式化时间
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

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchNotifications()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchNotifications()
}

// 监听标签变化，重置选择
watch(currentTab, () => {
  selectedIds.value = []
})

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: #F5F5F7;
  border-radius: 12px;
  width: fit-content;
}

.tab-item {
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tab-item.active {
  background: white;
  color: #007AFF;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.badge {
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #FF3B30;
  color: white;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.notification-item:hover {
  background: #F5F5F7;
}

.notification-item.unread {
  background: #E6F7FF;
  border-color: #007AFF20;
}

.notification-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #F5F5F7;
  flex-shrink: 0;
}

.notification-icon.budget_alert {
  background: rgba(255, 59, 48, 0.15);
}

.notification-icon.risk_warning {
  background: rgba(255, 149, 0, 0.15);
}

.notification-icon.system {
  background: rgba(0, 122, 255, 0.15);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.notification-time {
  font-size: 12px;
  color: #8E8E93;
}

.notification-body {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
