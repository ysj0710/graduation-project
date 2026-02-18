<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: #dbeafe; color: #3b82f6;">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-800">{{ statistics.totalUsers }}</div>
          <div class="text-sm text-gray-500 mt-1">总用户数</div>
          <div class="text-xs text-green-500 mt-1">↑ {{ statistics.newUsersToday }} 本周新增</div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: #d1fae5; color: #10b981;">
          <el-icon :size="24"><Check /></el-icon>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-800">{{ statistics.activeUsers }}</div>
          <div class="text-sm text-gray-500 mt-1">活跃用户</div>
          <div class="text-xs text-green-500 mt-1">{{ activeRate }}% 活跃度</div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: #fee2e2; color: #ef4444;">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-800">{{ statistics.riskUsers }}</div>
          <div class="text-sm text-gray-500 mt-1">风险用户</div>
          <div class="text-xs text-red-500 mt-1">需关注</div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: #fef3c7; color: #f59e0b;">
          <el-icon :size="24"><Plus /></el-icon>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-800">+{{ statistics.newUsersToday }}</div>
          <div class="text-sm text-gray-500 mt-1">今日新增</div>
          <div class="text-xs text-green-500 mt-1">较昨日 ↑{{ statistics.newUsersToday }}</div>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h3 class="text-base font-semibold text-gray-700 mb-4">用户增长趋势</h3>
        <div class="h-72 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          图表占位区
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h3 class="text-base font-semibold text-gray-700 mb-4">平台消费统计</h3>
        <div class="h-72 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          图表占位区
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { User, Check, Warning, Plus } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const loading = ref(false)

const statistics = computed(() => adminStore.statistics)

const activeRate = computed(() => {
  if (statistics.value.totalUsers === 0) return 0
  return Math.round((statistics.value.activeUsers / statistics.value.totalUsers) * 100)
})

onMounted(async () => {
  loading.value = true
  await adminStore.fetchStatistics()
  loading.value = false
})
</script>

<style scoped>
</style>
