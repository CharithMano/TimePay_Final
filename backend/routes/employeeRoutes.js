const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/', authorize('admin', 'hr_manager'), employeeController.getAllEmployees);
router.get('/profile', employeeController.getMyProfile);
router.get('/:id', employeeController.getEmployee);
router.post('/', authorize('admin', 'hr_manager'), employeeController.createEmployee);
router.put('/:id', authorize('admin', 'hr_manager'), employeeController.updateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);
router.post('/:id/documents', authorize('admin', 'hr_manager'), upload.single('document'), employeeController.uploadDocument);
router.get('/:id/documents', employeeController.getDocuments);
router.put('/:id/status', authorize('admin', 'hr_manager'), employeeController.updateStatus);

module.exports = router;