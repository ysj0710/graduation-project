<template>
  <div class="user-page">
    <div class="page-header">
      <h2>📋 交易记录</h2>
      <div class="header-actions">
        <el-button 
          v-if="selectedIds.length > 0" 
          size="small" 
          type="danger" 
          @click="batchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
        <el-button size="small" type="primary" @click="showImportDialog = true">
          📥 导入账单
        </el-button>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <div class="filter-bar">
      <el-checkbox 
        :indeterminate="isIndeterminate" 
        v-model="checkAll" 
        @change="handleCheckAllChange"
      >
        全选
      </el-checkbox>
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
        :class="{ selected: selectedIds.includes(record._id) }"
      >
        <el-checkbox 
          :model-value="selectedIds.includes(record._id)"
          @change="(val) => toggleSelect(record._id, val)"
        />
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
        <div class="transaction-actions">
          <el-button size="small" text @click="openEditDialog(record)">编辑</el-button>
          <el-button size="small" text type="danger" @click="deleteRecord(record._id)">删除</el-button>
        </div>
      </div>
      
      <el-empty v-if="filteredRecords.length === 0" description="暂无记录" />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 导入账单对话框 -->
    <el-dialog v-model="showImportDialog" title="📥 导入账单" width="500px">
      <el-steps :active="importStep" finish-status="success" class="mb-4">
        <el-step title="选择平台" />
        <el-step title="上传文件" />
      </el-steps>

      <div v-if="importStep === 0">
        <div class="platform-select">
          <div 
            class="platform-card" 
            :class="{ active: importPlatform === 'wechat' }"
            @click="importPlatform = 'wechat'"
          >
            <div class=" = 'wechatplatform-icon">💬</div>
            <div class="platform-name">微信支付</div>
            <div class="platform-desc">导出CSV/XLSX</div>
          </div>
          <div 
            class="platform-card" 
            :class="{ active: importPlatform === 'alipay' }"
            @click="importPlatform = 'alipay'"
          >
            <div class="platform-icon">📱</div>
            <div class="platform-name">支付宝</div>
            <div class="platform-desc">导出CSV/XLSX</div>
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
                4. 发送到邮箱，下载CSV/XLSX
              </div>
              <div v-else>
                1. 支付宝 → 账单<br/>
                2. 右上角「...」→ 导出<br/>
                3. 选择时间 → 导出CSV/XLSX<br/>
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
          accept=".csv,.xlsx,.xls"
          :on-change="handleFileChange"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持 CSV、XLSX 格式文件</div>
          </template>
        </el-upload>

        <div v-if="importResult" class="import-result mt-4">
          <el-alert :type="importResult.count > 0 ? 'success' : 'warning'" :title="importResult.message" />
        </div>

        <div class="text-center mt-4">
          <el-button @click="importStep = 0">上一步</el-button>
          <el-button type="primary" :loading="importing" :disabled="!fileReady" @click="doImport">
            开始导入
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑交易对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑交易记录" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="editForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.note" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="editForm.date" type="datetime" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const records = ref([])
const filterType = ref('all')
const selectedIds = ref([])
const checkAll = ref(false)
const isIndeterminate = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 导入相关
const showImportDialog = ref(false)
const importStep = ref(0)
const importPlatform = ref('')
const importAccountId = ref('')
const csvContent = ref('')
const xlsxContent = ref('')
const importing = ref(false)
const importResult = ref(null)
const accounts = ref([])
const fileReady = ref(false)
const uploadRef = ref(null)

// 编辑相关
const showEditDialog = ref(false)
const editForm = ref({
  id: '',
  type: 'expense',
  amount: 0,
  category: '其他',
  note: '',
  date: new Date()
})
const saving = ref(false)

const categories = ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '充值', '生活缴费', '保险', '工资', '奖金', '理财', '兼职', '收入', '其他']

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
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    records.value = res.data.transactions || []
    total.value = res.data.total || 0
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

const handleCheckAllChange = (val) => {
  checkAll.value = val
  const currentIds = filteredRecords.value.map(r => r._id)
  if (val) {
    // 累加选中：合并当前页选中的ID
    currentIds.forEach(id => {
      if (!selectedIds.value.includes(id)) {
        selectedIds.value.push(id)
      }
    })
  } else {
    // 取消选中当前页
    selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id))
  }
  updateIndeterminate()
}

const updateIndeterminate = () => {
  const currentIds = filteredRecords.value.map(r => r._id)
  const selectedOnCurrentPage = currentIds.filter(id => selectedIds.value.includes(id))
  checkAll.value = selectedOnCurrentPage.length === currentIds.length
  isIndeterminate.value = selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < currentIds.length
}

const toggleSelect = (id, checked) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
  updateIndeterminate()
}

const handleSelectChange = () => {
  updateIndeterminate()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  selectedIds.value = []  // 切换每页数量清空选择
  checkAll.value = false
  isIndeterminate.value = false
  fetchRecords()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  selectedIds.value = []  // 切换页面清空选择
  checkAll.value = false
  isIndeterminate.value = false
  fetchRecords()
}

const handleFileChange = (file) => {
  const ext = file.name.toLowerCase().split('.').pop()
  
  if (ext === 'csv') {
    const reader = new FileReader()
    reader.onload = (e) => {
      csvContent.value = e.target.result
      xlsxContent.value = ''
      fileReady.value = true
    }
    reader.readAsText(file.raw)
  } else if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader()
    reader.onload = (e) => {
      // 转换为base64
      const base64 = e.target.result.split(',')[1]
      xlsxContent.value = base64
      csvContent.value = ''
      fileReady.value = true
    }
    reader.readAsDataURL(file.raw)
  }
}

const doImport = async () => {
  if (!csvContent.value && !xlsxContent.value) {
    ElMessage.warning('请先上传文件')
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
      csvContent: csvContent.value || undefined,
      xlsxContent: xlsxContent.value || undefined,
      accountId: importAccountId.value || undefined
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    importResult.value = res.data
    ElMessage.success(res.data.message)
    
    fetchRecords()
    // 重置导入状态
    setTimeout(() => {
      showImportDialog.value = false
      importStep.value = 0
      importPlatform.value = ''
      csvContent.value = ''
      xlsxContent.value = ''
      fileReady.value = false
      importResult.value = null
    }, 1500)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

// 编辑相关
const openEditDialog = (record) => {
  editForm.value = {
    id: record._id,
    type: record.type,
    amount: record.amount,
    category: record.category,
    note: record.note || '',
    date: new Date(record.date)
  }
  showEditDialog.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://localhost:3000/api/import/${editForm.value.id}`, {
      type: editForm.value.type,
      amount: editForm.value.amount,
      category: editForm.value.category,
      note: editForm.value.note,
      date: editForm.value.date
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    ElMessage.success('更新成功')
    showEditDialog.value = false
    fetchRecords()
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    saving.value = false
  }
}

const deleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    await axios.delete(`http://localhost:3000/api/import/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/import/batch-delete', {
      ids: selectedIds.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
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

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f5f5f7;
  border-radius: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #F5F5F7;
}

.transaction-item.selected {
  background: #E6F7FF;
}

.transaction-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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
  min-width: 90px;
  text-align: right;
}

.transaction-amount.expense {
  color: #FF3B30;
}

.transaction-amount.income {
  color: #34C759;
}

.transaction-actions {
  display: flex;
  gap: 4px;
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
