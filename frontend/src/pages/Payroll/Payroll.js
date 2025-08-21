import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { payrollAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import PayrollModal from '../../components/Payroll/PayrollModal';
import { Download, DollarSign } from 'lucide-react';
import moment from 'moment';

const Payroll = () => {
  const { user } = useAuth();
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const { data: myPayslips } = useQuery(
    'myPayslips',
    payrollAPI.getMyPayslips,
    { enabled: user?.role === 'employee' }
  );

  const { data: allPayrolls } = useQuery(
    'allPayrolls',
    payrollAPI.getAll,
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const response = await payrollAPI.downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">
            {user?.role === 'employee' ? 'View your payslips and salary information' : 'Manage employee payrolls'}
          </p>
        </div>
        {['admin', 'hr_manager'].includes(user?.role) && (
          <Button 
            variant="primary" 
            className="flex items-center"
            onClick={() => setShowPayrollModal(true)}
          >
            <DollarSign size={16} className="mr-2" />
            Generate Payroll
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {user?.role === 'employee' ? 'My Payslips' : 'Employee Payrolls'}
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="table table-striped">
              <thead>
                <tr>
                  {user?.role !== 'employee' && <th>Employee</th>}
                  <th>Month/Year</th>
                  <th>Base Salary</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(user?.role === 'employee' ? myPayslips?.data : allPayrolls?.data)?.map((payroll) => {
                  const grossPay = payroll.baseSalary + 
                    payroll.allowances.reduce((sum, a) => sum + a.amount, 0) + 
                    payroll.bonus + 
                    payroll.overtime.amount;
                  
                  const totalDeductions = payroll.deductions.reduce((sum, d) => sum + d.amount, 0) + payroll.tax;

                  return (
                    <tr key={payroll._id}>
                      {user?.role !== 'employee' && (
                        <td>
                          {payroll.employee?.personalInfo?.firstName} {payroll.employee?.personalInfo?.lastName}
                        </td>
                      )}
                      <td>{payroll.month}/{payroll.year}</td>
                      <td>Rs. {payroll.baseSalary.toLocaleString()}</td>
                      <td>Rs. {grossPay.toLocaleString()}</td>
                      <td>Rs. {totalDeductions.toLocaleString()}</td>
                      <td className="font-semibold">Rs. {payroll.netSalary.toLocaleString()}</td>
                      <td>
                        <Badge variant={getStatusColor(payroll.paymentStatus)}>
                          {payroll.paymentStatus}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownloadPayslip(payroll._id)}
                          className="flex items-center"
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <PayrollModal
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
      />
    </div>
  );
};

export default Payroll;