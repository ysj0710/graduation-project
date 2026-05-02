const mongoose = require('mongoose');

const userConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 预算设置
  budget: {
    monthly: {
      type: Number,
      default: 5000
    },
    yearly: {
      type: Number,
      default: 60000
    },
    alertThreshold: {
      type: Number,
      default: 80  // 百分比，默认80%预警
    }
  },
  // 主题设置
  theme: {
    background: {
      type: String,
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
    },
    primaryColor: {
      type: String,
      default: '#007AFF'
    },
    glassBlur: {
      type: Number,
      default: 20
    },
    pattern: {
      type: String,
      default: 'dots'  // dots, waves, stars, grid, rays, circuit, petals, cloud, leaves, none
    },
    presetId: {
      type: String,
      default: 'aurora'  // 主题预设ID
    },
    customBgUrl: {
      type: String,
      default: ''  // 用户自定义背景图片URL
    }
  },
  // 通知设置
  notification: {
    budgetAlert: {
      type: Boolean,
      default: true
    },
    riskAlert: {
      type: Boolean,
      default: true
    },
    systemAlert: {
      type: Boolean,
      default: true
    }
  },
  // 财务健康评分（由系统计算）
  financialHealth: {
    score: {
      type: Number,
      default: 100  // 0-100分
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时自动更新 updatedAt
userConfigSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

userConfigSchema.index({ 'financialHealth.riskLevel': 1 }); // 风险等级查询

module.exports = mongoose.model('UserConfig', userConfigSchema);
