const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');
require('dotenv').config();

const updateUserCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get default branch
    const defaultBranch = await Branch.findOne();
    if (!defaultBranch) {
      throw new Error('No default branch found. Run migrateToBranches.js first.');
    }

    // Update existing admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      adminUser.email = 'admin@prasanga.com';
      adminUser.password = 'admin123';
      await adminUser.save();
      console.log('Updated admin user email and password');
    }

    // Update existing employee user
    const employeeUser = await User.findOne({ role: 'employee' });
    if (employeeUser) {
      employeeUser.email = 'employee@prasanga.com';
      employeeUser.password = 'emp123';
      await employeeUser.save();
      console.log('Updated employee user email and password');
    }

    // Check if accountant already exists
    const existingAccountant = await User.findOne({ role: 'accountant' });
    if (!existingAccountant) {
      // Create Accountant Employee
      const accountantEmployee = new Employee({
        employeeId: 'EMP00005',
        personalInfo: {
          firstName: 'Account',
          lastName: 'Manager',
          dateOfBirth: new Date('1988-08-15'),
          gender: 'male',
          address: {
            street: 'Prasanga Shopping Center',
            city: 'Colombo',
            state: 'Western',
            country: 'Sri Lanka',
            zipCode: '00100'
          },
          phone: '+94771234568'
        },
        employmentInfo: {
          position: 'accountant',
          department: 'Finance',
          joiningDate: new Date(),
          employmentType: 'full-time',
          status: 'active',
          branch: defaultBranch._id,
          workingHoursPerDay: 8,
          overtimeRate: 1.5
        },
        compensation: {
          baseSalary: 85000,
          currency: 'LKR',
          payFrequency: 'monthly',
          epfEmployeeContribution: 8,
          epfEmployerContribution: 12,
          etfContribution: 3
        }
      });
      await accountantEmployee.save();

      const accountantUser = new User({
        email: 'accountant@prasanga.com',
        password: 'account123',
        role: 'accountant',
        employee: accountantEmployee._id,
        isActive: true
      });
      await accountantUser.save();

      accountantEmployee.user = accountantUser._id;
      await accountantEmployee.save();

      console.log('Created new accountant user');
    } else {
      // Update existing accountant
      existingAccountant.email = 'accountant@prasanga.com';
      existingAccountant.password = 'account123';
      await existingAccountant.save();
      console.log('Updated existing accountant user');
    }

    console.log('✅ User credentials updated successfully!');
    console.log('Admin: admin@prasanga.com / admin123');
    console.log('Accountant: accountant@prasanga.com / account123');
    console.log('Employee: employee@prasanga.com / emp123');

  } catch (error) {
    console.error('Error updating user credentials:', error);
  } finally {
    await mongoose.connection.close();
  }
};

updateUserCredentials();