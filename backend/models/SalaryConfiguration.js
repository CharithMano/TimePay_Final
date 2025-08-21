const mongoose = require('mongoose');

const salaryConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    enum: ['salesman', 'driver', 'supervisor', 'cleaner', 'security', 'cashier', 'manager', 'accountant', 'admin', 'other']
  },
  level: {
    type: String,
    required: true,
    enum: ['junior', 'mid', 'senior', 'lead', 'manager']
  },
  baseSalaryRange: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  allowances: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    mandatory: {
      type: Boolean,
      default: false
    }
  }],
  deductions: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    mandatory: {
      type: Boolean,
      default: false
    }
  }],
  epfApplicable: {
    type: Boolean,
    default: true
  },
  etfApplicable: {
    type: Boolean,
    default: true
  },
  overtimeEligible: {
    type: Boolean,
    default: true
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
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

module.exports = mongoose.model('SalaryConfiguration', salaryConfigurationSchema);