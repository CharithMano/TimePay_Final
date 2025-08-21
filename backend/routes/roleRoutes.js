const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('admin'));

router.get('/users', roleController.getAllUsers);
router.post('/users', roleController.createUser);
router.put('/users/:id', roleController.updateUser);
router.delete('/users/:id', roleController.deleteUser);
router.put('/users/:id/activate', roleController.activateUser);
router.put('/users/:id/deactivate', roleController.deactivateUser);
router.put('/users/:id/role', roleController.updateUserRole);

module.exports = router;