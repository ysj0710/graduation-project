<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Download :size="18" :stroke-width="1.5" />
          <span>数据导出</span>
        </div>
      </div>
      <div class="card-body">
        <form class="export-form">
          <div class="form-group">
            <label class="form-label">日期范围</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              unlink-panels
              style="width: 100%"
            />
          </div>
          <div class="form-group">
            <label class="form-label">数据类型</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" value="transactions" v-model="dataTypes" />
                <span class="checkbox-label">交易记录</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" value="users" v-model="dataTypes" />
                <span class="checkbox-label">用户数据</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" value="stats" v-model="dataTypes" />
                <span class="checkbox-label">统计数据</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">导出格式</label>
            <div class="radio-group">
              <label class="radio-item" :class="{ active: exportFormat === 'csv' }">
                <input type="radio" value="csv" v-model="exportFormat" />
                <span class="radio-label">CSV</span>
              </label>
              <label class="radio-item" :class="{ active: exportFormat === 'xlsx' }">
                <input type="radio" value="xlsx" v-model="exportFormat" />
                <span class="radio-label">Excel</span>
              </label>
              <label class="radio-item" :class="{ active: exportFormat === 'json' }">
                <input type="radio" value="json" v-model="exportFormat" />
                <span class="radio-label">JSON</span>
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" :disabled="exporting" @click="handleExport">
              <Download :size="16" :stroke-width="2" />
              {{ exporting ? '导出中...' : '导出数据' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from 'lucide-vue-next'

const dateRange = ref(null)
const dataTypes = ref(['transactions'])
const exportFormat = ref('csv')
const exporting = ref(false)

const handleExport = async () => {
  if (dataTypes.value.length === 0) {
    ElMessage.warning('请至少选择一种数据类型')
    return
  }
  exporting.value = true
  try {
    const params = new URLSearchParams()
    params.append('dataTypes', dataTypes.value.join(','))
    params.append('format', exportFormat.value)
    if (dateRange.value?.length === 2) {
      const fmt = d => d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0]
      params.append('startDate', fmt(dateRange.value[0]))
      params.append('endDate', fmt(dateRange.value[1]))
    }

    const token = localStorage.getItem('token')
    const response = await fetch(`/api/admin/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || '导出失败')
    }

    // 根据格式获取文件名后缀
    const ext = exportFormat.value === 'json' ? 'json' : exportFormat.value === 'xlsx' ? 'xlsx' : 'csv'
    const disposition = response.headers.get('Content-Disposition')
    let filename = `财务导出_${new Date().toISOString().split('T')[0]}.${ext}`
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i)
      if (match) filename = decodeURIComponent(match[2] || match[3] || filename)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (e) {
    console.error('[ExportCenter] 导出失败:', e)
    ElMessage.error(e.message || '导出失败，请重试')
  } finally {
    exporting.value = false
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
  max-width: 600px;
}
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.card-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.card-body { padding: 24px; }

.export-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

.checkbox-group { display: flex; flex-direction: column; gap: 10px; }
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.checkbox-item input { width: 18px; height: 18px; accent-color: var(--color-primary); }
.checkbox-label { font-size: 14px; color: var(--color-text-primary); }

.radio-group { display: flex; gap: 12px; }
.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.radio-item.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }
.radio-item input { display: none; }
.radio-label { font-size: 14px; font-weight: 500; }

.form-actions { margin-top: 8px; }
.btn {
  padding: 10px 20px;
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
.btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>