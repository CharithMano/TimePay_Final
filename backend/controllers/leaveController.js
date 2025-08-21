const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const LeaveConfiguration = require('../models/LeaveConfiguration');
const Notification = require('../models/Notification');
const moment = require('moment');

exports.applyLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).populate('employmentInfo.branch');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { 
      leaveType, 
      startDate, 
      endDate, 
      reason, 
      isHalfDay = false, 
      halfDayPeriod, 
      priority = 'medium',
      coveringEmployee,
      documents = []
    } = req.body;

    // Check leave configuration
    const leaveConfig = await LeaveConfiguration.findOne({ 
      type: leaveType, 
      isActive: true,
      $or: [
        { applicablePositions: 'all' },
        { applicablePositions: employee.employmentInfo.position }
      ],
      $or: [
        { applicableEmploymentTypes: 'all' },
        { applicableEmploymentTypes: employee.employmentInfo.employmentType }
      ]
    });

    if (!leaveConfig) {
      return res.status(400).json({ 
        error: `Leave type ${leaveType} is not applicable for your position/employment type` 
      });
    }

    // Validate dates
    const start = moment(startDate);
    const end = moment(endDate);
    const today = moment();

    if (start.isAfter(end)) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // Check minimum notice period
    if (start.diff(today, 'days') < leaveConfig.minimumNoticeDays) {
      return res.status(400).json({ 
        error: `Minimum ${leaveConfig.minimumNoticeDays} days notice required for ${leaveType} leave` 
      });
    }

    // Check if backdating is allowed
    if (start.isBefore(today) && !leaveConfig.allowBackdating) {
      return res.status(400).json({ error: 'Backdating not allowed for this leave type' });
    }

    if (start.isBefore(today) && leaveConfig.allowBackdating) {
      const daysDiff = today.diff(start, 'days');
      if (daysDiff > leaveConfig.maxBackdatingDays) {
        return res.status(400).json({ 
          error: `Cannot backdate more than ${leaveConfig.maxBackdatingDays} days` 
        });
      }
    }

    // Calculate leave days
    const leave = new Leave({
      employee: employee._id,
      leaveType,
      startDate: start.toDate(),
      endDate: end.toDate(),
      reason,
      isHalfDay,
      halfDayPeriod,
      priority,
      coveringEmployee,
      documents
    });

    const leaveDays = isHalfDay ? 0.5 : leave.calculateBusinessDays();

    // Check leave balance
    const currentYear = today.year();
    const approvedLeaves = await Leave.find({
      employee: employee._id,
      leaveType,
      status: 'approved',
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });

    const leavesTaken = approvedLeaves.reduce((sum, l) => sum + (l.isHalfDay ? 0.5 : l.calculateBusinessDays()), 0);
    const availableLeave = (employee.leaveBalance[leaveType] || 0) - leavesTaken;

    if (leaveDays > availableLeave) {
      return res.status(400).json({ 
        error: `Insufficient leave balance. Available: ${availableLeave} days, Requested: ${leaveDays} days` 
      });
    }

    // Check maximum consecutive days
    if (leaveConfig.maxConsecutiveDays && leaveDays > leaveConfig.maxConsecutiveDays) {
      return res.status(400).json({ 
        error: `Maximum ${leaveConfig.maxConsecutiveDays} consecutive days allowed for ${leaveType} leave` 
      });
    }

    await leave.save();

    // Send notifications
    const managers = await Employee.find({
      $or: [
        { 'employmentInfo.branch': employee.employmentInfo.branch._id, 'employmentInfo.position': { $in: ['manager', 'supervisor'] } },
        { user: { $ne: null } }
      ]
    }).populate('user');

    const approvers = managers.filter(m => 
      m.user && ['admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'].includes(m.user.role)
    );

    for (const approver of approvers) {
      await new Notification({
        recipient: approver.user._id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName} has applied for ${leaveType} leave from ${start.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')}`,
        relatedTo: {
          model: 'Leave',
          id: leave._id
        }
      }).save();
    }

    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { status, year } = req.query;
    let query = { employee: employee._id };

    if (status) {
      query.status = status;
    }

    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31)
      };
    }

    const leaves = await Leave.find(query)
      .populate('approvedBy rejectedBy', 'email')
      .populate('coveringEmployee', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getLeaveBalance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const currentYear = new Date().getFullYear();
    
    const approvedLeaves = await Leave.find({
      employee: employee._id,
      status: 'approved',
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });

    const leavesTaken = {
      annual: 0,
      sick: 0,
      casual: 0,
      personal: 0,
      maternity: 0,
      paternity: 0,
      unpaid: 0
    };

    approvedLeaves.forEach(leave => {
      const days = leave.isHalfDay ? 0.5 : leave.calculateBusinessDays();
      if (leavesTaken.hasOwnProperty(leave.leaveType)) {
        leavesTaken[leave.leaveType] += days;
      }
    });

    const balance = {};
    Object.keys(employee.leaveBalance.toObject()).forEach(key => {
      if (key !== '_id') {
        balance[key] = Math.max(0, (employee.leaveBalance[key] || 0) - (leavesTaken[key] || 0));
      }
    });

    res.json({
      success: true,
      data: {
        balance,
        taken: leavesTaken,
        total: employee.leaveBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, employeeId, department, branchId, leaveType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (leaveType) query.leaveType = leaveType;

    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('approvedBy rejectedBy', 'email')
      .populate('coveringEmployee', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });

    let filteredLeaves = leaves;
    
    if (department) {
      filteredLeaves = leaves.filter(l => 
        l.employee?.employmentInfo?.department === department
      );
    }

    if (branchId) {
      filteredLeaves = filteredLeaves.filter(l => 
        l.employee?.employmentInfo?.branch?.toString() === branchId
      );
    }

    res.json({
      success: true,
      data: filteredLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const { branchId, department } = req.query;
    
    let query = { status: 'pending' };

    const leaves = await Leave.find(query)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('coveringEmployee', 'personalInfo.firstName personalInfo.lastName')
      .sort({ priority: 1, createdAt: 1 }); // Sort by priority then date

    let filteredLeaves = leaves;
    
    if (department) {
      filteredLeaves = leaves.filter(l => 
        l.employee?.employmentInfo?.department === department
      );
    }

    if (branchId) {
      filteredLeaves = filteredLeaves.filter(l => 
        l.employee?.employmentInfo?.branch?.toString() === branchId
      );
    }

    res.json({
      success: true,
      data: filteredLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'personalInfo user');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request already processed' });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvalDate = new Date();
    leave.approvalComments = req.body.comments;
    
    await leave.save();

    // Add to employee leave history
    const employee = await Employee.findById(leave.employee._id);
    employee.leaveHistory.push({
      type: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: leave.isHalfDay ? 0.5 : leave.calculateBusinessDays(),
      status: 'approved',
      approvedBy: req.user._id,
      reason: leave.reason,
      date: new Date()
    });
    await employee.save();

    await new Notification({
      recipient: leave.employee.user,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${leave.leaveType} leave request from ${moment(leave.startDate).format('DD/MM/YYYY')} to ${moment(leave.endDate).format('DD/MM/YYYY')} has been approved`,
      relatedTo: {
        model: 'Leave',
        id: leave._id
      }
    }).save();

    res.json({
      success: true,
      data: leave,
      message: 'Leave approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'personalInfo user');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request already processed' });
    }

    leave.status = 'rejected';
    leave.rejectedBy = req.user._id;
    leave.rejectionDate = new Date();
    leave.rejectionReason = req.body.reason || req.body.comments;
    
    await leave.save();

    // Add to employee leave history
    const employee = await Employee.findById(leave.employee._id);
    employee.leaveHistory.push({
      type: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: leave.isHalfDay ? 0.5 : leave.calculateBusinessDays(),
      status: 'rejected',
      approvedBy: req.user._id,
      reason: leave.reason,
      date: new Date()
    });
    await employee.save();

    await new Notification({
      recipient: leave.employee.user,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: `Your ${leave.leaveType} leave request from ${moment(leave.startDate).format('DD/MM/YYYY')} to ${moment(leave.endDate).format('DD/MM/YYYY')} has been rejected. Reason: ${leave.rejectionReason}`,
      relatedTo: {
        model: 'Leave',
        id: leave._id
      }
    }).save();

    res.json({
      success: true,
      data: leave,
      message: 'Leave rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.cancelLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    const leave = await Leave.findOne({
      _id: req.params.id,
      employee: employee._id
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status === 'cancelled') {
      return res.status(400).json({ error: 'Leave request already cancelled' });
    }

    if (leave.status === 'approved' && moment(leave.startDate).isBefore(moment())) {
      return res.status(400).json({ error: 'Cannot cancel leave that has already started' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      data: leave,
      message: 'Leave cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getEmployeeLeaves = async (req, res) => {
  try {
    const { year } = req.query;
    let query = { employee: req.params.employeeId };

    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31)
      };
    }

    const leaves = await Leave.find(query)
      .populate('approvedBy rejectedBy', 'email')
      .populate('coveringEmployee', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getLeaveConfigurations = async (req, res) => {
  try {
    const configurations = await LeaveConfiguration.find({ isActive: true })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createLeaveConfiguration = async (req, res) => {
  try {
    const configuration = new LeaveConfiguration(req.body);
    await configuration.save();

    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Leave configuration created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateLeaveConfiguration = async (req, res) => {
  try {
    const configuration = await LeaveConfiguration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!configuration) {
      return res.status(404).json({ error: 'Leave configuration not found' });
    }

    res.json({
      success: true,
      data: configuration,
      message: 'Leave configuration updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getLeaveStats = async (req, res) => {
  try {
    const { year, month, branchId, department } = req.query;
    
    let matchQuery = {};
    
    if (year) {
      if (month) {
        const start = moment().year(year).month(month - 1).startOf('month');
        const end = moment().year(year).month(month - 1).endOf('month');
        matchQuery.startDate = {
          $gte: start.toDate(),
          $lte: end.toDate()
        };
      } else {
        matchQuery.startDate = {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31)
        };
      }
    }

    const leaves = await Leave.find(matchQuery)
      .populate('employee', 'employmentInfo');

    let filteredLeaves = leaves;
    
    if (department) {
      filteredLeaves = leaves.filter(l => 
        l.employee?.employmentInfo?.department === department
      );
    }

    if (branchId) {
      filteredLeaves = filteredLeaves.filter(l => 
        l.employee?.employmentInfo?.branch?.toString() === branchId
      );
    }

    const stats = {
      totalRequests: filteredLeaves.length,
      pending: filteredLeaves.filter(l => l.status === 'pending').length,
      approved: filteredLeaves.filter(l => l.status === 'approved').length,
      rejected: filteredLeaves.filter(l => l.status === 'rejected').length,
      cancelled: filteredLeaves.filter(l => l.status === 'cancelled').length,
      byType: {}
    };

    // Group by leave type
    filteredLeaves.forEach(leave => {
      const type = leave.leaveType;
      if (!stats.byType[type]) {
        stats.byType[type] = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalDays: 0
        };
      }
      stats.byType[type].total++;
      stats.byType[type][leave.status]++;
      
      if (leave.status === 'approved') {
        stats.byType[type].totalDays += leave.isHalfDay ? 0.5 : leave.calculateBusinessDays();
      }
    });

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