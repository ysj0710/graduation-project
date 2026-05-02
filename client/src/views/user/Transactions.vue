<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <ListOrdered :size="18" :stroke-width="1.5" />
          <span>交易记录</span>
        </div>
        <div class="header-actions">
          <button v-if="selectedIds.length > 0" class="btn danger" @click="batchDelete">
            <Trash2 :size="16" :stroke-width="2" />
            批量删除 ({{ selectedIds.length }})
          </button>
          <button class="btn primary" @click="showImportDialog = true">
            <Download :size="16" :stroke-width="2" />
            导入账单
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- 筛选器 -->
        <div class="filter-bar">
          <div class="select-all">
            <input
              type="checkbox"
              :checked="isIndeterminate ? 'indeterminate' : checkAll"
              @change="handleCheckAllChange"
            />
            <span>全选</span>
          </div>
          <div class="btn-group">
            <button class="btn small" :class="{ active: filterType === 'all' }" @click="filterType = 'all'; currentPage = 1; fetchRecords()">全部</button>
            <button class="btn small" :class="{ active: filterType === 'expense' }" @click="filterType = 'expense'; currentPage = 1; fetchRecords()">支出</button>
            <button class="btn small" :class="{ active: filterType === 'income' }" @click="filterType = 'income'; currentPage = 1; fetchRecords()">收入</button>
          </div>
        </div>

        <!-- 交易列表 -->
        <div class="transactions-list">
          <div v-for="record in filteredRecords" :key="record._id" class="transaction-item" :class="{ selected: selectedIds.includes(record._id) }">
            <div class="transaction-top">
              <input
                type="checkbox"
                :checked="selectedIds.includes(record._id)"
                @change="(e) => toggleSelect(record._id, e.target.checked)"
              />
              <div class="transaction-icon" :style="{
                background: record.type === 'income' ? 'var(--color-income-bg)' : 'var(--color-expense-bg)',
                color: record.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
              }">
                <CategoryIcon :name="record.category" :size="20" />
              </div>
              <div class="transaction-info">
                <div class="transaction-title">{{ record.category }}</div>
                <div v-if="record.note" class="transaction-note">{{ record.note }}</div>
                <div class="transaction-time">{{ formatTime(record.date) }}</div>
              </div>
            </div>
            <div class="transaction-bottom">
              <div class="transaction-amount" :class="record.type">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ formatNumber(record.amount) }}
              </div>
              <div class="transaction-actions">
                <button class="btn-text" @click="openEditDialog(record)">编辑</button>
                <button class="btn-text danger" @click="deleteRecord(record._id)">删除</button>
              </div>
            </div>
          </div>

          <div v-if="filteredRecords.length === 0" class="empty-state">
            <ListOrdered :size="48" :stroke-width="1" />
            <p>暂无记录</p>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="total > 0">
          <div class="pagination-left">
            <span class="pagination-total">共 <strong>{{ total }}</strong> 条</span>
            <select v-model="pageSize" @change="handleSizeChange" class="page-size-select">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
          </div>
          <div class="pagination-right">
            <button class="page-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
              <ChevronLeft :size="16" />
            </button>
            <!-- 桌面端显示页码 -->
            <template v-for="item in pageRange" :key="item">
              <button v-if="item !== '...'" class="page-btn page-num desktop-only" :class="{ active: item === currentPage }" @click="goPage(item)">{{ item }}</button>
              <span v-else class="page-ellipsis desktop-only">···</span>
            </template>
            <!-- 移动端显示页码指示 -->
            <span class="page-indicator mobile-only">{{ currentPage }}/{{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入账单对话框 -->
    <div v-if="showImportDialog" class="dialog-overlay" @click="showImportDialog = false">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">
            <Download :size="20" :stroke-width="1.8" />
            <span>导入账单</span>
          </div>
          <button class="close-btn" @click="showImportDialog = false"><X :size="20" :stroke-width="2" /></button>
        </div>

        <div class="dialog-body">
          <!-- 步骤指示器 -->
          <div class="steps">
            <div class="step" :class="{ active: importStep >= 0, completed: importStep > 0 }">
              <div class="step-number">1</div>
              <div class="step-label">选择平台</div>
            </div>
            <div class="step-line" :class="{ active: importStep > 0 }"></div>
            <div class="step" :class="{ active: importStep >= 1 }">
              <div class="step-number">2</div>
              <div class="step-label">上传文件</div>
            </div>
          </div>

          <!-- 步骤0：选择平台 -->
          <div v-if="importStep === 0" class="step-content">
            <div class="platform-select">
              <div class="platform-card" :class="{ active: importPlatform === 'wechat' }" @click="importPlatform = 'wechat'">
                <div class="platform-icon"><MessageSquare :size="32" :stroke-width="1.8" /></div>
                <div class="platform-name">微信支付</div>
                <div class="platform-desc">导出CSV/XLSX</div>
              </div>
              <div class="platform-card" :class="{ active: importPlatform === 'alipay' }" @click="importPlatform = 'alipay'">
                <div class="platform-icon"><Smartphone :size="32" :stroke-width="1.8" /></div>
                <div class="platform-name">支付宝</div>
                <div class="platform-desc">导出CSV/XLSX</div>
              </div>
            </div>

            <div v-if="importPlatform" class="guide-box">
              <div class="guide-title">{{ importPlatform === 'wechat' ? '微信导出教程' : '支付宝导出教程' }}</div>
              <div class="guide-content" v-if="importPlatform === 'wechat'">
                1. 微信 → 我 → 服务 → 钱包<br/>
                2. 右上角「...」→ 账单<br/>
                3. 「导出账单」→ 选择时间<br/>
                4. 发送到邮箱，下载CSV/XLSX
              </div>
              <div class="guide-content" v-else>
                1. 支付宝 → 账单<br/>
                2. 右上角「...」→ 导出<br/>
                3. 选择时间 → 导出CSV/XLSX<br/>
                4. 保存到本地
              </div>
            </div>

            <div class="dialog-footer">
              <button class="btn primary" :disabled="!importPlatform" @click="importStep = 1">
                下一步
              </button>
            </div>
          </div>

          <!-- 步骤1：上传文件 -->
          <div v-if="importStep === 1" class="step-content">
            <div class="form-group">
              <label class="form-label">导入到账户</label>
              <select v-model="importAccountId" class="form-select">
                <option value="">可选：更新账户余额</option>
                <option v-for="acc in accounts" :key="acc._id" :value="acc._id">
                  {{ acc.icon }} {{ acc.name }}
                </option>
              </select>
            </div>

            <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
              <input ref="uploadRef" type="file" accept=".csv,.xlsx,.xls" @change="handleFileChange" hidden />
              <Upload :size="48" :stroke-width="1" />
              <p>拖拽文件到此处或点击上传</p>
              <span class="upload-tip">支持 CSV、XLSX 格式文件</span>
            </div>

            <div v-if="importResult" class="result-box" :class="importResult.count > 0 ? 'success' : 'warning'">
              {{ importResult.message }}
            </div>

            <div class="dialog-footer">
              <button class="btn secondary" @click="importStep = 0">上一步</button>
              <button class="btn primary" :disabled="!fileReady" :class="{ loading: importing }" @click="doImport">
                开始导入
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑交易对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="showEditDialog = false">
      <div class="dialog-container small" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title">编辑交易记录</div>
          <button class="close-btn" @click="showEditDialog = false"><X :size="20" :stroke-width="2" /></button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">类型</label>
            <select v-model="editForm.type" class="form-select">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">金额</label>
            <input v-model.number="editForm.amount" type="number" step="0.01" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="editForm.category" class="form-select">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="editForm.note" rows="2" class="form-textarea"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">日期</label>
            <input v-model="editForm.date" type="datetime-local" class="form-input" />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn secondary" @click="showEditDialog = false">取消</button>
          <button class="btn primary" :class="{ loading: saving }" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ListOrdered, Download, MessageSquare, Smartphone, Trash2,
  Upload, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-vue-next'
import CategoryIcon from '../../components/CategoryIcon.vue'
import axios from 'axios'

const records = ref([])
const filterType = ref('all')
const selectedIds = ref([])
const checkAll = ref(false)
const isIndeterminate = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const pageRange = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const goPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchRecords()
}

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

const fetchRecords = async () => {
  try {
    const token = localStorage.getItem('token')
    const params = { page: currentPage.value, pageSize: pageSize.value }
    if (filterType.value !== 'all') params.type = filterType.value
    const res = await axios.get('/api/transactions', {
      params,
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
    const res = await axios.get('/api/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    })
    accounts.value = res.data || []
  } catch (error) {
    console.error('获取账户列表失败:', error)
  }
}

const handleCheckAllChange = (e) => {
  checkAll.value = e.target.checked
  const currentIds = filteredRecords.value.map(r => r._id)
  if (e.target.checked) {
    currentIds.forEach(id => {
      if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
    })
  } else {
    selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id))
  }
  updateIndeterminate()
}

const updateIndeterminate = () => {
  const currentIds = filteredRecords.value.map(r => r._id)
  const selectedOnCurrentPage = currentIds.filter(id => selectedIds.value.includes(id))
  checkAll.value = selectedOnCurrentPage.length === currentIds.length && currentIds.length > 0
  isIndeterminate.value = selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < currentIds.length
}

const toggleSelect = (id, checked) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  }
  updateIndeterminate()
}

const handleSizeChange = () => {
  currentPage.value = 1
  checkAll.value = false
  isIndeterminate.value = false
  fetchRecords()
}

const triggerUpload = () => {
  uploadRef.value?.click()
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) handleFile(file)
}

const handleFile = (file) => {
  const ext = file.name.toLowerCase().split('.').pop()

  if (ext === 'csv') {
    const reader = new FileReader()
    reader.onload = (e) => {
      csvContent.value = e.target.result
      xlsxContent.value = ''
      fileReady.value = true
    }
    reader.readAsText(file)
  } else if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]
      xlsxContent.value = base64
      csvContent.value = ''
      fileReady.value = true
    }
    reader.readAsDataURL(file)
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
    const endpoint = importPlatform.value === 'wechat' ? '/api/import/wechat' : '/api/import/alipay'

    const res = await axios.post(endpoint, {
      csvContent: csvContent.value || undefined,
      xlsxContent: xlsxContent.value || undefined,
      accountId: importAccountId.value || undefined
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    importResult.value = res.data
    ElMessage.success(res.data.message)

    fetchRecords()
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

const openEditDialog = (record) => {
  editForm.value = {
    id: record._id,
    type: record.type,
    amount: record.amount,
    category: record.category,
    note: record.note || '',
    date: new Date(record.date).toISOString().slice(0, 16)
  }
  showEditDialog.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/import/${editForm.value.id}`, {
      type: editForm.value.type,
      amount: editForm.value.amount,
      category: editForm.value.category,
      note: editForm.value.note,
      date: new Date(editForm.value.date)
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
    await axios.delete(`/api/import/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
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
    await axios.post('/api/import/batch-delete', {
      ids: selectedIds.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchRecords()
  fetchAccounts()
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px; max-width: 1080px; margin: 0 auto; width: 100%; overflow-x: hidden; }

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

.header-actions { display: flex; gap: 12px; }

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
.btn.primary:hover:not(:disabled) { background: #4F46E5; transform: translateY(-1px); }
.btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.secondary { background: var(--color-surface-hover); color: var(--color-text-secondary); }
.btn.secondary:hover { background: var(--color-surface-active); }
.btn.danger { background: var(--color-expense); color: white; }
.btn.danger:hover { background: #DC2626; transform: translateY(-1px); }

.btn.small {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  background: var(--color-surface-hover);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn.small.active { background: var(--color-primary-soft); color: var(--color-primary); }

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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
}

.select-all { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text-secondary); }
.select-all input { width: 16px; height: 16px; cursor: pointer; }

.btn-group { display: flex; gap: 4px; }

.transactions-list { display: flex; flex-direction: column; gap: 12px; }

.transaction-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.transaction-item:hover { background: var(--color-surface-active); }
.transaction-item.selected { background: var(--color-primary-soft); border-color: var(--color-primary); }

.transaction-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transaction-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 28px;
}

.transaction-item input { width: 16px; height: 16px; cursor: pointer; }

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-info { flex: 1; }
.transaction-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.transaction-note { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.transaction-time { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }
.transaction-amount { font-size: 16px; font-weight: 700; min-width: 90px; text-align: right; }
.transaction-amount.expense { color: var(--color-expense); }
.transaction-amount.income { color: var(--color-income); }

.transaction-actions { display: flex; gap: 4px; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--color-text-muted); }
.empty-state p { margin-top: 12px; font-size: 14px; }

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 4px;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-total {
  font-size: 13px;
  color: var(--color-text-muted);
}
.pagination-total strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.pagination-left select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
}
.pagination-left select:hover { border-color: var(--color-primary); }

.pagination-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
.page-btn.page-num.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  font-weight: 600;
}
.page-ellipsis {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 0 4px;
  line-height: 34px;
}

.page-indicator {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  padding: 0 8px;
  min-width: 48px;
  text-align: center;
}

.desktop-only { display: inline-flex; }
.mobile-only { display: none; }

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
  width: 560px;
  max-height: 80vh;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-container.small { width: 400px; }

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 600; color: var(--color-text-primary); }

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

.dialog-body { flex: 1; padding: 24px; overflow-y: auto; }
.dialog-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }

/* 步骤指示器 */
.steps { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.step { display: flex; align-items: center; gap: 8px; }
.step-number {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.step.active .step-number { background: var(--color-primary); color: white; }
.step.completed .step-number { background: var(--color-income); color: white; }
.step-label { font-size: 13px; color: var(--color-text-muted); }
.step.active .step-label { color: var(--color-text-primary); font-weight: 600; }
.step-line { width: 60px; height: 2px; background: var(--color-border); }
.step-line.active { background: var(--color-income); }

.step-content { display: flex; flex-direction: column; gap: 20px; }

/* 平台选择 */
.platform-select { display: flex; gap: 16px; }

.platform-card {
  flex: 1;
  padding: 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
}

.platform-card:hover { border-color: var(--color-text-muted); }
.platform-card.active { border-color: var(--color-primary); background: var(--color-primary-soft); }

.platform-icon { margin-bottom: 8px; color: var(--color-text-secondary); }
.platform-card.active .platform-icon { color: var(--color-primary); }
.platform-name { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.platform-desc { font-size: 12px; color: var(--color-text-muted); }

.guide-box {
  padding: 16px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--color-primary);
}

.guide-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.guide-content { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

/* 上传区域 */
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

.form-select, .form-input, .form-textarea {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: all var(--transition-fast);
}

.form-select:focus, .form-input:focus, .form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.form-textarea { resize: vertical; }

.upload-area {
  padding: 32px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-hover);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
}

.upload-area:hover { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); }
.upload-area p { font-size: 14px; }
.upload-tip { font-size: 12px; }

.result-box {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.result-box.success { background: var(--color-income-bg); color: var(--color-income); }
.result-box.warning { background: var(--color-warning-soft); color: var(--color-warning); }

.btn.loading { opacity: 0.6; pointer-events: none; }

@media (max-width: 640px) {
  .dialog-container { width: 100%; max-height: 100vh; border-radius: 0; }
  .pagination { flex-direction: column; gap: 12px; }
}

@media (max-width: 768px) {
  .page-container { padding: 12px; gap: 12px; }
  .card-header { flex-direction: column; gap: 12px; align-items: flex-start; padding: 14px 16px; }
  .header-actions { width: 100%; flex-wrap: wrap; }
  .filter-bar { flex-wrap: wrap; gap: 8px; padding: 10px 12px; }
  .card-body { padding: 12px; }

  .transaction-item { padding: 10px 12px; gap: 6px; }
  .transaction-top { gap: 10px; }
  .transaction-bottom {
    padding-left: 26px;
    padding-top: 4px;
    border-top: 1px dashed var(--color-border);
    margin-top: 2px;
    padding-top: 8px;
  }

  .transaction-title { font-size: 14px; font-weight: 600; }
  .transaction-note { font-size: 12px; margin-top: 1px; }
  .transaction-time { font-size: 12px; margin-top: 2px; }
  .transaction-amount { font-size: 15px; font-weight: 700; }
  .transaction-actions { gap: 8px; }

  .pagination-wrapper { flex-direction: column; gap: 10px; align-items: center; }
  .pagination-left { justify-content: center; gap: 8px; }
  .pagination-right { justify-content: center; }

  .desktop-only { display: none !important; }
  .mobile-only { display: inline !important; }

  .page-size-select { font-size: 12px; padding: 4px 8px; }
}
</style>