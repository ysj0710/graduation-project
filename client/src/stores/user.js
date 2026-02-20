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
      background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
      primaryColor: '#007AFF'
    },
    budget: {
      monthly: 5000,
      alertThreshold: 80
    },
    categories: {
      income: [
        { id: 'salary', name: '工资', icon: '💰', color: '#34C759' },
        { id: 'bonus', name: '奖金', icon: '🎁', color: '#34C759' },
        { id: 'investment', name: '理财', icon: '📈', color: '#34C759' },
        { id: 'parttime', name: '兼职', icon: '💼', color: '#34C759' },
        { id: 'other_income', name: '其他', icon: '💵', color: '#34C759' }
      ],
      expense: [
        { id: 'food', name: '餐饮', icon: '🍜', color: '#FF3B30' },
        { id: 'transport', name: '交通', icon: '🚗', color: '#FF9500' },
        { id: 'shopping', name: '购物', icon: '🛍️', color: '#007AFF' },
        { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#AF52DE' },
        { id: 'housing', name: '住房', icon: '🏠', color: '#34C759' },
        { id: 'medical', name: '医疗', icon: '💊', color: '#FF2D55' },
        { id: 'education', name: '教育', icon: '📚', color: '#5856D6' },
        { id: 'other_expense', name: '其他', icon: '📦', color: '#8E8E93' }
      ]
    }
  }),

  actions: {
    async fetchProfile() {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          this.profile = {
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

    async addRecord(record) {
      const response = await api.post('/transactions', record)
      return response.data
    },

    updateTheme(theme) {
      this.theme = { ...this.theme, ...theme }
      localStorage.setItem('user_theme', JSON.stringify(this.theme))
    },

    updateBudget(budget) {
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
