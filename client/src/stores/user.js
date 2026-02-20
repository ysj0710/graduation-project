import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: {
      id: '',
      username: '',
      nickname: '',
      avatar: '',
      email: ''
    },
    theme: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      primaryColor: '#10B981'
    },
    budget: {
      monthly: 5000,
      alertThreshold: 80
    },
    statistics: {
      monthlyIncome: 0,
      monthlyExpense: 0,
      balance: 0
    },
    recentRecords: [],
    categories: {
      income: [
        { id: 'salary', name: '工资', icon: '💰', color: '#10B981' },
        { id: 'bonus', name: '奖金', icon: '🎁', color: '#10B981' },
        { id: 'investment', name: '理财', icon: '📈', color: '#10B981' },
        { id: 'parttime', name: '兼职', icon: '💼', color: '#10B981' },
        { id: 'other_income', name: '其他', icon: '💵', color: '#10B981' }
      ],
      expense: [
        { id: 'food', name: '餐饮', icon: '🍜', color: '#EF4444' },
        { id: 'transport', name: '交通', icon: '🚗', color: '#EF4444' },
        { id: 'shopping', name: '购物', icon: '🛍️', color: '#EF4444' },
        { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#EF4444' },
        { id: 'housing', name: '住房', icon: '🏠', color: '#EF4444' },
        { id: 'medical', name: '医疗', icon: '💊', color: '#EF4444' },
        { id: 'education', name: '教育', icon: '📚', color: '#EF4444' },
        { id: 'other_expense', name: '其他', icon: '📦', color: '#EF4444' }
      ]
    }
  }),

  getters: {
    budgetPercent(state) {
      if (state.budget.monthly === 0) return 0
      return Math.round((state.statistics.monthlyExpense / state.budget.monthly) * 100)
    },
    budgetRemain(state) {
      return state.budget.monthly - state.statistics.monthlyExpense
    }
  },

  actions: {
    async fetchProfile() {
      try {
        // Mock profile data - replace with real API
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          this.profile = {
            ...this.profile,
            id: user._id || user.id,
            username: user.username,
            nickname: user.nickname || user.username,
            email: user.email
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    },

    async fetchDashboard() {
      try {
        const response = await api.get('/transactions/month-stats')
        this.statistics = {
          monthlyIncome: response.data.income || 0,
          monthlyExpense: response.data.expense || 0,
          balance: response.data.balance || 0
        }

        const recordsRes = await api.get('/transactions', {
          params: { pageSize: 10 }
        })
        this.recentRecords = this.formatRecords(recordsRes.data.transactions || [])
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      }
    },

    formatRecords(records) {
      return records.map(r => ({
        id: r._id,
        title: r.category,
        amount: r.amount,
        type: r.type,
        categoryIcon: this.getCategoryIcon(r.category, r.type),
        categoryColor: this.getCategoryColor(r.category, r.type),
        time: this.formatTime(r.date)
      }))
    },

    getCategoryIcon(category, type) {
      const cats = type === 'income' ? this.categories.income : this.categories.expense
      const found = cats.find(c => c.name === category)
      return found ? found.icon : '💰'
    },

    getCategoryColor(category, type) {
      return type === 'income' ? '#10B981' : '#EF4444'
    },

    formatTime(dateStr) {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      return `${date.getMonth() + 1}/${date.getDate()}`
    },

    async addRecord(record) {
      try {
        const response = await api.post('/transactions', record)
        await this.fetchDashboard()
        return response.data
      } catch (error) {
        throw error
      }
    },

    async updateTheme(theme) {
      this.theme = { ...this.theme, ...theme }
      localStorage.setItem('user_theme', JSON.stringify(this.theme))
    },

    async updateBudget(budget) {
      this.budget = { ...this.budget, ...budget }
    },

    async fetchStatistics(range = 'month') {
      try {
        const response = await api.get('/transactions/statistics', {
          params: { range }
        })
        return response.data
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
        return {}
      }
    }
  }
})
