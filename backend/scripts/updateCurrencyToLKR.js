const mongoose = require('mongoose');
const Employee = require('../models/Employee');
require('dotenv').config();

const updateCurrencyToLKR = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all employees with USD currency to LKR
    const result = await Employee.updateMany(
      { 'compensation.currency': 'USD' },
      { $set: { 'compensation.currency': 'LKR' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} employees' currency from USD to LKR`);

    // Also update any employees without currency set to LKR as default
    const resultDefault = await Employee.updateMany(
      { 'compensation.currency': { $exists: false } },
      { $set: { 'compensation.currency': 'LKR' } }
    );

    console.log(`✅ Set default currency LKR for ${resultDefault.modifiedCount} employees without currency`);

  } catch (error) {
    console.error('Error updating currency:', error);
  } finally {
    await mongoose.connection.close();
  }
};

updateCurrencyToLKR();