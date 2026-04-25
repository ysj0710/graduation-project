const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OperationLog', operationLogSchema);
