<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Wallet :size="18" :stroke-width="1.5" />
          <span>账户管理</span>
        </div>
        <button class="btn primary" @click="openDialog()">
          <Plus :size="16" :stroke-width="2" />
          添加账户
        </button>
      </div>

      <div class="card-body">
        <div class="accounts-list" v-if="accounts.length > 0">
          <div class="account-card" v-for="account in accounts" :key="account._id">
            <div class="account-icon" :style="{ background: account.color + '15', color: account.color }">
              <component :is="getTypeIcon(account.type)" :size="22" :stroke-width="1.8" />
            </div>
            <div class="account-info">
              <div class="account-name">{{ account.name }}</div>
              <div class="account-type">{{ getTypeName(account.type) }}</div>
            </div>
            <div class="account-balance">¥{{ formatNumber(account.balance) }}</div>
            <div class="account-actions">
              <button class="btn-text" @click="openDialog(account)">编辑</button>
              <button class="btn-text danger" @click="deleteAccount(account._id)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <Wallet :size="48" :stroke-width="1" />
          <p>暂无账户，点击右上角添加</p>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click="dialogVisible = false">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">{{ isEdit ? '编辑账户' : '添加账户' }}</div>
          <button class="close-btn" @click="dialogVisible = false"><X :size="20" :stroke-width="2" /></button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">账户名称</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="如：现金、银行卡" />
          </div>

          <div class="form-group">
            <label class="form-label">账户类型</label>
            <select v-model="form.type" class="form-select">
              <option value="cash">现金</option>
              <option value="bank">银行卡</option>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">余额</label>
            <input v-model.number="form.balance" type="number" step="0.01" class="form-input" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="form.remark" rows="2" class="form-textarea" placeholder="可选"></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn secondary" @click="dialogVisible = false">取消</button>
          <button class="btn primary" @click="saveAccount">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Wallet, Banknote, CreditCard, Smartphone, MessageSquare, Package,
  Coins, Plus, X
} from 'lucide-vue-next'
import axios from 'axios'

const accounts = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

const form = ref({
  name: '',
  type: 'cash',
  balance: 0,
  remark: ''
})

const typeConfig = {
  cash: { color: '#10B981', name: '现金' },
  bank: { color: '#6366F1', name: '银行卡' },
  alipay: { color: '#8B5CF6', name: '支付宝' },
  wechat: { color: '#10B981', name: '微信' },
  other: { color: '#F59E0B', name: '其他' }
}

const getTypeName = (type) => typeConfig[type]?.name || '其他'

const getTypeIcon = (type) => {
  const icons = {
    cash: Banknote,
    bank: CreditCard,
    alipay: Smartphone,
    wechat: MessageSquare,
    other: Package
  }
  return icons[type] || Coins
}

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const fetchAccounts = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    })
    accounts.value = res.data || []
  } catch (error) {
    console.error('获取账户列表失败:', error)
  }
}

const openDialog = (account = null) => {
  if (account) {
    isEdit.value = true
    editId.value = account._id
    form.value = {
      name: account.name,
      type: account.type,
      balance: account.balance,
      remark: account.remark || ''
    }
  } else {
    isEdit.value = false
    editId.value = ''
    form.value = { name: '', type: 'cash', balance: 0, remark: '' }
  }
  dialogVisible.value = true
}

const saveAccount = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入账户名称')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const config = { headers: { Authorization: `Bearer ${token}` } }

    const data = {
      ...form.value,
      color: typeConfig[form.value.type]?.color || '#6366F1'
    }

    if (isEdit.value) {
      await axios.put(`/api/accounts/${editId.value}`, data, config)
      ElMessage.success('账户更新成功')
    } else {
      await axios.post('/api/accounts', data, config)
      ElMessage.success('账户添加成功')
    }

    dialogVisible.value = false
    fetchAccounts()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const deleteAccount = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该账户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const token = localStorage.getItem('token')
    await axios.delete(`/api/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchAccounts()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchAccounts()
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

.card-body { padding: 24px; }

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
.btn.primary:hover { background: '#4F46E5'; transform: translateY(-1px); }
.btn.secondary { background: var(--color-surface-hover); color: var(--color-text-secondary); }
.btn.secondary:hover { background: var(--color-surface-active); }

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

.accounts-list { display: flex; flex-direction: column; gap: 12px; }

.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.account-card:hover { background: var(--color-surface-active); }

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-info { flex: 1; }
.account-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.account-type { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.account-balance { font-size: 18px; font-weight: 700; color: var(--color-text-primary); min-width: 100px; text-align: right; }
.account-actions { display: flex; gap: 8px; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--color-text-muted); }
.empty-state p { margin-top: 12px; font-size: 14px; }

/* 对话框 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.6);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-container {
  width: 400px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-surface-hover);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.close-btn:hover { background: var(--color-surface-active); color: var(--color-text-primary); }

.dialog-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.dialog-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; gap: 12px; justify-content: flex-end; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

.form-input, .form-select, .form-textarea {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
}

.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-textarea { resize: vertical; }

@media (max-width: 640px) {
  .dialog-container { width: 100%; border-radius: 0; }
}
</style>