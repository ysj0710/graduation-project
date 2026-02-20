<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>🔔 消息中心</h3>
      <div class="notification-list">
        <div class="notification-item" v-for="notif in notifications" :key="notif.id">
          <div class="notif-icon" :class="notif.level">{{ notif.icon }}</div>
          <div class="notif-content">
            <div class="notif-title">{{ notif.title }}</div>
            <div class="notif-time">{{ notif.time }}</div>
          </div>
          <el-tag :type="notif.read ? 'info' : 'primary'" size="small">
            {{ notif.read ? '已读' : '未读' }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref([
  { id: 1, icon: '⚠️', title: '用户 张三 消费超预算90%', time: '10分钟前', level: 'danger', read: false },
  { id: 2, icon: '👤', title: '新用户注册：李四', time: '30分钟前', level: 'info', read: false },
  { id: 3, icon: '📊', title: '月度统计报告已生成', time: '2小时前', level: 'success', read: true }
])
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #F5F5F7;
  border-radius: 14px;
}

.notif-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.notif-icon.danger { background: rgba(255, 59, 48, 0.15); }
.notif-icon.success { background: rgba(52, 199, 89, 0.15); }
.notif-icon.info { background: rgba(0, 122, 255, 0.15); }

.notif-content {
  flex: 1;
}

.notif-title {
  font-size: 14px;
  font-weight: 500;
  color: #000;
}

.notif-time {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
}
</style>
