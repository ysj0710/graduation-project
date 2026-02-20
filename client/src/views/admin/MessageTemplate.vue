<template>
  <div class="page-container">
    <div class="ios-card">
      <h3>📝 消息模板设置</h3>
      <el-form :model="templates" label-position="top">
        <el-form-item label="低风险提醒">
          <el-input v-model="templates.low" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="中风险提醒">
          <el-input v-model="templates.medium" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="高风险提醒">
          <el-input v-model="templates.high" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTemplates">保存模板</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const templates = ref({
  low: '您的消费状况良好，请继续保持理性消费习惯。',
  medium: '本月消费状况可控，但已接近预算阈值，建议适当控制支出。',
  high: '本月消费过高，已严重超出预算，请立即调整消费行为，避免财务风险。'
})

const saveTemplates = () => ElMessage.success('模板已保存')
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
