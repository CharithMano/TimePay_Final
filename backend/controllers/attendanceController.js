const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');
const moment = require('moment');

exports.clockIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).populate('employmentInfo.branch');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = moment().startOf('day');
    
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
    });

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    const clockInTime = new Date();
    const attendance = existingAttendance || new Attendance({
      employee: employee._id,
      branch: employee.employmentInfo.branch._id,
      date: today.toDate()
    });

    attendance.clockIn = clockInTime;
    attendance.status = 'present';
    attendance.workType = req.body.workType || 'office';

    // Calculate if late (assuming 9 AM start time)
    const expectedStartTime = moment(today).hour(9).minute(0);
    if (moment(clockInTime).isAfter(expectedStartTime)) {
      attendance.lateMinutes = moment(clockInTime).diff(expectedStartTime, 'minutes');
    }
    
    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Clocked in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({ error: 'No clock in found for today' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }

    const clockOutTime = new Date();
    attendance.clockOut = clockOutTime;
    attendance.breakTime = req.body.breakTime || 60; // 60 minutes default break

    // Calculate early leave (assuming 6 PM end time)
    const expectedEndTime = moment(today).hour(18).minute(0);
    if (moment(clockOutTime).isBefore(expectedEndTime)) {
      attendance.earlyLeaveMinutes = expectedEndTime.diff(moment(clockOutTime), 'minutes');
    }

    // Calculate work hours
    const standardWorkHours = employee.employmentInfo.workingHoursPerDay || 8;
    const workHours = attendance.calculateWorkHours(standardWorkHours);
    
    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Clocked out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { startDate, endDate, month, year } = req.query;
    
    let query = { employee: employee._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = moment().year(year).month(month - 1).startOf('month');
      const end = moment().year(year).month(month - 1).endOf('month');
      query.date = {
        $gte: start.toDate(),
        $lte: end.toDate()
      };
    }

    const attendance = await Attendance.find(query)
      .populate('branch', 'name')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      leaveDays: attendance.filter(a => a.status === 'on-leave').length,
      totalRegularHours: attendance.reduce((sum, a) => sum + (a.regularHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      totalLateMinutes: attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0),
      totalEarlyLeaveMinutes: attendance.reduce((sum, a) => sum + (a.earlyLeaveMinutes || 0), 0)
    };

    res.json({
      success: true,
      data: {
        attendance,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
    }).populate('branch', 'name');

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department, branchId, status } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (employeeId) {
      query.employee = employeeId;
    }

    if (branchId) {
      query.branch = branchId;
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('branch', 'name')
      .sort({ date: -1 });

    let filteredAttendance = attendance;
    
    if (department) {
      filteredAttendance = attendance.filter(a => 
        a.employee?.employmentInfo?.department === department
      );
    }

    res.json({
      success: true,
      data: filteredAttendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    let query = { employee: req.params.employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = moment().year(year).month(month - 1).startOf('month');
      const end = moment().year(year).month(month - 1).endOf('month');
      query.date = {
        $gte: start.toDate(),
        $lte: end.toDate()
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'personalInfo employmentInfo')
      .populate('branch', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, clockIn, clockOut, notes, breakTime } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const attendanceDate = moment(date).startOf('day').toDate();
    
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate
    });

    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already marked for this date' });
    }

    const attendance = new Attendance({
      employee: employeeId,
      branch: employee.employmentInfo.branch,
      date: attendanceDate,
      status,
      clockIn: clockIn ? new Date(clockIn) : null,
      clockOut: clockOut ? new Date(clockOut) : null,
      breakTime: breakTime || 60,
      notes,
      approvedBy: req.user._id
    });

    // Calculate work hours if both clock times are provided
    if (clockIn && clockOut) {
      const standardWorkHours = employee.employmentInfo.workingHoursPerDay || 8;
      attendance.calculateWorkHours(standardWorkHours);
    }

    await attendance.save();

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Update fields
    Object.assign(attendance, req.body);
    attendance.approvedBy = req.user._id;

    // Recalculate work hours if clock times are updated
    if (attendance.clockIn && attendance.clockOut) {
      const employee = await Employee.findById(attendance.employee);
      const standardWorkHours = employee.employmentInfo.workingHoursPerDay || 8;
      attendance.calculateWorkHours(standardWorkHours);
    }

    await attendance.save();

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { month, year, branchId, department } = req.query;
    
    const startDate = moment().year(year).month(month - 1).startOf('month');
    const endDate = moment().year(year).month(month - 1).endOf('month');

    let matchQuery = {
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    };

    if (branchId) {
      matchQuery.branch = branchId;
    }

    const attendance = await Attendance.find(matchQuery)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('branch', 'name');

    let filteredAttendance = attendance;
    
    if (department) {
      filteredAttendance = attendance.filter(a => 
        a.employee?.employmentInfo?.department === department
      );
    }

    const report = {};
    
    filteredAttendance.forEach(record => {
      const employeeId = record.employee._id.toString();
      
      if (!report[employeeId]) {
        report[employeeId] = {
          employee: record.employee,
          branch: record.branch,
          present: 0,
          absent: 0,
          'half-day': 0,
          'on-leave': 0,
          holiday: 0,
          weekend: 0,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalLateMinutes: 0,
          totalEarlyLeaveMinutes: 0,
          workingDays: 0
        };
      }
      
      if (record.status) {
        report[employeeId][record.status]++;
      }
      
      if (record.status === 'present') {
        report[employeeId].workingDays++;
      }
      
      report[employeeId].totalRegularHours += record.regularHours || 0;
      report[employeeId].totalOvertimeHours += record.overtimeHours || 0;
      report[employeeId].totalLateMinutes += record.lateMinutes || 0;
      report[employeeId].totalEarlyLeaveMinutes += record.earlyLeaveMinutes || 0;
    });

    res.json({
      success: true,
      data: Object.values(report)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBranchAttendanceStats = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? moment(date).startOf('day') : moment().startOf('day');
    
    const attendance = await Attendance.find({
      branch: branchId,
      date: {
        $gte: targetDate.toDate(),
        $lt: targetDate.clone().endOf('day').toDate()
      }
    }).populate('employee', 'personalInfo employmentInfo');

    const stats = {
      totalEmployees: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      onLeave: attendance.filter(a => a.status === 'on-leave').length,
      late: attendance.filter(a => a.lateMinutes > 0).length,
      overtime: attendance.filter(a => a.overtimeHours > 0).length,
      avgRegularHours: attendance.reduce((sum, a) => sum + (a.regularHours || 0), 0) / attendance.length || 0,
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const { month, year, branchId } = req.query;
    
    let matchQuery = {};
    
    if (month && year) {
      const startDate = moment().year(year).month(month - 1).startOf('month');
      const endDate = moment().year(year).month(month - 1).endOf('month');
      matchQuery.date = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      };
    }
    
    if (branchId) {
      matchQuery.branch = branchId;
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          leaveCount: {
            $sum: { $cond: [{ $eq: ['$status', 'on-leave'] }, 1, 0] }
          },
          totalRegularHours: { $sum: '$regularHours' },
          totalOvertimeHours: { $sum: '$overtimeHours' },
          totalLateMinutes: { $sum: '$lateMinutes' },
          avgRegularHours: { $avg: '$regularHours' },
          avgOvertimeHours: { $avg: '$overtimeHours' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalLateMinutes: 0,
        avgRegularHours: 0,
        avgOvertimeHours: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};