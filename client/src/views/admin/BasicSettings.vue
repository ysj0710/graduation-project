<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>⚙️ 基础配置</h3>
      <el-form :model="settings" label-position="top" style="max-width: 500px;">
        <el-form-item label="系统名称">
          <el-input v-model="settings.systemName" />
        </el-form-item>
        <el-form-item label="默认货币">
          <el-input v-model="settings.currency" />
        </el-form-item>
        <el-form-item label="默认月度预算">
          <el-input-number v-model="settings.defaultBudget" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const settings = ref({
  systemName: '随手记',
  currency: 'CNY',
  defaultBudget: 5000
})

const saveSettings = () => ElMessage.success('设置已保存')
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
</style>
