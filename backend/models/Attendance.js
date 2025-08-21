const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    type: Date
  },
  clockOut: {
    type: Date
  },
  breakTime: {
    type: Number,
    default: 0
  },
  regularHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'holiday', 'weekend', 'on-leave'],
    default: 'present'
  },
  workType: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
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

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('totalHours').get(function() {
  if (this.clockIn && this.clockOut) {
    const diff = this.clockOut - this.clockIn;
    const hours = diff / (1000 * 60 * 60) - (this.breakTime / 60);
    return Math.round(hours * 100) / 100;
  }
  return 0;
});

attendanceSchema.methods.calculateWorkHours = function(standardWorkHours = 8) {
  if (!this.clockIn || !this.clockOut) return;
  
  const totalHours = this.totalHours;
  
  if (totalHours <= standardWorkHours) {
    this.regularHours = totalHours;
    this.overtimeHours = 0;
  } else {
    this.regularHours = standardWorkHours;
    this.overtimeHours = totalHours - standardWorkHours;
  }
  
  return {
    regularHours: this.regularHours,
    overtimeHours: this.overtimeHours,
    totalHours: totalHours
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);