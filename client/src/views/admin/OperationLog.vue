<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <ScrollText :size="18" :stroke-width="1.5" />
          <span>操作日志</span>
        </div>
      </div>
      <div class="card-body">
        <el-table :data="logs" stripe size="small">
          <el-table-column label="时间" prop="time" width="180" />
          <el-table-column label="用户" prop="user" width="120" />
          <el-table-column label="操作" prop="action" />
          <el-table-column label="详情" prop="details" />
          <template #empty>
            <div v-if="!loading" class="empty-state">
              <div class="empty-icon"><ScrollText :size="48" :stroke-width="1" /></div>
              <p>暂无操作日志</p>
            </div>
          </template>
        </el-table>
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
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ScrollText } from 'lucide-vue-next'
import axios from 'axios'

const logs = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchLogs = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/operation-logs', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: currentPage.value, pageSize: pageSize.value }
    })
    logs.value = res.data.logs
    total.value = res.data.total
  } catch (error) {
    console.error('获取日志失败:', error)
  } finally {
    loading.value = false
  }
}

watch(currentPage, () => fetchLogs())

onMounted(() => {
  fetchLogs()
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
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 0 24px 24px; }

.log-list { display: flex; flex-direction: column; }
.log-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}
.log-item:last-child { border-bottom: none; }
.log-time {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
  min-width: 140px;
}
.log-user {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 80px;
}
.log-action {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.log-details {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: 8px;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--color-border);
}
.page-indicator { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.5; }
.empty-state p { font-size: 14px; color: var(--color-text-muted); margin-top: 12px; }
</style>