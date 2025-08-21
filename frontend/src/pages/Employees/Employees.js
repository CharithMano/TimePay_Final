import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

const Employees = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');

  const { data: employees, isLoading, refetch } = useQuery(
    ['employees', { search, department, status }],
    () => employeeAPI.getAll({ search, department, status }),
    {
      keepPreviousData: true
    }
  );

  const deleteEmployeeMutation = useMutation(
    (id) => employeeAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Employee deleted successfully');
        queryClient.invalidateQueries('employees');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete employee');
      }
    }
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'terminated': return 'danger';
      case 'on-leave': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your organization's employees</p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center"
          onClick={() => navigate('/employees/add')}
        >
          <Plus size={16} className="mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="form-input"
              >
                <option value="">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Management">Management</option>
                <option value="Security">Security</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Joining Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees?.data?.map((employee) => (
                    <tr key={employee._id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-semibold">
                              {employee.personalInfo.firstName.charAt(0)}
                              {employee.personalInfo.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{employee.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{employee.employeeId}</td>
                      <td>{employee.employmentInfo.department}</td>
                      <td>{employee.employmentInfo.position}</td>
                      <td>
                        <Badge variant={getStatusColor(employee.employmentInfo.status)}>
                          {employee.employmentInfo.status}
                        </Badge>
                      </td>
                      <td>
                        {new Date(employee.employmentInfo.joiningDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/employees/${employee._id}`)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View">
                            <Eye size={16} className="text-gray-600" />
                          </button>
                          <button 
                            onClick={() => navigate(`/employees/${employee._id}?edit=true`)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit">
                            <Edit size={16} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(employee._id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Delete">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Employees;