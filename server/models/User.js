const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  nickname: {
    type: String,
    default: ''
  },
  avatar: {
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

userSchema.index({ role: 1, createdAt: -1 }); // 管理员按角色+创建时间查询
userSchema.index({ isActive: 1 }); // 按状态筛选

module.exports = mongoose.model('User', userSchema);
