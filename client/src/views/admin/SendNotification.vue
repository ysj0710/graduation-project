<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <SendIcon :size="18" :stroke-width="1.5" />
          <span>发送系统通知</span>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="sendNotification" class="form">
          <!-- 发送范围 -->
          <div class="form-group">
            <label class="form-label">发送范围</label>
            <div class="scope-options">
              <label class="scope-option" :class="{ active: sendScope === 'all' }">
                <input type="radio" v-model="sendScope" value="all" />
                <div class="scope-content">
                  <UsersIcon :size="16" :stroke-width="1.5" />
                  <div>
                    <div class="scope-title">全部用户</div>
                    <div class="scope-desc">发送给所有注册用户</div>
                  </div>
                </div>
              </label>
              <label class="scope-option" :class="{ active: sendScope === 'selected' }">
                <input type="radio" v-model="sendScope" value="selected" />
                <div class="scope-content">
                  <UserCheck :size="16" :stroke-width="1.5" />
                  <div>
                    <div class="scope-title">指定用户</div>
                    <div class="scope-desc">选择要发送的用户</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 指定用户选择 -->
          <div v-if="sendScope === 'selected'" class="form-group">
            <label class="form-label">选择用户</label>
            <div class="user-select-area">
              <div class="user-select-header">
                <el-input v-model="searchKeyword" class="search-input" size="small" placeholder="搜索用户名..." />
                <el-button type="button" class="btn btn-small" size="small" @click="fetchUsers">刷新</el-button>
              </div>
              <div class="user-list">
                <div
                  v-for="user in filteredUsers"
                  :key="user._id"
                  class="user-item"
                  :class="{ selected: selectedUserIds.includes(user._id) }"
                  @click="toggleUser(user._id)"
                >
                  <div class="user-avatar">{{ (user.nickname || user.username).charAt(0) }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ user.nickname || user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                  <div class="check-icon" v-if="selectedUserIds.includes(user._id)">
                    <Check :size="14" :stroke-width="2.5" />
                  </div>
                </div>
                <div v-if="filteredUsers.length === 0" class="empty-hint">未找到用户</div>
              </div>
              <div class="user-select-footer">
                已选择 {{ selectedUserIds.length }} 位用户
                <el-button v-if="selectedUserIds.length > 0" type="primary" link size="small" @click="selectedUserIds = []">清空</el-button>
              </div>
            </div>
          </div>

          <!-- 消息内容 -->
          <div class="form-group">
            <label class="form-label">通知标题</label>
            <el-input v-model="form.title" class="form-input" placeholder="例如：系统升级通知" required />
          </div>

          <div class="form-group">
            <label class="form-label">通知内容</label>
            <el-input v-model="form.content" type="textarea" :rows="4" class="form-textarea" placeholder="输入通知内容..." required />
          </div>

          <!-- 发送按钮 -->
          <div class="form-actions">
            <el-button type="primary" class="btn btn-primary" :disabled="sending || !canSend" @click="sendNotification">
              <SendIcon :size="16" :stroke-width="2" />
              {{ sending ? '发送中...' : '发送通知' }}
            </el-button>
          </div>
        </form>
      </div>
    </div>

    <!-- 发送记录 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <History :size="18" :stroke-width="1.5" />
          <span>发送记录</span>
        </div>
      </div>
      <div class="table-wrap">
        <el-table :data="sentLogs" stripe size="small" style="width: 100%;">
          <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          <el-table-column label="发送范围" width="100">
            <template #default="{ row }">
              <span class="scope-tag" :class="row.scope">
                {{ row.scope === 'all' ? '全部用户' : `${row.sentCount} 位用户` }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="发送时间" width="160">
            <template #default="{ row }">
              <span class="time-cell">{{ formatTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="sentLogs.length === 0 && !loadingLogs" class="empty-state">
          <History :size="40" :stroke-width="1" />
          <p>暂无发送记录</p>
        </div>
        <!-- 分页 -->
        <div v-if="totalLogs > pageSize" class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalLogs"
            layout="prev, pager, next"
            background
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Send as SendIcon, Users as UsersIcon, UserCheck, Check, History } from 'lucide-vue-next'
import axios from 'axios'

const sendScope = ref('all')
const form = ref({ title: '', content: '' })
const sending = ref(false)
const searchKeyword = ref('')
const users = ref([])
const selectedUserIds = ref([])
const loading = ref(false)
const loadingLogs = ref(false)
const sentLogs = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalLogs = ref(0)

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  const kw = searchKeyword.value.toLowerCase()
  return users.value.filter(u =>
    (u.username || '').toLowerCase().includes(kw) ||
    (u.nickname || '').toLowerCase().includes(kw) ||
    (u.email || '').toLowerCase().includes(kw)
  )
})

const canSend = computed(() => {
  if (!form.value.title.trim() || !form.value.content.trim()) return false
  if (sendScope.value === 'selected' && selectedUserIds.value.length === 0) return false
  return true
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: { pageSize: 100 }
    })
    users.value = res.data.users.map(u => ({
      _id: u._id,
      username: u.username,
      nickname: u.nickname,
      email: u.email
    }))
  } catch (e) {
    console.error('获取用户失败', e)
  } finally {
    loading.value = false
  }
}

const toggleUser = (id) => {
  const idx = selectedUserIds.value.indexOf(id)
  if (idx === -1) {
    selectedUserIds.value.push(id)
  } else {
    selectedUserIds.value.splice(idx, 1)
  }
}

const sendNotification = async () => {
  if (!canSend.value) return

  const scope = sendScope.value === 'all' ? '全部用户' : `${selectedUserIds.value.length} 位用户`
  try {
    await ElMessageBox.confirm(
      `确认向 ${scope} 发送通知「${form.value.title}」？`,
      '确认发送',
      { confirmButtonText: '确认发送', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }

  sending.value = true
  try {
    const token = localStorage.getItem('token')
    const payload = {
      title: form.value.title,
      content: form.value.content
    }
    if (sendScope.value === 'selected' && selectedUserIds.value.length > 0) {
      payload.userIds = selectedUserIds.value
    }

    const res = await axios.post('/api/notifications/system', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // 添加到发送记录
    sentLogs.value.unshift({
      _id: Date.now().toString(),
      title: form.value.title,
      content: form.value.content,
      createdAt: new Date(),
      scope: scope
    })

    ElMessage.success(res.data.message || '发送成功')
    form.value = { title: '', content: '' }
    selectedUserIds.value = []
    // 刷新发送记录
    currentPage.value = 1
    await fetchSentLogs()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

const recallNotification = async (log) => {
  try {
    await ElMessageBox.confirm('确认撤回此通知？', '确认撤回', { type: 'warning' })
    const idx = sentLogs.value.findIndex(l => l._id === log._id)
    if (idx !== -1) sentLogs.value.splice(idx, 1)
    ElMessage.success('已撤回')
  } catch {
    // cancel
  }
}

const fetchSentLogs = async () => {
  loadingLogs.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/sent-notifications', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: currentPage.value, pageSize: pageSize.value }
    })
    sentLogs.value = res.data.logs || []
    totalLogs.value = res.data.total || 0
  } catch (e) {
    console.error('获取发送记录失败', e)
  } finally {
    loadingLogs.value = false
  }
}

const formatTime = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

watch(currentPage, () => {
  fetchSentLogs()
})

onMounted(() => {
  fetchUsers()
  fetchSentLogs()
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
.card-body { padding: 24px; }

.form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 10px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

/* Scope options */
.scope-options { display: flex; gap: 12px; }
.scope-option {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.scope-option input { display: none; }
.scope-option.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
.scope-option:hover { border-color: var(--color-primary); }
.scope-content { display: flex; align-items: center; gap: 12px; color: var(--color-text-secondary); }
.scope-option.active .scope-content { color: var(--color-primary); }
.scope-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.scope-option.active .scope-title { color: var(--color-primary); }
.scope-desc { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }

/* User select */
.user-select-area {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.user-select-header {
  padding: 10px 12px;
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 8px;
  align-items: center;
}
.search-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.search-input:focus { border-color: var(--color-primary); }
.user-list { max-height: 240px; overflow-y: auto; padding: 4px; }
.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.user-item:hover { background: var(--color-surface-hover); }
.user-item.selected { background: var(--color-primary-soft); }
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.user-email { font-size: 11px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.check-icon {
  width: 22px;
  height: 22px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.user-select-footer {
  padding: 8px 12px;
  background: var(--color-surface-hover);
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.link-btn { background: none; border: none; color: var(--color-primary); font-size: 12px; cursor: pointer; font-weight: 600; }

/* Inputs */
.form-input {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
  font-family: var(--font-ui);
}
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-textarea {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
  font-family: var(--font-ui);
  resize: vertical;
}
.form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }

/* Buttons */
.btn {
  padding: 10px 20px;
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
.btn.primary { background: var(--color-primary); color: white; }
.btn.primary:hover:not(:disabled) { background: var(--color-primary-dark); }
.btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-small {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-small.danger { color: var(--color-expense); }
.btn-small.danger:hover { background: var(--color-expense-bg); border-color: var(--color-expense); }
.form-actions { margin-top: 4px; }

/* Table */
.table-wrap { padding: 0 24px 24px; overflow: hidden; }
.content-cell { font-size: 13px; color: var(--color-text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time-cell { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
.scope-tag {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
}
.scope-tag.all { background: var(--color-primary-soft); color: var(--color-primary); }
.scope-tag.selected { background: var(--color-surface-hover); color: var(--color-text-secondary); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px; color: var(--color-text-muted); gap: 8px; }
.empty-hint { text-align: center; padding: 20px; font-size: 13px; color: var(--color-text-muted); }
.pagination-wrap { display: flex; justify-content: center; padding-top: 16px; }
</style>
