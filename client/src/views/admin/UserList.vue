<template>
  <div class="user-list-page">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索用户..." 
          class="search-input"
        />
      </div>
      <el-button type="primary" @click="$router.push('/admin/users-add')">
        + 新增用户
      </el-button>
    </div>

    <!-- 用户表格 -->
    <div class="ios-card">
      <div class="table-header">
        <span>用户信息</span>
        <span>预算设置</span>
        <span>本月消费</span>
        <span>风险等级</span>
        <span>操作</span>
      </div>
      <div class="table-row" v-for="user in filteredUsers" :key="user.id">
        <div class="user-cell">
          <el-avatar :size="40" :style="{ background: user.avatarColor }">
            {{ user.name.charAt(0) }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>
        <span>¥{{ formatNumber(user.budget) }}</span>
        <span :class="{ 'expense': user.spent > user.budget * 0.8 }">
          ¥{{ formatNumber(user.spent) }}
        </span>
        <span :class="['risk-badge', user.riskLevel]">{{ user.riskLabel }}</span>
        <div class="action-btns">
          <el-button size="small" @click="viewDetail(user)">详情</el-button>
          <el-button size="small" @click="editUser(user)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteUser(user)">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(156)

const users = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', budget: 5000, spent: 3200, riskLevel: 'low', riskLabel: '低风险', avatarColor: '#007AFF' },
  { id: 2, name: '李四', email: 'lisi@example.com', budget: 3000, spent: 2800, riskLevel: 'high', riskLabel: '高风险', avatarColor: '#34C759' },
  { id: 3, name: '王五', email: 'wangwu@example.com', budget: 4000, spent: 3500, riskLevel: 'medium', riskLabel: '中风险', avatarColor: '#FF9500' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', budget: 6000, spent: 4100, riskLevel: 'low', riskLabel: '低风险', avatarColor: '#AF52DE' },
  { id: 5, name: '钱七', email: 'qianqi@example.com', budget: 3500, spent: 3400, riskLevel: 'high', riskLabel: '高风险', avatarColor: '#FF3B30' }
])

const filteredUsers = computed(() => {
  return users.value.filter(u => 
    u.name.includes(searchKeyword.value) || 
    u.email.includes(searchKeyword.value)
  )
})

const formatNumber = (num) => Number(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const viewDetail = (user) => {
  ElMessage.info(`查看用户 ${user.name} 详情`)
}

const editUser = (user) => {
  ElMessage.info(`编辑用户 ${user.name}`)
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${user.name} 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}
</script>

<style scoped>
.user-list-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input {
  width: 300px;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.search-input:focus {
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
}

.ios-card {
  background: white;
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 180px;
  padding: 16px 24px;
  background: #F5F5F7;
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 180px;
  padding: 16px 24px;
  border-bottom: 1px solid #F2F2F7;
  align-items: center;
  transition: background 0.2s;
}

.table-row:hover {
  background: #F9F9FB;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.user-email {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
}

.expense {
  color: #FF3B30;
  font-weight: 600;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.risk-badge.high { background: rgba(255, 59, 48, 0.15); color: #FF3B30; }
.risk-badge.medium { background: rgba(255, 149, 0, 0.15); color: #FF9500; }
.risk-badge.low { background: rgba(52, 199, 89, 0.15); color: #34C759; }

.action-btns {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
