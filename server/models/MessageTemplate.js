const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  low: {
    type: String,
    default: '您的消费状况良好，请继续保持理性消费习惯。'
  },
  medium: {
    type: String,
    default: '本月消费状况可控，但已接近预算阈值，建议适当控制支出。'
  },
  high: {
    type: String,
    default: '本月消费过高，已严重超出预算，请立即调整消费行为，避免财务风险。'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
