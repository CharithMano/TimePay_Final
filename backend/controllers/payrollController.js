const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Branch = require('../models/Branch');
const PDFDocument = require('pdfkit');
const moment = require('moment');

exports.generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, bonus = 0, deductions = [], allowances = [] } = req.body;

    const employee = await Employee.findById(employeeId).populate('employmentInfo.branch');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({ error: 'Payroll already exists for this period' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance data
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate work metrics
    const workingDays = endDate.getDate();
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const leaveDays = attendance.filter(a => a.status === 'on-leave').length;
    const holidays = attendance.filter(a => a.status === 'holiday').length;
    const weekends = attendance.filter(a => a.status === 'weekend').length;
    
    // Calculate hours
    const regularHours = attendance.reduce((sum, a) => sum + (a.regularHours || 0), 0);
    const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    
    // Calculate overtime amount
    const hourlyRate = employee.compensation.baseSalary / (workingDays * (employee.employmentInfo.workingHoursPerDay || 8));
    const overtimeRate = hourlyRate * (employee.employmentInfo.overtimeRate || 1.5);
    const overtimeAmount = overtimeHours * overtimeRate;

    // Calculate late and early leave deductions
    const lateMinutes = attendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
    const earlyLeaveMinutes = attendance.reduce((sum, a) => sum + (a.earlyLeaveMinutes || 0), 0);
    
    const lateDeductionAmount = (lateMinutes / 60) * hourlyRate;
    const earlyLeaveDeductionAmount = (earlyLeaveMinutes / 60) * hourlyRate;

    // Prepare allowances and deductions
    const finalAllowances = [
      ...(employee.compensation.allowances || []),
      ...allowances
    ];

    const finalDeductions = [
      ...(employee.compensation.deductions || []),
      ...deductions
    ];

    const payroll = new Payroll({
      employee: employeeId,
      branch: employee.employmentInfo.branch._id,
      month,
      year,
      baseSalary: employee.compensation.baseSalary,
      allowances: finalAllowances,
      deductions: finalDeductions,
      bonus,
      overtime: {
        hours: overtimeHours,
        rate: employee.employmentInfo.overtimeRate || 1.5,
        amount: overtimeAmount
      },
      epf: {
        employeePercentage: employee.compensation.epfEmployeeContribution || 8,
        employerPercentage: employee.compensation.epfEmployerContribution || 12
      },
      etf: {
        percentage: employee.compensation.etfContribution || 3
      },
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      holidays,
      weekends,
      regularHours,
      overtimeHours,
      lateDeductions: {
        minutes: lateMinutes,
        amount: lateDeductionAmount
      },
      earlyLeaveDeductions: {
        minutes: earlyLeaveMinutes,
        amount: earlyLeaveDeductionAmount
      },
      generatedBy: req.user._id
    });

    await payroll.save();

    await new Notification({
      recipient: employee.user,
      type: 'payslip',
      title: 'Payslip Generated',
      message: `Your payslip for ${moment().month(month - 1).format('MMMM')} ${year} has been generated`,
      relatedTo: {
        model: 'Payroll',
        id: payroll._id
      }
    }).save();

    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.bulkGeneratePayroll = async (req, res) => {
  try {
    const { month, year, branchId } = req.body;

    let query = { 'employmentInfo.status': 'active' };
    if (branchId) {
      query['employmentInfo.branch'] = branchId;
    }

    const employees = await Employee.find(query).populate('employmentInfo.branch');
    const results = [];

    for (const employee of employees) {
      try {
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year
        });

        if (!existingPayroll) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0);

          const attendance = await Attendance.find({
            employee: employee._id,
            date: { $gte: startDate, $lte: endDate }
          });

          const workingDays = endDate.getDate();
          const presentDays = attendance.filter(a => a.status === 'present').length;
          const absentDays = attendance.filter(a => a.status === 'absent').length;
          const leaveDays = attendance.filter(a => a.status === 'on-leave').length;
          const holidays = attendance.filter(a => a.status === 'holiday').length;
          const weekends = attendance.filter(a => a.status === 'weekend').length;

          const regularHours = attendance.reduce((sum, a) => sum + (a.regularHours || 0), 0);
          const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

          const hourlyRate = employee.compensation.baseSalary / (workingDays * (employee.employmentInfo.workingHoursPerDay || 8));
          const overtimeRate = hourlyRate * (employee.employmentInfo.overtimeRate || 1.5);
          const overtimeAmount = overtimeHours * overtimeRate;

          const payroll = new Payroll({
            employee: employee._id,
            branch: employee.employmentInfo.branch._id,
            month,
            year,
            baseSalary: employee.compensation.baseSalary,
            allowances: employee.compensation.allowances || [],
            deductions: employee.compensation.deductions || [],
            overtime: {
              hours: overtimeHours,
              rate: employee.employmentInfo.overtimeRate || 1.5,
              amount: overtimeAmount
            },
            epf: {
              employeePercentage: employee.compensation.epfEmployeeContribution || 8,
              employerPercentage: employee.compensation.epfEmployerContribution || 12
            },
            etf: {
              percentage: employee.compensation.etfContribution || 3
            },
            workingDays,
            presentDays,
            absentDays,
            leaveDays,
            holidays,
            weekends,
            regularHours,
            overtimeHours,
            generatedBy: req.user._id
          });

          await payroll.save();
          results.push({ employee: employee.employeeId, status: 'success' });

          await new Notification({
            recipient: employee.user,
            type: 'payslip',
            title: 'Payslip Generated',
            message: `Your payslip for ${moment().month(month - 1).format('MMMM')} ${year} has been generated`,
            relatedTo: {
              model: 'Payroll',
              id: payroll._id
            }
          }).save();
        } else {
          results.push({ employee: employee.employeeId, status: 'already_exists' });
        }
      } catch (err) {
        results.push({ employee: employee.employeeId, status: 'error', error: err.message });
      }
    }

    res.json({
      success: true,
      data: { results },
      message: 'Bulk payroll generation completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const payrolls = await Payroll.find({ employee: employee._id })
      .populate('branch', 'name')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee')
      .populate('branch', 'name')
      .populate('approvedBy', 'personalInfo')
      .populate('generatedBy', 'email');

    if (!payroll) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    
    if (req.user.role === 'employee' && 
        payroll.employee._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllPayrolls = async (req, res) => {
  try {
    const { month, year, department, status, branchId } = req.query;
    
    let query = {};
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.paymentStatus = status;
    if (branchId) query.branch = branchId;

    const payrolls = await Payroll.find(query)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('branch', 'name')
      .sort({ year: -1, month: -1 });

    let filteredPayrolls = payrolls;
    
    if (department) {
      filteredPayrolls = payrolls.filter(p => 
        p.employee?.employmentInfo?.department === department
      );
    }

    res.json({
      success: true,
      data: filteredPayrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    res.json({
      success: true,
      data: payroll,
      message: 'Payroll updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    payroll.paymentStatus = 'approved';
    payroll.approvedBy = req.user._id;
    payroll.paymentMethod = req.body.paymentMethod || 'bank_transfer';
    
    await payroll.save();

    res.json({
      success: true,
      data: payroll,
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.payPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    if (payroll.paymentStatus !== 'approved') {
      return res.status(400).json({ error: 'Payroll must be approved before payment' });
    }

    payroll.paymentStatus = 'paid';
    payroll.paymentDate = new Date();
    payroll.paymentReference = req.body.paymentReference;
    
    await payroll.save();

    res.json({
      success: true,
      data: payroll,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getEmployeePayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employee: req.params.employeeId })
      .populate('branch', 'name')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee')
      .populate('branch', 'name address')
      .populate('approvedBy', 'personalInfo')
      .populate('generatedBy', 'email');

    if (!payroll) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `payslip_${payroll.employee.employeeId}_${payroll.month}_${payroll.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PRASANGA SHOPPING CENTER', { align: 'center' });
    doc.fontSize(16).text('TimePay - Payment Management System', { align: 'center' });
    doc.fontSize(12).text('SALARY SLIP', { align: 'center', underline: true });
    doc.moveDown(2);
    
    // Employee Information
    doc.fontSize(12);
    const leftColumn = 50;
    const rightColumn = 300;
    
    doc.text('Employee Information:', leftColumn);
    doc.moveDown(0.5);
    doc.text(`Name: ${payroll.employee.personalInfo.firstName} ${payroll.employee.personalInfo.lastName}`, leftColumn);
    doc.text(`Employee ID: ${payroll.employee.employeeId}`, leftColumn);
    doc.text(`Position: ${payroll.employee.employmentInfo.position}`, leftColumn);
    doc.text(`Department: ${payroll.employee.employmentInfo.department}`, leftColumn);
    doc.text(`Branch: ${payroll.branch?.name || 'N/A'}`, leftColumn);
    
    // Payroll Period
    doc.text(`Pay Period: ${moment().month(payroll.month - 1).format('MMMM')} ${payroll.year}`, rightColumn);
    doc.text(`Generated: ${moment(payroll.createdAt).format('DD/MM/YYYY')}`, rightColumn);
    doc.text(`Status: ${payroll.paymentStatus.toUpperCase()}`, rightColumn);
    
    doc.moveDown(2);
    
    // Earnings Section
    doc.fontSize(14).text('EARNINGS', leftColumn, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    
    let yPos = doc.y;
    const earnings = [
      { label: 'Basic Salary', amount: payroll.baseSalary }
    ];
    
    // Add allowances
    payroll.allowances.forEach(allowance => {
      earnings.push({
        label: allowance.name,
        amount: allowance.calculatedAmount || allowance.amount
      });
    });
    
    if (payroll.bonus > 0) {
      earnings.push({ label: 'Bonus', amount: payroll.bonus });
    }
    
    if (payroll.overtime.amount > 0) {
      earnings.push({ 
        label: `Overtime (${payroll.overtime.hours} hrs @ ${payroll.overtime.rate}x)`, 
        amount: payroll.overtime.amount 
      });
    }
    
    earnings.forEach(item => {
      doc.text(item.label, leftColumn, yPos);
      doc.text(`Rs. ${item.amount.toFixed(2)}`, rightColumn, yPos, { align: 'right' });
      yPos += 15;
    });
    
    doc.text('Gross Salary:', leftColumn, yPos, { underline: true });
    doc.text(`Rs. ${payroll.grossSalary.toFixed(2)}`, rightColumn, yPos, { align: 'right', underline: true });
    
    doc.moveDown(2);
    
    // Deductions Section
    doc.fontSize(14).text('DEDUCTIONS', leftColumn, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    
    yPos = doc.y;
    const deductions = [
      { label: `EPF Employee Contribution (${payroll.epf.employeePercentage}%)`, amount: payroll.epf.employeeContribution }
    ];
    
    // Add other deductions
    payroll.deductions.forEach(deduction => {
      deductions.push({
        label: deduction.name,
        amount: deduction.calculatedAmount || deduction.amount
      });
    });
    
    if (payroll.lateDeductions.amount > 0) {
      deductions.push({
        label: `Late Deduction (${payroll.lateDeductions.minutes} mins)`,
        amount: payroll.lateDeductions.amount
      });
    }
    
    if (payroll.earlyLeaveDeductions.amount > 0) {
      deductions.push({
        label: `Early Leave Deduction (${payroll.earlyLeaveDeductions.minutes} mins)`,
        amount: payroll.earlyLeaveDeductions.amount
      });
    }
    
    if (payroll.tax > 0) {
      deductions.push({ label: 'Income Tax', amount: payroll.tax });
    }
    
    deductions.forEach(item => {
      doc.text(item.label, leftColumn, yPos);
      doc.text(`Rs. ${item.amount.toFixed(2)}`, rightColumn, yPos, { align: 'right' });
      yPos += 15;
    });
    
    doc.text('Total Deductions:', leftColumn, yPos, { underline: true });
    doc.text(`Rs. ${payroll.totalDeductions.toFixed(2)}`, rightColumn, yPos, { align: 'right', underline: true });
    
    doc.moveDown(2);
    
    // Net Salary
    doc.fontSize(16).text('NET SALARY:', leftColumn, doc.y, { underline: true });
    doc.text(`Rs. ${payroll.netSalary.toFixed(2)}`, rightColumn, doc.y, { align: 'right', underline: true });
    
    doc.moveDown(3);
    
    // Employer Contributions (Information Only)
    doc.fontSize(12).text('EMPLOYER CONTRIBUTIONS (Information Only):', leftColumn, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`EPF Employer Contribution (${payroll.epf.employerPercentage}%): Rs. ${payroll.epf.employerContribution.toFixed(2)}`, leftColumn);
    doc.text(`ETF Contribution (${payroll.etf.percentage}%): Rs. ${payroll.etf.employerContribution.toFixed(2)}`, leftColumn);
    
    doc.moveDown(2);
    
    // Attendance Summary
    doc.fontSize(12).text('ATTENDANCE SUMMARY:', leftColumn, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Working Days: ${payroll.workingDays}`, leftColumn);
    doc.text(`Present Days: ${payroll.presentDays}`, leftColumn);
    doc.text(`Absent Days: ${payroll.absentDays}`, leftColumn);
    doc.text(`Leave Days: ${payroll.leaveDays}`, leftColumn);
    doc.text(`Regular Hours: ${payroll.regularHours}`, rightColumn);
    doc.text(`Overtime Hours: ${payroll.overtimeHours}`, rightColumn);
    
    doc.moveDown(3);
    
    // Footer
    doc.fontSize(8).text('This is a computer-generated document and does not require a signature.', leftColumn, doc.y, { align: 'center' });
    doc.text(`Generated by TimePay - Prasanga Shopping Center on ${moment().format('DD/MM/YYYY HH:mm')}`, leftColumn, doc.y, { align: 'center' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPayrollStats = async (req, res) => {
  try {
    const { year, month, branchId } = req.query;
    
    let matchQuery = {};
    if (year) matchQuery.year = parseInt(year);
    if (month) matchQuery.month = parseInt(month);
    if (branchId) matchQuery.branch = branchId;

    const stats = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayrolls: { $sum: 1 },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalNetSalary: { $sum: '$netSalary' },
          totalEPFEmployee: { $sum: '$epf.employeeContribution' },
          totalEPFEmployer: { $sum: '$epf.employerContribution' },
          totalETF: { $sum: '$etf.employerContribution' },
          totalOvertimeHours: { $sum: '$overtimeHours' },
          totalOvertimeAmount: { $sum: '$overtime.amount' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalPayrolls: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalEPFEmployee: 0,
        totalEPFEmployer: 0,
        totalETF: 0,
        totalOvertimeHours: 0,
        totalOvertimeAmount: 0,
        paidCount: 0,
        pendingCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};