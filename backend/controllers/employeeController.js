const Employee = require('../models/Employee');
const User = require('../models/User');

exports.getAllEmployees = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    
    let query = {};
    
    if (department) query['employmentInfo.department'] = department;
    if (status) query['employmentInfo.status'] = status;
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': new RegExp(search, 'i') },
        { 'personalInfo.lastName': new RegExp(search, 'i') },
        { 'employeeId': new RegExp(search, 'i') }
      ];
    }

    const employees = await Employee.find(query)
      .populate('user', 'email role')
      .populate('employmentInfo.manager', 'personalInfo.firstName personalInfo.lastName');

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'email role')
      .populate('employmentInfo.manager', 'personalInfo.firstName personalInfo.lastName');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'email role')
      .populate('employmentInfo.manager', 'personalInfo.firstName personalInfo.lastName');

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { email, password, role, ...employeeData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP${String(employeeCount + 1).padStart(5, '0')}`;

    const employee = new Employee({
      ...employeeData,
      employeeId
    });
    await employee.save();

    const user = new User({
      email,
      password,
      role: role || 'employee',
      employee: employee._id
    });
    await user.save();

    employee.user = user._id;
    await employee.save();

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { email, role, ...updateData } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'email role');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (email || role) {
      const user = await User.findById(employee.user);
      if (email) user.email = email;
      if (role) user.role = role;
      await user.save();
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }

    await employee.deleteOne();

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 'employmentInfo.status': status },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const document = {
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'other',
      url: `/uploads/documents/${req.file.filename}`
    };

    employee.documents.push(document);
    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('documents');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee.documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};