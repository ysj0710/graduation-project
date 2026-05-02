import { defineStore } from 'pinia'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: 'https://ysj0710.xyz/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：token 过期或无权限时自动退出
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('username')
      localStorage.removeItem('user_theme')
      localStorage.removeItem('user_budget')
      localStorage.removeItem('user_category_colors')
      ElMessage.warning('登录已过期，请重新登录')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    }
    return Promise.reject(error)
  }
)

export const useUserStore = defineStore('user', {
  state: () => {
    // 从本地读取主题设置
    let savedTheme = {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      primaryColor: '#667eea',
      glassBlur: 20,
      pattern: 'dots',
      presetId: 'aurora',
      customBgUrl: ''
    }

    try {
      const localTheme = localStorage.getItem('user_theme')
      if (localTheme) {
        savedTheme = { ...savedTheme, ...JSON.parse(localTheme) }
      }
    } catch (e) {
      console.error('Parse theme error:', e)
    }

    // 从本地读取用户信息（防止刷新后丢失）
    let savedProfile = { id: '', username: '', nickname: '', avatar: '', email: '' }
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        savedProfile = {
          id: user._id || user.id,
          username: user.username,
          nickname: user.nickname || user.username,
          avatar: user.avatar || '',
          email: user.email
        }
      }
    } catch (e) {
      console.error('Parse user error:', e)
    }

    // 从本地读取预算设置
    let savedBudget = { monthly: 5000, yearly: 60000, alertThreshold: 80 }
    try {
      const localBudget = localStorage.getItem('user_budget')
      if (localBudget) {
        savedBudget = { ...savedBudget, ...JSON.parse(localBudget) }
      }
    } catch (e) {
      console.error('Parse budget error:', e)
    }

    // 从本地读取分类颜色缓存
    let savedColorCache = {}
    try {
      const saved = localStorage.getItem('user_category_colors')
      if (saved) savedColorCache = JSON.parse(saved)
    } catch (e) { /* ignore */ }

    return {
      profile: savedProfile,
      theme: savedTheme,
      budget: savedBudget,
      _categoryColorCache: savedColorCache,
      categories: {
        income: [
          { id: 'salary', name: '工资', color: '#34C759' },
          { id: 'bonus', name: '奖金', color: '#34C759' },
          { id: 'investment', name: '理财', color: '#34C759' },
          { id: 'parttime', name: '兼职', color: '#34C759' },
          { id: 'other_income', name: '其他', color: '#34C759' }
        ],
        expense: [
          { id: 'food', name: '餐饮', color: '#FF3B30' },
          { id: 'transport', name: '交通', color: '#FF9500' },
          { id: 'shopping', name: '购物', color: '#007AFF' },
          { id: 'entertainment', name: '娱乐', color: '#AF52DE' },
          { id: 'housing', name: '住房', color: '#34C759' },
          { id: 'medical', name: '医疗', color: '#FF2D55' },
          { id: 'education', name: '教育', color: '#5856D6' },
          { id: 'phone', name: '通讯', color: '#F59E0B' },
          { id: 'other_expense', name: '其他', color: '#8E8E93' }
        ]
      }
    }
  },

  actions: {
    async fetchProfile() {
      try {
        // 并行获取用户信息和设置
        const [profileRes, settingsRes] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/user/settings')
        ]);

        // 处理用户信息
        if (profileRes.status === 'fulfilled') {
          const userData = profileRes.value.data.user;
          localStorage.setItem('user', JSON.stringify(userData));
          this.profile = {
            id: userData._id || userData.id,
            username: userData.username,
            nickname: userData.nickname || userData.username,
            avatar: userData.avatar || '',
            email: userData.email
          };
        } else {
          // 从本地存储恢复
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            this.profile = {
              id: user._id || user.id,
              username: user.username,
              nickname: user.nickname || user.username,
              avatar: user.avatar || '',
              email: user.email
            };
          }
        }

        // 处理设置信息
        if (settingsRes.status === 'fulfilled') {
          const settings = settingsRes.value.data.settings || {};
          this.applyThemeSettings(settings);
          if (settings.budget) {
            this.budget = { ...this.budget, ...settings.budget };
            localStorage.setItem('user_budget', JSON.stringify(this.budget));
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    },

    async fetchCategories() {
      try {
        const response = await api.get('/user/categories')
        const cats = response.data.categories || []
        this.categories.expense = cats
          .filter(c => c.type === 'expense')
          .map(c => ({ id: c.iconId || c.name, name: c.name, color: c.color }))
        this.categories.income = cats
          .filter(c => c.type === 'income')
          .map(c => ({ id: c.iconId || c.name, name: c.name, color: c.color }))
        // 构建分类颜色缓存，供 getCategoryColor 使用
        const colorMap = {}
        cats.forEach(c => { colorMap[c.name] = c.color })
        this._categoryColorCache = colorMap
        localStorage.setItem('user_category_colors', JSON.stringify(colorMap))
      } catch (error) {
        console.error('[fetchCategories] 获取分类失败:', error)
        // 失败时尝试从 localStorage 恢复
        try {
          const saved = localStorage.getItem('user_category_colors')
          if (saved) this._categoryColorCache = JSON.parse(saved)
        } catch (e) { /* ignore */ }
      }
    },

    getCategoryColor(category) {
      const cache = this._categoryColorCache || {}
      const result = cache[category] || (() => {
        const defaults = {
          '餐饮': '#EF4444', '交通': '#F97316', '购物': '#6366F1', '娱乐': '#8B5CF6',
          '医疗': '#F43F5E', '教育': '#5856D6', '住房': '#EC4899', '通讯': '#14B8A6',
          '其他': '#8E8E93', '生活缴费': '#F97316', '保险': '#14B8A6', '充值': '#6366F1',
          '日用百货': '#8B5CF6', '运动户外': '#EC4899', '其他支出': '#8E8E93',
          '工资': '#10B981', '奖金': '#34D399', '理财': '#6EE7D0', '兼职': '#A7F3D0', '其他收入': '#10B981'
        }
        return defaults[category] || '#8E8E93'
      })()
      return result
    },

    async addRecord(record) {
      const response = await api.post('/transactions', record)
      return response.data
    },

    updateTheme(theme) {
      this.theme = { ...this.theme, ...theme }
      localStorage.setItem('user_theme', JSON.stringify(this.theme))
    },

    // 从API加载主题设置
    applyThemeSettings(settings) {
      const theme = settings.theme || {}
      const fullTheme = {
        background: theme.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        primaryColor: theme.primaryColor || '#667eea',
        glassBlur: theme.glassBlur || 20,
        pattern: theme.pattern || 'dots',
        presetId: theme.presetId || 'aurora',
        customBgUrl: theme.customBgUrl || ''
      }
      this.theme = fullTheme
      localStorage.setItem('user_theme', JSON.stringify(fullTheme))
    },

    updateBudget(budget) {
      this.budget = { ...this.budget, ...budget }
      localStorage.setItem('user_budget', JSON.stringify(this.budget))
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
