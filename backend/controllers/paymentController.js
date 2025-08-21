const Payment = require('../models/Payment');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

exports.initiatePayment = async (req, res) => {
  try {
    const { payrollId, paymentMethod, bankDetails, notes } = req.body;

    const payroll = await Payroll.findById(payrollId)
      .populate('employee')
      .populate('branch');

    if (!payroll) {
      return res.status(404).json({ 
        success: false,
        error: 'Payroll not found' 
      });
    }

    if (payroll.paymentStatus !== 'approved') {
      return res.status(400).json({ 
        success: false,
        error: 'Payroll must be approved before payment can be initiated' 
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ payroll: payrollId });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment already initiated for this payroll' 
      });
    }

    const payment = new Payment({
      payroll: payrollId,
      employee: payroll.employee._id,
      branch: payroll.branch._id,
      amount: payroll.netSalary,
      paymentMethod,
      bankDetails,
      notes,
      processedBy: req.user._id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Set payment gateway based on method
    if (paymentMethod === 'online') {
      payment.paymentGateway = 'payhere'; // Default for Sri Lanka
    } else if (paymentMethod === 'bank_transfer') {
      payment.paymentGateway = 'bank_api';
    } else {
      payment.paymentGateway = 'manual';
    }

    await payment.save();

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, reference, gatewayResponse } = req.body;

    const payment = await Payment.findById(id)
      .populate('employee', 'personalInfo user')
      .populate('payroll');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Payment has already been processed' 
      });
    }

    payment.status = 'processing';
    payment.processedAt = new Date();
    payment.transactionId = transactionId;
    payment.reference = reference;
    
    if (gatewayResponse) {
      payment.gatewayResponse = gatewayResponse;
    }

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment processing initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.completePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, reference, gatewayResponse } = req.body;

    const payment = await Payment.findById(id)
      .populate('employee', 'personalInfo user')
      .populate('payroll');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment cannot be completed in current status' 
      });
    }

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.approvedBy = req.user._id;
    payment.approvalDate = new Date();
    
    if (transactionId) payment.transactionId = transactionId;
    if (reference) payment.reference = reference;
    if (gatewayResponse) payment.gatewayResponse = gatewayResponse;

    await payment.save();

    // Update payroll status
    const payroll = await Payroll.findById(payment.payroll._id);
    payroll.paymentStatus = 'paid';
    payroll.paymentDate = new Date();
    payroll.paymentReference = payment.reference || payment.transactionId;
    await payroll.save();

    // Send notification to employee
    await new Notification({
      recipient: payment.employee.user,
      type: 'payment',
      title: 'Salary Payment Completed',
      message: `Your salary payment of Rs. ${payment.amount.toFixed(2)} has been completed successfully`,
      relatedTo: {
        model: 'Payment',
        id: payment._id
      }
    }).save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.failPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, gatewayResponse } = req.body;

    const payment = await Payment.findById(id)
      .populate('employee', 'personalInfo user');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment cannot be failed in current status' 
      });
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = reason;
    
    if (gatewayResponse) {
      payment.gatewayResponse = gatewayResponse;
    }

    await payment.save();

    // Send notification to admin/HR
    await new Notification({
      recipient: req.user._id,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment for ${payment.employee.personalInfo.firstName} ${payment.employee.personalInfo.lastName} failed. Reason: ${reason}`,
      relatedTo: {
        model: 'Payment',
        id: payment._id
      }
    }).save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment marked as failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, paymentMethod, branchId, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (branchId) query.branch = branchId;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('employee', 'personalInfo employeeId')
      .populate('branch', 'name')
      .populate('payroll', 'month year baseSalary')
      .populate('processedBy approvedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('employee', 'personalInfo employmentInfo employeeId')
      .populate('branch', 'name')
      .populate('payroll')
      .populate('processedBy approvedBy', 'email');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getEmployeePayments = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        error: 'Employee not found' 
      });
    }

    const payments = await Payment.find({ employee: employee._id })
      .populate('branch', 'name')
      .populate('payroll', 'month year baseSalary')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const { year, month, branchId } = req.query;
    
    let matchQuery = {};
    
    if (year) {
      if (month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        matchQuery.createdAt = {
          $gte: start,
          $lte: end
        };
      } else {
        matchQuery.createdAt = {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31)
        };
      }
    }
    
    if (branchId) {
      matchQuery.branch = branchId;
    }

    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          failedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const methodStats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          completedPayments: 0,
          completedAmount: 0,
          pendingPayments: 0,
          pendingAmount: 0,
          failedPayments: 0,
          failedAmount: 0
        },
        byMethod: methodStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (payment.status !== 'failed') {
      return res.status(400).json({ 
        success: false,
        error: 'Only failed payments can be retried' 
      });
    }

    payment.status = 'pending';
    payment.failedAt = null;
    payment.failureReason = null;
    payment.processedBy = req.user._id;
    payment.gatewayResponse = null;

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment retry initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};