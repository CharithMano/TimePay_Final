const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
require('dotenv').config();

const createDefaultUsers = async () => {
  try {
    // Check if we're already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist. Skipping default user creation.');
      return;
    }

    // Create Admin User
    const adminEmployee = new Employee({
      employeeId: 'EMP00001',
      personalInfo: {
        firstName: 'System',
        lastName: 'Administrator',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        address: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'Admin State',
          country: 'Admin Country',
          zipCode: '12345'
        },
        phone: '+1234567890'
      },
      employmentInfo: {
        position: 'System Administrator',
        department: 'IT',
        joiningDate: new Date(),
        employmentType: 'full-time',
        status: 'active'
      },
      compensation: {
        baseSalary: 100000,
        currency: 'LKR',
        payFrequency: 'monthly'
      }
    });
    await adminEmployee.save();

    const adminUser = new User({
      email: 'admin@hrms.com',
      password: 'admin123',
      role: 'admin',
      employee: adminEmployee._id,
      isActive: true
    });
    await adminUser.save();

    adminEmployee.user = adminUser._id;
    await adminEmployee.save();

    // Create HR Manager User
    const hrEmployee = new Employee({
      employeeId: 'EMP00002',
      personalInfo: {
        firstName: 'HR',
        lastName: 'Manager',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'female',
        address: {
          street: '456 HR Street',
          city: 'HR City',
          state: 'HR State',
          country: 'HR Country',
          zipCode: '54321'
        },
        phone: '+1987654321'
      },
      employmentInfo: {
        position: 'HR Manager',
        department: 'Human Resources',
        joiningDate: new Date(),
        employmentType: 'full-time',
        status: 'active'
      },
      compensation: {
        baseSalary: 80000,
        currency: 'LKR',
        payFrequency: 'monthly'
      }
    });
    await hrEmployee.save();

    const hrUser = new User({
      email: 'hr@hrms.com',
      password: 'hr123',
      role: 'hr_manager',
      employee: hrEmployee._id,
      isActive: true
    });
    await hrUser.save();

    hrEmployee.user = hrUser._id;
    await hrEmployee.save();

    // Create Employee User
    const employee = new Employee({
      employeeId: 'EMP00003',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1992-03-20'),
        gender: 'male',
        address: {
          street: '789 Employee Street',
          city: 'Employee City',
          state: 'Employee State',
          country: 'Employee Country',
          zipCode: '67890'
        },
        phone: '+1122334455'
      },
      employmentInfo: {
        position: 'Software Developer',
        department: 'Engineering',
        joiningDate: new Date(),
        employmentType: 'full-time',
        status: 'active'
      },
      compensation: {
        baseSalary: 70000,
        currency: 'LKR',
        payFrequency: 'monthly'
      }
    });
    await employee.save();

    const empUser = new User({
      email: 'employee@hrms.com',
      password: 'emp123',
      role: 'employee',
      employee: employee._id,
      isActive: true
    });
    await empUser.save();

    employee.user = empUser._id;
    await employee.save();

    console.log('✅ Default users created successfully!');
    console.log('Admin: admin@hrms.com / admin123');
    console.log('HR Manager: hr@hrms.com / hr123');
    console.log('Employee: employee@hrms.com / emp123');

  } catch (error) {
    console.error('Error creating default users:', error);
  } finally {
    // Only close if we opened the connection
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.connection.close();
    }
  }
};

// Run if called directly
if (require.main === module) {
  createDefaultUsers();
}

module.exports = createDefaultUsers;