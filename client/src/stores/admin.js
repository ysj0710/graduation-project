import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 添加 token 到请求头
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const useAdminStore = defineStore('admin', {
  state: () => ({
    // 菜单状态
    expandedMenus: ['user', 'finance'],
    
    // 用户数据
    userList: [],
    userTotal: 0,
    selectedUsers: [],
    
    // 统计数据
    statistics: {
      totalUsers: 0,
      activeUsers: 0,
      riskUsers: 0,
      newUsersToday: 0
    },
    
    // 风险数据
    riskDistribution: {
      low: 0,
      medium: 0,
      high: 0
    },
    highRiskUsers: [],
    
    // 筛选条件
    filters: {
      status: '',
      search: '',
      dateRange: []
    },
    
    // 分页
    pagination: {
      current: 1,
      size: 10,
      total: 0
    }
  }),
  
  actions: {
    // 菜单操作
    toggleMenu(menuId) {
      const idx = this.expandedMenus.indexOf(menuId)
      if (idx > -1) {
        this.expandedMenus.splice(idx, 1)
      } else {
        this.expandedMenus.push(menuId)
      }
    },
    
    // 获取用户列表
    async fetchUserList() {
      try {
        const params = {
          page: this.pagination.current,
          pageSize: this.pagination.size,
          search: this.filters.search,
          status: this.filters.status
        }
        const res = await api.get('/admin/users', { params })
        this.userList = res.data.users || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('获取用户列表失败:', error)
      }
    },
    
    // 获取统计数据
    async fetchStatistics() {
      try {
        const res = await api.get('/admin/statistics')
        this.statistics = res.data
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },
    
    // 获取风险数据
    async fetchRiskData() {
      try {
        const res = await api.get('/admin/risk-distribution')
        this.riskDistribution = res.data.distribution
        this.highRiskUsers = res.data.highRiskUsers || []
      } catch (error) {
        console.error('获取风险数据失败:', error)
      }
    },
    
    // 删除用户
    async deleteUser(userId) {
      try {
        await api.delete(`/admin/users/${userId}`)
        await this.fetchUserList()
        return true
      } catch (error) {
        console.error('删除用户失败:', error)
        return false
      }
    },
    
    // 发送提醒
    async sendAlert(userId, message) {
      try {
        await api.post('/admin/send-alert', { userId, message })
        return true
      } catch (error) {
        console.error('发送提醒失败:', error)
        return false
      }
    },
    
    // 批量操作
    async batchOperation(type, userIds) {
      try {
        await api.post('/admin/users/batch', { type, userIds })
        await this.fetchUserList()
        return true
      } catch (error) {
        console.error('批量操作失败:', error)
        return false
      }
    }
  }
})
