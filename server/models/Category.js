const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  iconId: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#6366F1'
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

categorySchema.index({ type: 1, sortOrder: 1 }); // 按类型+排序查询

module.exports = mongoose.model('Category', categorySchema);
