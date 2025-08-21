const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Branch = require('../models/Branch');
require('dotenv').config();

const migrateToBranches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a default branch if none exists
    let defaultBranch = await Branch.findOne();
    if (!defaultBranch) {
      defaultBranch = new Branch({
        name: 'Prasanga Shopping Center - Main Branch',
        code: 'PSC-MAIN',
        address: {
          street: 'Main Street',
          city: 'Colombo',
          state: 'Western',
          country: 'Sri Lanka',
          zipCode: '00100'
        },
        phone: '+94771234567',
        email: 'main@prasanga.com',
        departments: ['Sales', 'Management', 'Security', 'Cleaning', 'Administration'],
        isActive: true,
        openingTime: '08:00',
        closingTime: '22:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      });
      await defaultBranch.save();
      console.log('Created default branch:', defaultBranch.name);
    }

    // Update all employees without branch assignment
    const employeesWithoutBranch = await Employee.find({
      'employmentInfo.branch': { $exists: false }
    });

    console.log(`Found ${employeesWithoutBranch.length} employees without branch assignment`);

    for (const employee of employeesWithoutBranch) {
      employee.employmentInfo.branch = defaultBranch._id;
      
      // Also update position to match new enum values
      const positionMapping = {
        'System Administrator': 'admin',
        'HR Manager': 'manager',
        'Software Developer': 'other'
      };
      
      const newPosition = positionMapping[employee.employmentInfo.position] || 'other';
      employee.employmentInfo.position = newPosition;
      
      await employee.save();
      console.log(`Updated employee ${employee.employeeId} with branch and position`);
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

migrateToBranches();