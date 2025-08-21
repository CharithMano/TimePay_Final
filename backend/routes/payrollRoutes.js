const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Employee routes
router.get('/my-payslips', payrollController.getMyPayslips);
router.get('/payslip/:id', payrollController.getPayslip);
router.get('/download/:id', payrollController.downloadPayslip);

// Admin/HR routes
router.post('/generate', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.generatePayroll);
router.get('/all', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.getAllPayrolls);
router.put('/:id', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.updatePayroll);
router.put('/:id/approve', authorize('admin', 'owner', 'accountant'), payrollController.approvePayroll);
router.put('/:id/pay', authorize('admin', 'owner', 'accountant'), payrollController.payPayroll);
router.get('/employee/:employeeId', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.getEmployeePayrolls);
router.post('/bulk-generate', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.bulkGeneratePayroll);
router.get('/stats', authorize('admin', 'owner', 'accountant', 'hr_manager'), payrollController.getPayrollStats);

module.exports = router;