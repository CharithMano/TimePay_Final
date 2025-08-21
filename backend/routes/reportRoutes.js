const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin', 'hr_manager'));

router.get('/employee-summary', reportController.getEmployeeSummary);
router.get('/attendance-summary', reportController.getAttendanceSummary);
router.get('/leave-summary', reportController.getLeaveSummary);
router.get('/payroll-summary', reportController.getPayrollSummary);
router.get('/department-wise', reportController.getDepartmentWiseReport);
router.get('/performance', reportController.getPerformanceReport);
router.get('/export/employees', reportController.exportEmployeeReport);
router.get('/export/attendance', reportController.exportAttendanceReport);
router.get('/export/payroll', reportController.exportPayrollReport);

module.exports = router;