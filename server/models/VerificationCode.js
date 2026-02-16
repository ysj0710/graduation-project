const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'resetPassword'],
    default: 'register'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 自动删除过期的验证码
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
