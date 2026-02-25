<template>
  <div class="user-page">
    <div class="page-header">
      <h2>💳 账户管理</h2>
      <el-button type="primary" size="small" @click="openDialog()">+ 添加账户</el-button>
    </div>
    
    <div class="accounts-list" v-if="accounts.length > 0">
      <div class="account-card" v-for="account in accounts" :key="account._id">
        <div class="account-icon" :style="{ background: account.color + '15' }">
          {{ account.icon }}
        </div>
        <div class="account-info">
          <div class="account-name">{{ account.name }}</div>
          <div class="account-type">{{ getTypeName(account.type) }}</div>
        </div>
        <div class="account-balance">¥{{ formatNumber(account.balance) }}</div>
        <div class="account-actions">
          <el-button size="small" text @click="openDialog(account)">编辑</el-button>
          <el-button size="small" text type="danger" @click="deleteAccount(account._id)">删除</el-button>
        </div>
      </div>
    </div>
    
    <el-empty v-else description="暂无账户，点击右上角添加" :image-size="80" />

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账户' : '添加账户'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="账户名称">
          <el-input v-model="form.name" placeholder="如：现金、银行卡" />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="form.type" placeholder="选择类型">
            <el-option label="💵 现金" value="cash" />
            <el-option label="💳 银行卡" value="bank" />
            <el-option label="📱 支付宝" value="alipay" />
            <el-option label="💬 微信" value="wechat" />
            <el-option label="📦 其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额">
          <el-input-number v-model="form.balance" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  cash: { icon: '💵', color: '#34C759', name: '现金' },
  bank: { icon: '💳', color: '#007AFF', name: '银行卡' },
  alipay: { icon: '📱', color: '#5856D6', name: '支付宝' },
  wechat: { icon: '💬', color: '#07BE63', name: '微信' },
  other: { icon: '📦', color: '#FF9500', name: '其他' }
}

const getTypeName = (type) => typeConfig[type]?.name || '其他'

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const fetchAccounts = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/accounts', {
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
    form.value = {
      name: '',
      type: 'cash',
      balance: 0,
      remark: ''
    }
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
      icon: typeConfig[form.value.type]?.icon || '💰',
      color: typeConfig[form.value.type]?.color || '#007AFF'
    }

    if (isEdit.value) {
      await axios.put(`http://localhost:3000/api/accounts/${editId.value}`, data, config)
      ElMessage.success('账户更新成功')
    } else {
      await axios.post('http://localhost:3000/api/accounts', data, config)
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
    await axios.delete(`http://localhost:3000/api/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchAccounts()
})
</script>

<style scoped>
.user-page {
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

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.account-type {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}

.account-balance {
  font-size: 18px;
  font-weight: 700;
  color: #000;
  min-width: 100px;
  text-align: right;
}

.account-actions {
  display: flex;
  gap: 8px;
}
</style>
