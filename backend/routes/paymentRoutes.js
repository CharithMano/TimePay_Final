const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Employee routes
router.get('/my-payments', paymentController.getEmployeePayments);

// Admin/Accountant routes
router.post('/initiate', authorize('admin', 'owner', 'accountant'), paymentController.initiatePayment);
router.put('/:id/process', authorize('admin', 'owner', 'accountant'), paymentController.processPayment);
router.put('/:id/complete', authorize('admin', 'owner', 'accountant'), paymentController.completePayment);
router.put('/:id/fail', authorize('admin', 'owner', 'accountant'), paymentController.failPayment);
router.put('/:id/retry', authorize('admin', 'owner', 'accountant'), paymentController.retryPayment);
router.get('/all', authorize('admin', 'owner', 'accountant'), paymentController.getAllPayments);
router.get('/stats', authorize('admin', 'owner', 'accountant'), paymentController.getPaymentStats);
router.get('/:id', authorize('admin', 'owner', 'accountant'), paymentController.getPaymentById);

module.exports = router;