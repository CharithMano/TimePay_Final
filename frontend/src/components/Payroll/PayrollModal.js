import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { payrollAPI, employeeAPI } from '../../services/api';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { toast } from 'react-toastify';

const PayrollModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
    deductions: []
  });

  const { data: employees } = useQuery(
    'employees',
    () => employeeAPI.getAll({ status: 'active' }),
    { enabled: isOpen }
  );

  const generatePayrollMutation = useMutation(
    (data) => payrollAPI.generate(data),
    {
      onSuccess: () => {
        toast.success('Payroll generated successfully!');
        onClose();
        setFormData({
          employeeId: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          bonus: 0,
          deductions: []
        });
        queryClient.invalidateQueries('allPayrolls');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate payroll');
      }
    }
  );

  const bulkGeneratePayrollMutation = useMutation(
    (data) => payrollAPI.bulkGenerate(data),
    {
      onSuccess: (response) => {
        const successCount = response.data.results.filter(r => r.status === 'success').length;
        toast.success(`Bulk payroll generated for ${successCount} employees!`);
        onClose();
        queryClient.invalidateQueries('allPayrolls');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate bulk payroll');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    generatePayrollMutation.mutate(formData);
  };

  const handleBulkGenerate = () => {
    bulkGeneratePayrollMutation.mutate({
      month: formData.month,
      year: formData.year
    });
  };

  const selectedEmployee = employees?.data?.find(emp => emp._id === formData.employeeId);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Generate Payroll"
      size="lg"
    >
      <div className="space-y-6">
        {/* Bulk Generation Option */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Bulk Generation</h3>
          <p className="text-blue-700 text-sm mb-3">
            Generate payroll for all active employees for the selected month/year
          </p>
          <div className="flex items-center space-x-4">
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              className="form-input w-32"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="form-input w-24"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
            <Button
              onClick={handleBulkGenerate}
              loading={bulkGeneratePayrollMutation.isLoading}
              variant="primary"
            >
              Generate for All
            </Button>
          </div>
        </div>

        <hr />

        {/* Individual Generation */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Employee Payroll</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Select Employee</label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Choose an employee...</option>
                {employees?.data?.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.personalInfo.firstName} {employee.personalInfo.lastName} - {employee.employeeId}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Employee Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{selectedEmployee.employmentInfo.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{selectedEmployee.employmentInfo.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Base Salary:</span>
                    <span className="ml-2 font-medium">${selectedEmployee.compensation.baseSalary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{selectedEmployee.employmentInfo.status}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="form-input"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="form-input"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>
                      {new Date().getFullYear() - i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Bonus Amount (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={formData.bonus}
              onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
              placeholder="Enter bonus amount"
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={generatePayrollMutation.isLoading}
                variant="primary"
                disabled={!formData.employeeId}
              >
                Generate Payroll
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default PayrollModal;