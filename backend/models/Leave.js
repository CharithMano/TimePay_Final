const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'casual', 'personal', 'maternity', 'paternity', 'unpaid', 'emergency'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionDate: Date,
  approvalComments: String,
  rejectionReason: String,
  comments: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayPeriod: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  coveringEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  managerNotified: {
    type: Boolean,
    default: false
  },
  hrNotified: {
    type: Boolean,
    default: false
  },
  documents: [{
    name: String,
    url: String
  }],
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

leaveSchema.virtual('numberOfDays').get(function() {
  if (this.startDate && this.endDate) {
    const diff = this.endDate - this.startDate;
    let days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    
    if (this.isHalfDay && this.startDate.getTime() === this.endDate.getTime()) {
      days = 0.5;
    }
    
    return days;
  }
  return 0;
});

leaveSchema.methods.calculateBusinessDays = function() {
  if (!this.startDate || !this.endDate) return 0;
  
  let count = 0;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  if (this.isHalfDay && this.startDate.getTime() === this.endDate.getTime()) {
    count = 0.5;
  }
  
  return count;
};

module.exports = mongoose.model('Leave', leaveSchema);