const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Employee routes
router.post('/apply', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);
router.get('/balance', leaveController.getLeaveBalance);
router.put('/:id/cancel', leaveController.cancelLeave);

// Admin/Manager routes
router.get('/all', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), leaveController.getAllLeaves);
router.get('/pending', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), leaveController.getPendingLeaves);
router.put('/:id/approve', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), leaveController.approveLeave);
router.put('/:id/reject', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), leaveController.rejectLeave);
router.get('/employee/:employeeId', authorize('admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor'), leaveController.getEmployeeLeaves);
router.get('/stats', authorize('admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'), leaveController.getLeaveStats);

// Configuration routes (Admin only)
router.get('/configurations', authorize('admin', 'owner', 'hr_manager'), leaveController.getLeaveConfigurations);
router.post('/configurations', authorize('admin', 'owner'), leaveController.createLeaveConfiguration);
router.put('/configurations/:id', authorize('admin', 'owner'), leaveController.updateLeaveConfiguration);

module.exports = router;