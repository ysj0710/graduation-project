<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📋 批量操作</h3>
      <div class="batch-actions">
        <el-button type="primary" @click="batchExport">批量导出</el-button>
        <el-button type="warning" @click="batchMessage">批量发送消息</el-button>
        <el-button type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const batchExport = () => ElMessage.info('批量导出功能')
const batchMessage = () => ElMessage.info('批量发送消息功能')
const batchDelete = () => ElMessage.info('批量删除功能')
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

.batch-actions {
  display: flex;
  gap: 12px;
}
</style>
