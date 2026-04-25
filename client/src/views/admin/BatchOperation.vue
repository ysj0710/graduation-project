<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Layers :size="18" :stroke-width="1.5" />
          <span>批量操作</span>
        </div>
      </div>
      <div class="card-body">
        <div class="batch-section">
          <div class="section-title">选择操作类型</div>
          <div class="batch-actions">
            <button class="btn btn-primary" @click="batchActivate" :disabled="loading">
              <UserCheck :size="16" :stroke-width="2" />
              批量激活
            </button>
            <button class="btn btn-warning" @click="batchDeactivate" :disabled="loading">
              <UserX :size="16" :stroke-width="2" />
              批量停用
            </button>
            <button class="btn btn-danger" @click="batchDelete" :disabled="loading">
              <Trash2 :size="16" :stroke-width="2" />
              批量删除
            </button>
          </div>
          <p class="hint">提示：批量操作将影响所有选中的用户，请谨慎操作</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Layers, UserCheck, UserX, Trash2 } from 'lucide-vue-next'
import axios from 'axios'

const loading = ref(false)

const getUsersForBatch = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize: 100 }
    })
    return response.data.users.map(u => u._id)
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    return []
  }
}

const batchActivate = async () => {
  try {
    await ElMessageBox.confirm('确定要批量激活所有用户吗？', '批量激活', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const userIds = await getUsersForBatch()
    if (userIds.length === 0) return

    loading.value = true
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/users/batch', {
      type: 'activate',
      userIds
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('批量激活成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量激活失败')
    }
  } finally {
    loading.value = false
  }
}

const batchDeactivate = async () => {
  try {
    await ElMessageBox.confirm('确定要批量停用所有用户吗？', '批量停用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const userIds = await getUsersForBatch()
    if (userIds.length === 0) return

    loading.value = true
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/users/batch', {
      type: 'deactivate',
      userIds
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('批量停用成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量停用失败')
    }
  } finally {
    loading.value = false
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要批量删除所有用户吗？此操作不可恢复！', '批量删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    const userIds = await getUsersForBatch()
    if (userIds.length === 0) return

    loading.value = true
    const token = localStorage.getItem('token')
    await axios.post('/api/admin/users/batch', {
      type: 'delete',
      userIds
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量删除失败')
    }
  } finally {
    loading.value = false
  }
}
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
.card-body { padding: 24px; }

.batch-section { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.batch-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.btn {
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary { border: none; background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-warning { border: none; background: var(--color-warning); color: white; }
.btn-warning:hover { filter: brightness(0.95); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-danger { border: none; background: var(--color-expense); color: white; }
.btn-danger:hover { filter: brightness(0.95); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.hint { font-size: 12px; color: var(--color-text-muted); }
</style>