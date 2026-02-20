<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📜 操作日志</h3>
      <div class="log-list">
        <div class="log-item" v-for="log in logs" :key="log.id">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-user">{{ log.user }}</span>
          <span class="log-action">{{ log.action }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logs = ref([
  { id: 1, time: '2026-02-20 10:30', user: '管理员', action: '新增用户 张三' },
  { id: 2, time: '2026-02-20 10:15', user: '管理员', action: '修改系统设置' },
  { id: 3, time: '2026-02-20 09:45', user: '管理员', action: '删除用户 李四' }
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

.log-list {
  display: flex;
  flex-direction: column;
}

.log-item {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #F2F2F7;
}

.log-time {
  color: #8E8E93;
  font-size: 13px;
}

.log-user {
  font-weight: 600;
  color: #000;
}

.log-action {
  color: #3C3C43;
}
</style>
