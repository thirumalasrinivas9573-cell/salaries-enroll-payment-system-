const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    entity: {
      type: String,
      required: true,
      index: true
    },
    entity_id: {
      type: String
    },
    user_id: {
      type: String
    },
    user_name: {
      type: String,
      default: 'System User'
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ip_address: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
