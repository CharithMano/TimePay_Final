const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const branchController = require('../controllers/branchController');

// Create branch (Admin/Owner only)
router.post('/', auth, branchController.createBranch);

// Get all branches
router.get('/', auth, branchController.getAllBranches);

// Get branch by ID
router.get('/:id', auth, branchController.getBranchById);

// Update branch (Admin/Owner only)
router.put('/:id', auth, branchController.updateBranch);

// Delete branch (Admin/Owner only)
router.delete('/:id', auth, branchController.deleteBranch);

// Get branch employees
router.get('/:id/employees', auth, branchController.getBranchEmployees);

// Get branch statistics
router.get('/:id/stats', auth, branchController.getBranchStats);

module.exports = router;