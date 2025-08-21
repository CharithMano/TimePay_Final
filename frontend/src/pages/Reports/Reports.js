import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { reportAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, BarChart3, Users, Calendar, DollarSign } from 'lucide-react';
import moment from 'moment';

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());

  const { data: employeeSummary } = useQuery(
    'employeeSummary',
    reportAPI.getEmployeeSummary
  );

  const { data: attendanceSummary } = useQuery(
    ['attendanceSummary', selectedMonth, selectedYear],
    () => reportAPI.getAttendanceSummary({ month: selectedMonth, year: selectedYear })
  );

  const { data: leaveSummary } = useQuery(
    ['leaveSummary', selectedYear],
    () => reportAPI.getLeaveSummary({ year: selectedYear })
  );

  const { data: payrollSummary } = useQuery(
    ['payrollSummary', selectedMonth, selectedYear],
    () => reportAPI.getPayrollSummary({ month: selectedMonth, year: selectedYear })
  );

  const { data: departmentReport } = useQuery(
    'departmentReport',
    reportAPI.getDepartmentWise
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleExportEmployees = async () => {
    try {
      const response = await reportAPI.exportEmployees();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your organization</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="form-input"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {moment().month(i).format('MMMM')}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="form-input"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={moment().year() - i}>
                {moment().year() - i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeeSummary?.data?.totalEmployees || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users size={24} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeeSummary?.data?.activeEmployees || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Users size={24} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leave Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveSummary?.data?.totalRequests || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <Calendar size={24} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payroll Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(payrollSummary?.data?.totalAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <DollarSign size={24} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Department Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeeSummary?.data?.departmentWise || []}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {employeeSummary?.data?.departmentWise?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Attendance Summary</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Present', value: attendanceSummary?.data?.totalPresent || 0 },
                  { name: 'Absent', value: attendanceSummary?.data?.totalAbsent || 0 },
                  { name: 'On Leave', value: attendanceSummary?.data?.totalOnLeave || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Department Report */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Department-wise Report</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportEmployees}
              className="flex items-center"
            >
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Employees</th>
                  <th>Active Employees</th>
                  <th>Avg Attendance</th>
                  <th>Total Leaves</th>
                  <th>Payroll Cost</th>
                </tr>
              </thead>
              <tbody>
                {departmentReport?.data?.map((dept, index) => (
                  <tr key={index}>
                    <td className="font-medium">{dept.department}</td>
                    <td>{dept.totalEmployees}</td>
                    <td>{dept.activeEmployees}</td>
                    <td>{(dept.avgAttendance * 100).toFixed(1)}%</td>
                    <td>{dept.totalLeavesThisYear}</td>
                    <td>${dept.totalPayrollCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Reports;