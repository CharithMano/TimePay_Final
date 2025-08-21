const Notification = require('../models/Notification');
const Employee = require('../models/Employee');

exports.getMyNotifications = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const notifications = await Notification.find({ recipient: employee._id })
      .populate('sender', 'personalInfo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Notification.countDocuments({ recipient: employee._id });

    res.json({
      notifications,
      total,
      hasMore: total > parseInt(offset) + notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: employee._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    await Notification.updateMany(
      { recipient: employee._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: employee._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, priority } = req.body;

    const sender = await Employee.findOne({ user: req.user._id });

    const notification = new Notification({
      recipient: recipientId,
      sender: sender._id,
      type,
      title,
      message,
      priority: priority || 'medium'
    });

    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { type, title, message, priority, department, role } = req.body;

    const sender = await Employee.findOne({ user: req.user._id });

    let query = { 'employmentInfo.status': 'active' };
    if (department) query['employmentInfo.department'] = department;

    const employees = await Employee.find(query).populate('user');

    let targetEmployees = employees;
    if (role) {
      targetEmployees = employees.filter(emp => emp.user?.role === role);
    }

    const notifications = [];

    for (const employee of targetEmployees) {
      const notification = new Notification({
        recipient: employee._id,
        sender: sender._id,
        type: type || 'announcement',
        title,
        message,
        priority: priority || 'medium'
      });
      
      notifications.push(notification.save());
    }

    await Promise.all(notifications);

    res.json({ 
      message: 'Notification broadcast successfully',
      recipientCount: targetEmployees.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    
    const count = await Notification.countDocuments({
      recipient: employee._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};