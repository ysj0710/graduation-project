<template>
  <div class="user-page">
    <div class="page-header">
      <h2>📋 交易记录</h2>
      <el-button size="small" type="primary" @click="showImportDialog = true">
        📥 导入账单
      </el-button>
    </div>
    
    <!-- 筛选器 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterType" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="expense">支出</el-radio-button>
        <el-radio-button value="income">收入</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 交易列表 -->
    <div class="transactions-list">
      <div 
        v-for="record in filteredRecords" 
        :key="record._id"
        class="transaction-item"
      >
        <div class="transaction-icon" :style="{ background: record.type === 'income' ? '#34C75915' : '#FF3B3015', color: record.type === 'income' ? '#34C759' : '#FF3B30' }">
          {{ getCategoryIcon(record.category) }}
        </div>
        <div class="transaction-info">
          <div class="transaction-title">{{ record.category }}</div>
          <div class="transaction-note" v-if="record.note">{{ record.note }}</div>
          <div class="transaction-time">{{ formatTime(record.date) }}</div>
        </div>
        <div class="transaction-amount" :class="record.type">
          {{ record.type === 'income' ? '+' : '-' }}¥{{ formatNumber(record.amount) }}
        </div>
      </div>
      
      <el-empty v-if="filteredRecords.length === 0" description="暂无记录" />
    </div>

    <!-- 导入账单对话框 -->
    <el-dialog v-model="showImportDialog" title="📥 导入账单" width="500px">
      <el-steps :active="importStep" finish-status="success" class="mb-4">
        <el-step title="选择平台" />
        <el-step title="上传文件" />
      </el-steps>

      <!-- 步骤1：选择平台 -->
      <div v-if="importStep === 0">
        <div class="platform-select">
          <div 
            class="platform-card" 
            :class="{ active: importPlatform === 'wechat' }"
            @click="importPlatform = 'wechat'"
          >
            <div class="platform-icon">💬</div>
            <div class="platform-name">微信支付</div>
            <div class="platform-desc">导出CSV账单</div>
          </div>
          <div 
            class="platform-card" 
            :class="{ active: importPlatform === 'alipay' }"
            @click="importPlatform = 'alipay'"
          >
            <div class="platform-icon">📱</div>
            <div class="platform-name">支付宝</div>
            <div class="platform-desc">导出CSV账单</div>
          </div>
        </div>
        <div class="platform-guide" v-if="importPlatform">
          <el-alert
            :title="importPlatform === 'wechat' ? '微信导出教程' : '支付宝导出教程'"
            :type="importPlatform === 'wechat' ? 'success' : 'primary'"
            :closable="false"
          >
            <template #default>
              <div v-if="importPlatform === 'wechat'">
                1. 微信 → 我 → 服务 → 钱包<br/>
                2. 右上角「...」→ 账单<br/>
                3. 「导出账单」→ 选择时间<br/>
                4. 发送到邮箱，下载CSV
              </div>
              <div v-else>
                1. 支付宝 → 账单<br/>
                2. 右上角「...」→ 导出<br/>
                3. 选择时间 → 导出CSV<br/>
                4. 保存到本地
              </div>
            </template>
          </el-alert>
        </div>
        <div class="text-center mt-4">
          <el-button type="primary" :disabled="!importPlatform" @click="importStep = 1">
            下一步
          </el-button>
        </div>
      </div>

      <!-- 步骤2：上传文件 -->
      <div v-if="importStep === 1">
        <el-form-item label="导入到账户">
          <el-select v-model="importAccountId" placeholder="可选：更新账户余额" style="width: 100%" clearable>
            <el-option
              v-for="acc in accounts"
              :key="acc._id"
              :label="`${acc.icon} ${acc.name}`"
              :value="acc._id"
            />
          </el-select>
        </el-form-item>
        
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".csv"
          :on-change="handleFileChange"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽CSV文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持 CSV 格式文件</div>
          </template>
        </el-upload>

        <div v-if="importResult" class="import-result mt-4">
          <el-alert :type="importResult.count > 0 ? 'success' : 'warning'" :title="importResult.message" />
        </div>

        <div class="text-center mt-4">
          <el-button @click="importStep = 0">上一步</el-button>
          <el-button type="primary" :loading="importing" :disabled="!csvContent" @click="doImport">
            开始导入
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const records = ref([])
const filterType = ref('all')

// 导入相关
const showImportDialog = ref(false)
const importStep = ref(0)
const importPlatform = ref('')
const importAccountId = ref('')
const csvContent = ref('')
const importing = ref(false)
const importResult = ref(null)
const accounts = ref([])

const filteredRecords = computed(() => {
  if (filterType.value === 'all') return records.value
  return records.value.filter(r => r.type === filterType.value)
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getCategoryIcon = (category) => {
  const icons = {
    '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
    '住房': '🏠', '医疗': '💊', '教育': '📚', '其他': '📦',
    '工资': '💰', '奖金': '🎁', '理财': '📈', '兼职': '💼',
    '收入': '💰', '生活缴费': '💡', '充值': '📱', '保险': '🛡️'
  }
  return icons[category] || '💰'
}

const fetchRecords = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    records.value = res.data.transactions || []
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

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

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    csvContent.value = e.target.result
  }
  reader.readAsText(file.raw)
}

const doImport = async () => {
  if (!csvContent.value) {
    ElMessage.warning('请先上传CSV文件')
    return
  }

  importing.value = true
  importResult.value = null

  try {
    const token = localStorage.getItem('token')
    const endpoint = importPlatform.value === 'wechat' 
      ? '/api/import/wechat' 
      : '/api/import/alipay'
    
    const res = await axios.post(`http://localhost:3000${endpoint}`, {
      csvContent: csvContent.value,
      accountId: importAccountId.value || undefined
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    importResult.value = res.data
    ElMessage.success(res.data.message)
    
    // 刷新交易记录
    fetchRecords()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchRecords()
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
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.filter-bar {
  margin-bottom: 20px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #F5F5F7;
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.transaction-note {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}

.transaction-time {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 4px;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 700;
}

.transaction-amount.expense {
  color: #FF3B30;
}

.transaction-amount.income {
  color: #34C759;
}

/* 导入对话框样式 */
.platform-select {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.platform-card {
  flex: 1;
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.platform-card:hover {
  border-color: #ddd;
}

.platform-card.active {
  border-color: #007AFF;
  background: #007AFF08;
}

.platform-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.platform-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.platform-desc {
  font-size: 12px;
  color: #888;
}

.platform-guide {
  margin: 16px 0;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-center {
  text-align: center;
}

.import-result {
  text-align: center;
}
</style>
