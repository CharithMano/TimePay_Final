const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  allowances: [{
    name: String,
    type: {
      type: String,
      enum: ['fixed', 'percentage']
    },
    amount: Number,
    calculatedAmount: Number
  }],
  deductions: [{
    name: String,
    type: {
      type: String,
      enum: ['fixed', 'percentage']
    },
    amount: Number,
    calculatedAmount: Number
  }],
  bonus: {
    type: Number,
    default: 0
  },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 1.5 },
    amount: { type: Number, default: 0 }
  },
  epf: {
    employeeContribution: { type: Number, default: 0 },
    employeePercentage: { type: Number, default: 8 },
    employerContribution: { type: Number, default: 0 },
    employerPercentage: { type: Number, default: 12 },
    totalContribution: { type: Number, default: 0 }
  },
  etf: {
    employerContribution: { type: Number, default: 0 },
    percentage: { type: Number, default: 3 }
  },
  tax: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'online'],
    default: 'bank_transfer'
  },
  paymentReference: String,
  payslipUrl: String,
  workingDays: Number,
  presentDays: Number,
  absentDays: Number,
  leaveDays: Number,
  holidays: Number,
  weekends: Number,
  regularHours: Number,
  overtimeHours: Number,
  lateDeductions: {
    minutes: Number,
    amount: Number
  },
  earlyLeaveDeductions: {
    minutes: Number,
    amount: Number
  },
  leaveDeductions: {
    unpaidDays: Number,
    amount: Number
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
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

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

payrollSchema.pre('save', function(next) {
  // Calculate allowances
  let totalAllowances = 0;
  this.allowances.forEach(allowance => {
    if (allowance.type === 'percentage') {
      allowance.calculatedAmount = (this.baseSalary * allowance.amount) / 100;
    } else {
      allowance.calculatedAmount = allowance.amount;
    }
    totalAllowances += allowance.calculatedAmount;
  });

  // Calculate gross salary
  this.grossSalary = this.baseSalary + totalAllowances + this.bonus + this.overtime.amount;

  // Calculate EPF (on basic salary + allowances)
  const epfBase = this.baseSalary + totalAllowances;
  this.epf.employeeContribution = (epfBase * this.epf.employeePercentage) / 100;
  this.epf.employerContribution = (epfBase * this.epf.employerPercentage) / 100;
  this.epf.totalContribution = this.epf.employeeContribution + this.epf.employerContribution;

  // Calculate ETF (employer only)
  this.etf.employerContribution = (epfBase * this.etf.percentage) / 100;

  // Calculate deductions
  let totalDeductions = this.epf.employeeContribution;
  this.deductions.forEach(deduction => {
    if (deduction.type === 'percentage') {
      deduction.calculatedAmount = (this.baseSalary * deduction.amount) / 100;
    } else {
      deduction.calculatedAmount = deduction.amount;
    }
    totalDeductions += deduction.calculatedAmount;
  });

  // Add other deductions
  if (this.lateDeductions?.amount) totalDeductions += this.lateDeductions.amount;
  if (this.earlyLeaveDeductions?.amount) totalDeductions += this.earlyLeaveDeductions.amount;
  if (this.leaveDeductions?.amount) totalDeductions += this.leaveDeductions.amount;
  
  totalDeductions += this.tax;
  this.totalDeductions = totalDeductions;

  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);