<template>
  <div class="page-container">
    <!-- Action Bar -->
    <div class="action-bar">
      <div class="search-box">
        <Search :size="18" :stroke-width="1.5" class="search-icon" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索用户名或邮箱..."
          class="search-input"
        />
      </div>
      <button class="btn btn-primary" @click="$router.push('/admin/users-add')">
        <Plus :size="16" :stroke-width="2" />
        新增用户
      </button>
    </div>

    <!-- Table Card -->
    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>用户</th>
              <th style="width: 120px">预算</th>
              <th style="width: 120px">本月消费</th>
              <th style="width: 100px">风险等级</th>
              <th style="width: 140px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="avatar" :style="{ background: user.avatarColor }">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="num">¥{{ formatNumber(user.budget) }}</td>
              <td class="num" :class="{ expense: user.spent > user.budget * 0.8 }">
                ¥{{ formatNumber(user.spent) }}
              </td>
              <td>
                <span class="risk-badge" :class="user.riskLevel">{{ user.riskLabel }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-small danger" @click="deleteUser(user)">
                    <Trash2 :size="14" :stroke-width="1.5" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0 && !loading" class="empty-state">
          <div class="empty-icon"><Users :size="48" :stroke-width="1" /></div>
          <p>暂无用户数据</p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrap">
      <span class="page-indicator">第 {{ currentPage }} / {{ Math.ceil(total / pageSize) || 1 }} 页</span>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Trash2, Users } from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        search: searchKeyword.value
      }
    })
    users.value = response.data.users.map(u => ({
      id: u._id,
      name: u.nickname || u.username,
      email: u.email,
      budget: u.config?.budget?.monthly || 5000,
      spent: u.monthlySpent || 0,
      riskLevel: u.config?.financialHealth?.riskLevel || 'low',
      riskLabel: u.config?.financialHealth?.riskLevel === 'high' ? '高风险' :
                 u.config?.financialHealth?.riskLevel === 'medium' ? '中风险' : '低风险',
      avatarColor: '#6366F1',
      isActive: u.isActive
    }))
    total.value = response.data.total
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

watch([currentPage, searchKeyword], () => {
  fetchUsers()
})

onMounted(() => {
  fetchUsers()
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${user.name} 吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('token')
    await axios.delete(`/api/admin/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }

/* Action Bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex: 1;
  max-width: 400px;
  transition: all var(--transition-fast);
}
.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.search-icon { color: var(--color-text-muted); flex-shrink: 0; }
.search-input {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text-primary);
  width: 100%;
  outline: none;
}
.search-input::placeholder { color: var(--color-text-muted); }

/* Buttons */
.btn {
  padding: 10px 18px;
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
.btn-primary {
  border: none;
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }

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
.btn-small:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }
.btn-small.danger { color: var(--color-expense); }
.btn-small.danger:hover { background: var(--color-expense-bg); border-color: var(--color-expense); }

/* Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.table-wrap { padding: 0; }

/* Table */
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 14px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
}
.table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.table tbody tr:hover { background: var(--color-surface-hover); }
.table tbody tr:last-child td { border-bottom: none; }
.num { font-weight: 600; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.expense { color: var(--color-expense); }

/* User cell */
.user-cell { display: flex; align-items: center; gap: 14px; }
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
}
.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.user-email { font-size: 12px; color: var(--color-text-muted); }

/* Risk badge */
.risk-badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.risk-badge.high { background: var(--color-expense-bg); color: var(--color-expense); }
.risk-badge.medium { background: var(--color-warning-soft); color: var(--color-warning); }
.risk-badge.low { background: var(--color-income-bg); color: var(--color-income); }

/* Actions */
.action-btns { display: flex; gap: 8px; }

/* Pagination */
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 16px;
}
.page-indicator { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
.empty-icon { color: var(--color-text-muted); opacity: 0.5; }
.empty-state p { font-size: 14px; color: var(--color-text-muted); margin-top: 12px; }
</style>