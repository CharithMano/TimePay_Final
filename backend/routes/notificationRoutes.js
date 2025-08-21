const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/my-notifications', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/send', authorize('admin', 'hr_manager'), notificationController.sendNotification);
router.post('/broadcast', authorize('admin'), notificationController.broadcastNotification);
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;