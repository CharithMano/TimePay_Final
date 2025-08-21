import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, branchAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const AddEmployee = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    // Personal Information
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: 'Sri Lanka',
        zipCode: ''
      }
    },
    // Employment Information
    employmentInfo: {
      position: 'salesman',
      department: 'Sales',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'full-time',
      status: 'active',
      branch: '',
      workingHoursPerDay: 8,
      overtimeRate: 1.5
    },
    // Compensation
    compensation: {
      baseSalary: '',
      currency: 'LKR',
      payFrequency: 'monthly',
      epfEmployeeContribution: 8,
      epfEmployerContribution: 12,
      etfContribution: 3,
      allowances: [],
      deductions: []
    },
    // User Account
    email: '',
    password: '',
    role: 'employee'
  });

  // Get branches for dropdown
  const { data: branches } = useQuery('branches', branchAPI.getAll);

  const createEmployeeMutation = useMutation(
    (data) => employeeAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Employee created successfully!');
        queryClient.invalidateQueries('employees');
        navigate('/employees');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create employee');
      }
    }
  );

  const handleInputChange = (section, field, value, subfield = null) => {
    if (section === '') {
      // For top-level fields like email, password, role
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: subfield 
            ? { ...prev[section][field], [subfield]: value }
            : value
        }
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.personalInfo.firstName || !formData.personalInfo.lastName || 
        !formData.email || !formData.password || !formData.employmentInfo.branch) {
      toast.error('Please fill in all required fields');
      return;
    }

    createEmployeeMutation.mutate(formData);
  };

  const positions = [
    'salesman', 'driver', 'supervisor', 'cleaner', 'security', 
    'cashier', 'manager', 'accountant', 'admin', 'other'
  ];

  const departments = [
    'Sales', 'Management', 'Security', 'Cleaning', 'Administration', 
    'Finance', 'Operations', 'Maintenance'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/employees')}
          className="flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Employees
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600">Create a new employee profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                required
              />
              <Input
                label="Last Name *"
                value={formData.personalInfo.lastName}
                onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.personalInfo.dateOfBirth}
                onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
              />
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={formData.personalInfo.gender}
                  onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Phone Number"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
              />
            </div>
            
            <h4 className="text-md font-medium mt-6 mb-4">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street Address"
                value={formData.personalInfo.address.street}
                onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'street')}
              />
              <Input
                label="City"
                value={formData.personalInfo.address.city}
                onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'city')}
              />
              <Input
                label="State/Province"
                value={formData.personalInfo.address.state}
                onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'state')}
              />
              <Input
                label="Zip Code"
                value={formData.personalInfo.address.zipCode}
                onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value, 'zipCode')}
              />
            </div>
          </CardBody>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Employment Information</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Position *</label>
                <select
                  className="form-input"
                  value={formData.employmentInfo.position}
                  onChange={(e) => handleInputChange('employmentInfo', 'position', e.target.value)}
                  required
                >
                  {positions.map(pos => (
                    <option key={pos} value={pos}>
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  value={formData.employmentInfo.department}
                  onChange={(e) => handleInputChange('employmentInfo', 'department', e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Branch *</label>
                <select
                  className="form-input"
                  value={formData.employmentInfo.branch}
                  onChange={(e) => handleInputChange('employmentInfo', 'branch', e.target.value)}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches?.data?.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Joining Date *"
                type="date"
                value={formData.employmentInfo.joiningDate}
                onChange={(e) => handleInputChange('employmentInfo', 'joiningDate', e.target.value)}
                required
              />
              <div>
                <label className="form-label">Employment Type</label>
                <select
                  className="form-input"
                  value={formData.employmentInfo.employmentType}
                  onChange={(e) => handleInputChange('employmentInfo', 'employmentType', e.target.value)}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
              <Input
                label="Working Hours Per Day"
                type="number"
                min="1"
                max="12"
                value={formData.employmentInfo.workingHoursPerDay}
                onChange={(e) => handleInputChange('employmentInfo', 'workingHoursPerDay', parseFloat(e.target.value))}
              />
            </div>
          </CardBody>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Compensation</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Base Salary (LKR) *"
                type="number"
                min="0"
                value={formData.compensation.baseSalary}
                onChange={(e) => handleInputChange('compensation', 'baseSalary', parseFloat(e.target.value))}
                required
              />
              <div>
                <label className="form-label">Pay Frequency</label>
                <select
                  className="form-input"
                  value={formData.compensation.payFrequency}
                  onChange={(e) => handleInputChange('compensation', 'payFrequency', e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>
              <Input
                label="EPF Employee Contribution (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.compensation.epfEmployeeContribution}
                onChange={(e) => handleInputChange('compensation', 'epfEmployeeContribution', parseFloat(e.target.value))}
              />
              <Input
                label="EPF Employer Contribution (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.compensation.epfEmployerContribution}
                onChange={(e) => handleInputChange('compensation', 'epfEmployerContribution', parseFloat(e.target.value))}
              />
            </div>
          </CardBody>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Account Information</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('', 'email', e.target.value)}
                required
              />
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('', 'password', e.target.value)}
                required
                minLength={6}
              />
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => handleInputChange('', 'role', e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/employees')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createEmployeeMutation.isLoading}
            variant="primary"
          >
            Create Employee
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;