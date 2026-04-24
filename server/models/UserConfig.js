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
    glassBlur: {
      type: Number,
      default: 20
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
userConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserConfig', userConfigSchema);
