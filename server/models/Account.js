const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['cash', 'bank', 'alipay', 'wechat', 'other'],
    default: 'other'
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#007AFF'
  },
  balance: {
    type: Number,
    default: 0
  },
  remark: {
    type: String,
    default: ''
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

// 移除 pre hook，让 Mongoose default 处理
module.exports = mongoose.model('Account', accountSchema);
