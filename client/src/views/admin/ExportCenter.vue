<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📤 数据导出</h3>
      <div class="export-form">
        <div class="form-item">
          <label>日期范围</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </div>
        <div class="form-item">
          <label>数据类型</label>
          <el-checkbox-group v-model="dataTypes">
            <el-checkbox label="transactions">交易记录</el-checkbox>
            <el-checkbox label="users">用户数据</el-checkbox>
            <el-checkbox label="stats">统计数据</el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="form-item">
          <label>导出格式</label>
          <el-radio-group v-model="exportFormat">
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="xlsx">Excel</el-radio>
            <el-radio label="json">JSON</el-radio>
          </el-radio-group>
        </div>
        <el-button type="primary" @click="handleExport">导出数据</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const dateRange = ref(null)
const dataTypes = ref(['transactions'])
const exportFormat = ref('csv')

const handleExport = () => {
  ElMessage.success('正在导出数据...')
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.ios-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #3C3C43;
}
</style>
