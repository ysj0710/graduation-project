const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  systemName: {
    type: String,
    default: '随手记'
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  defaultBudget: {
    type: Number,
    default: 5000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
