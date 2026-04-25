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
            <button type="button" class="btn btn-primary" @click="handleExport">
              <Download :size="16" :stroke-width="2" />
              导出数据
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

const handleExport = () => { ElMessage.success('正在导出数据...') }
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
.btn-primary:hover { background: var(--color-primary-dark); transform: translateY(-1px); }
</style>