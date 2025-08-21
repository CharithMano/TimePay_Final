const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const ExcelJS = require('exceljs');

exports.getEmployeeSummary = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ 'employmentInfo.status': 'active' });
    const inactiveEmployees = await Employee.countDocuments({ 'employmentInfo.status': 'inactive' });
    const onLeaveEmployees = await Employee.countDocuments({ 'employmentInfo.status': 'on-leave' });

    const departmentWise = await Employee.aggregate([
      {
        $group: {
          _id: '$employmentInfo.department',
          count: { $sum: 1 }
        }
      }
    ]);

    const positionWise = await Employee.aggregate([
      {
        $group: {
          _id: '$employmentInfo.position',
          count: { $sum: 1 }
        }
      }
    ]);

    const genderDistribution = await Employee.aggregate([
      {
        $group: {
          _id: '$personalInfo.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      departmentWise,
      positionWise,
      genderDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'personalInfo employmentInfo');

    const summary = {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfDay: 0,
      totalOnLeave: 0,
      totalOvertime: 0,
      departmentWise: {}
    };

    attendance.forEach(record => {
      summary[`total${record.status.charAt(0).toUpperCase() + record.status.slice(1).replace(/-/g, '')}`]++;
      summary.totalOvertime += record.overtime || 0;

      const dept = record.employee?.employmentInfo?.department;
      if (dept) {
        if (!summary.departmentWise[dept]) {
          summary.departmentWise[dept] = {
            present: 0,
            absent: 0,
            halfDay: 0,
            onLeave: 0
          };
        }
        summary.departmentWise[dept][record.status.replace(/-/g, '')]++;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaveSummary = async (req, res) => {
  try {
    const { year } = req.query;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const leaves = await Leave.find({
      startDate: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'personalInfo employmentInfo');

    const summary = {
      totalRequests: leaves.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      byType: {},
      byDepartment: {}
    };

    leaves.forEach(leave => {
      summary[leave.status]++;
      
      if (!summary.byType[leave.leaveType]) {
        summary.byType[leave.leaveType] = 0;
      }
      summary.byType[leave.leaveType]++;

      const dept = leave.employee?.employmentInfo?.department;
      if (dept) {
        if (!summary.byDepartment[dept]) {
          summary.byDepartment[dept] = {
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0
          };
        }
        summary.byDepartment[dept].total++;
        summary.byDepartment[dept][leave.status]++;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate('employee', 'personalInfo employmentInfo');

    const summary = {
      totalPayrolls: payrolls.length,
      totalAmount: 0,
      totalTax: 0,
      totalBonus: 0,
      totalOvertime: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      departmentWise: {}
    };

    payrolls.forEach(payroll => {
      summary.totalAmount += payroll.netSalary;
      summary.totalTax += payroll.tax;
      summary.totalBonus += payroll.bonus;
      summary.totalOvertime += payroll.overtime.amount;
      summary[payroll.paymentStatus]++;

      const dept = payroll.employee?.employmentInfo?.department;
      if (dept) {
        if (!summary.departmentWise[dept]) {
          summary.departmentWise[dept] = {
            count: 0,
            totalAmount: 0,
            avgSalary: 0
          };
        }
        summary.departmentWise[dept].count++;
        summary.departmentWise[dept].totalAmount += payroll.netSalary;
      }
    });

    Object.keys(summary.departmentWise).forEach(dept => {
      summary.departmentWise[dept].avgSalary = 
        summary.departmentWise[dept].totalAmount / summary.departmentWise[dept].count;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentWiseReport = async (req, res) => {
  try {
    const departments = await Employee.distinct('employmentInfo.department');
    
    const report = [];

    for (const dept of departments) {
      const employees = await Employee.find({ 'employmentInfo.department': dept });
      const employeeIds = employees.map(e => e._id);

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const attendance = await Attendance.find({
        employee: { $in: employeeIds },
        date: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lte: new Date(currentYear, currentMonth, 0)
        }
      });

      const leaves = await Leave.find({
        employee: { $in: employeeIds },
        status: 'approved',
        startDate: {
          $gte: new Date(currentYear, 0, 1),
          $lte: new Date(currentYear, 11, 31)
        }
      });

      const payrolls = await Payroll.find({
        employee: { $in: employeeIds },
        month: currentMonth,
        year: currentYear
      });

      report.push({
        department: dept,
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.employmentInfo.status === 'active').length,
        avgAttendance: attendance.filter(a => a.status === 'present').length / employees.length,
        totalLeavesThisYear: leaves.length,
        totalPayrollCost: payrolls.reduce((sum, p) => sum + p.netSalary, 0)
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPerformanceReport = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let employeeFilter = {};
    if (employeeId) employeeFilter._id = employeeId;

    const employees = await Employee.find(employeeFilter);
    
    const report = [];

    for (const employee of employees) {
      const attendanceQuery = { employee: employee._id };
      if (startDate && endDate) {
        attendanceQuery.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const attendance = await Attendance.find(attendanceQuery);
      const leaves = await Leave.find({
        employee: employee._id,
        status: 'approved'
      });

      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const totalOvertime = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0);

      report.push({
        employee: {
          id: employee._id,
          name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          employeeId: employee.employeeId,
          department: employee.employmentInfo.department,
          position: employee.employmentInfo.position
        },
        attendance: {
          rate: attendanceRate.toFixed(2),
          presentDays,
          totalDays,
          overtime: totalOvertime
        },
        leaves: {
          taken: leaves.length,
          balance: employee.leaveBalance
        }
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportEmployeeReport = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('user', 'email role');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Last Name', key: 'lastName', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Joining Date', key: 'joiningDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Base Salary', key: 'salary', width: 15 }
    ];

    employees.forEach(emp => {
      worksheet.addRow({
        employeeId: emp.employeeId,
        firstName: emp.personalInfo.firstName,
        lastName: emp.personalInfo.lastName,
        email: emp.user?.email,
        department: emp.employmentInfo.department,
        position: emp.employmentInfo.position,
        joiningDate: emp.employmentInfo.joiningDate,
        status: emp.employmentInfo.status,
        salary: emp.compensation.baseSalary
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'personalInfo employeeId employmentInfo');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Clock In', key: 'clockIn', width: 15 },
      { header: 'Clock Out', key: 'clockOut', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Total Hours', key: 'totalHours', width: 12 },
      { header: 'Overtime', key: 'overtime', width: 12 }
    ];

    attendance.forEach(record => {
      worksheet.addRow({
        date: record.date,
        employeeId: record.employee?.employeeId,
        name: `${record.employee?.personalInfo?.firstName} ${record.employee?.personalInfo?.lastName}`,
        department: record.employee?.employmentInfo?.department,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        status: record.status,
        totalHours: record.totalHours,
        overtime: record.overtime
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${month}_${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportPayrollReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate('employee', 'personalInfo employeeId employmentInfo');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Month/Year', key: 'period', width: 15 },
      { header: 'Base Salary', key: 'baseSalary', width: 15 },
      { header: 'Allowances', key: 'allowances', width: 15 },
      { header: 'Deductions', key: 'deductions', width: 15 },
      { header: 'Bonus', key: 'bonus', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Net Salary', key: 'netSalary', width: 15 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    payrolls.forEach(payroll => {
      const totalAllowances = payroll.allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = payroll.deductions.reduce((sum, d) => sum + d.amount, 0);

      worksheet.addRow({
        employeeId: payroll.employee?.employeeId,
        name: `${payroll.employee?.personalInfo?.firstName} ${payroll.employee?.personalInfo?.lastName}`,
        department: payroll.employee?.employmentInfo?.department,
        period: `${payroll.month}/${payroll.year}`,
        baseSalary: payroll.baseSalary,
        allowances: totalAllowances,
        deductions: totalDeductions,
        bonus: payroll.bonus,
        tax: payroll.tax,
        netSalary: payroll.netSalary,
        status: payroll.paymentStatus
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_${month}_${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};