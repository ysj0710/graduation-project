<template>
  <div class="user-list-page">
    <!-- 筛选栏 -->
    <div class="flex gap-3 mb-5">
      <el-select 
        v-model="adminStore.filters.status" 
        placeholder="用户状态" 
        clearable 
        @change="handleFilterChange"
        class="w-40"
      >
        <el-option label="全部" value="" />
        <el-option label="正常" value="normal" />
        <el-option label="低风险" value="low" />
        <el-option label="中风险" value="medium" />
        <el-option label="高风险" value="high" />
        <el-option label="已注销" value="inactive" />
      </el-select>
      
      <el-input 
        v-model="adminStore.filters.search" 
        placeholder="搜索用户名/邮箱"
        prefix-icon="Search"
        clearable
        class="w-60"
        @input="handleSearch"
      />
      
      <el-button type="primary" @click="openAddDialog">+ 新增用户</el-button>
      <el-button @click="exportData">导出数据</el-button>
    </div>
    
    <!-- 数据表格 -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <el-table 
        :data="adminStore.userList" 
        v-loading="loading"
        class="w-full"
      >
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="40" style="background: #10B981;">
                {{ row.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <div>
                <div class="font-medium text-gray-800">{{ row.username }}</div>
                <div class="text-xs text-gray-500">{{ row.email || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'warning' : 'success'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLogin ? formatDate(row.lastLogin) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive !== false ? 'success' : 'info'" size="small">
              {{ row.isActive !== false ? '正常' : '已注销' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editUser(row)">编辑</el-button>
            <el-dropdown trigger="click">
              <el-button link size="small">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="sendReminder(row)">发送提醒</el-dropdown-item>
                  <el-dropdown-item @click="resetPassword(row)">重置密码</el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)" class="text-red-500">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="mt-5 flex justify-end">
      <el-pagination
        v-model:current-page="adminStore.pagination.current"
        v-model:page-size="adminStore.pagination.size"
        :total="adminStore.pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const loading = ref(false)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleFilterChange = async () => {
  adminStore.pagination.current = 1
  await fetchData()
}

const handleSearch = async () => {
  adminStore.pagination.current = 1
  await fetchData()
}

const handleSizeChange = async () => {
  await fetchData()
}

const handleCurrentChange = async () => {
  await fetchData()
}

const fetchData = async () => {
  loading.value = true
  await adminStore.fetchUserList()
  loading.value = false
}

const openAddDialog = () => {
  ElMessage.info('新增用户功能开发中')
}

const editUser = (row) => {
  ElMessage.info('编辑用户功能开发中')
}

const sendReminder = async (row) => {
  const success = await adminStore.sendAlert(row._id, '系统提醒')
  if (success) {
    ElMessage.success('提醒已发送')
  }
}

const resetPassword = (row) => {
  ElMessage.info('重置密码功能开发中')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const success = await adminStore.deleteUser(row._id)
    if (success) {
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

const exportData = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
</style>
