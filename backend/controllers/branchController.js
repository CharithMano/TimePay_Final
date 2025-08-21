const Branch = require('../models/Branch');
const Employee = require('../models/Employee');

exports.createBranch = async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    
    res.status(201).json({
      success: true,
      data: branch,
      message: 'Branch created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Branch code already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('manager', 'personalInfo.firstName personalInfo.lastName employmentInfo.position')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager', 'personalInfo employmentInfo');
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'personalInfo.firstName personalInfo.lastName');
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: branch,
      message: 'Branch updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const employeeCount = await Employee.countDocuments({ 'employmentInfo.branch': req.params.id });
    
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete branch with active employees'
      });
    }
    
    const branch = await Branch.findByIdAndDelete(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBranchEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ 'employmentInfo.branch': req.params.id })
      .populate('user', 'email role isActive')
      .select('employeeId personalInfo employmentInfo')
      .sort({ 'personalInfo.firstName': 1 });
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBranchStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ 'employmentInfo.branch': req.params.id });
    const activeEmployees = await Employee.countDocuments({ 
      'employmentInfo.branch': req.params.id,
      'employmentInfo.status': 'active'
    });
    
    const employeesByPosition = await Employee.aggregate([
      { $match: { 'employmentInfo.branch': req.params.id } },
      { $group: { _id: '$employmentInfo.position', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        employeesByPosition
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};