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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
