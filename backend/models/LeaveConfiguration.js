const mongoose = require('mongoose');

const leaveConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['annual', 'sick', 'casual', 'personal', 'maternity', 'paternity', 'unpaid', 'emergency']
  },
  maxDaysPerYear: {
    type: Number,
    required: true
  },
  maxConsecutiveDays: {
    type: Number,
    default: null
  },
  carryForwardAllowed: {
    type: Boolean,
    default: false
  },
  maxCarryForwardDays: {
    type: Number,
    default: 0
  },
  requiresApproval: {
    type: Boolean,
    default: true
  },
  minimumNoticeDays: {
    type: Number,
    default: 1
  },
  documentRequired: {
    type: Boolean,
    default: false
  },
  allowHalfDay: {
    type: Boolean,
    default: true
  },
  allowBackdating: {
    type: Boolean,
    default: false
  },
  maxBackdatingDays: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  applicablePositions: [{
    type: String,
    enum: ['salesman', 'driver', 'supervisor', 'cleaner', 'security', 'cashier', 'manager', 'accountant', 'admin', 'other', 'all']
  }],
  applicableEmploymentTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern', 'all']
  }],
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveConfiguration', leaveConfigurationSchema);