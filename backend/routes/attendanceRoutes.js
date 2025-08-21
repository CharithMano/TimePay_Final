const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Employee routes
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/my-attendance', attendanceController.getMyAttendance);
router.get('/today', attendanceController.getTodayAttendance);

// Admin/Manager routes
router.get('/all', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), attendanceController.getAllAttendance);
router.get('/employee/:employeeId', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), attendanceController.getEmployeeAttendance);
router.post('/mark', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), attendanceController.markAttendance);
router.put('/:id', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), attendanceController.updateAttendance);
router.get('/report', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), attendanceController.getAttendanceReport);
router.get('/stats', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), attendanceController.getAttendanceStats);
router.get('/branch/:branchId/stats', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), attendanceController.getBranchAttendanceStats);

module.exports = router;