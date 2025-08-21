import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { leaveAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';

const Leaves = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const { data: myLeaves } = useQuery(
    'myLeaves',
    leaveAPI.getMyLeaves,
    { enabled: user?.role === 'employee' }
  );

  const { data: allLeaves } = useQuery(
    'allLeaves',
    leaveAPI.getAll,
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const { data: pendingLeaves } = useQuery(
    'pendingLeaves',
    leaveAPI.getPending,
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const { data: leaveBalance } = useQuery(
    'leaveBalance',
    leaveAPI.getBalance,
    { enabled: user?.role === 'employee' }
  );

  const applyLeaveMutation = useMutation(
    (data) => leaveAPI.apply(data),
    {
      onSuccess: () => {
        toast.success('Leave application submitted successfully!');
        setShowApplyModal(false);
        setLeaveForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
        queryClient.invalidateQueries('myLeaves');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to apply for leave');
      }
    }
  );

  const approveLeaveMutation = useMutation(
    ({ id, comments }) => leaveAPI.approve(id, { comments }),
    {
      onSuccess: () => {
        toast.success('Leave approved successfully!');
        queryClient.invalidateQueries(['allLeaves', 'pendingLeaves']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to approve leave');
      }
    }
  );

  const rejectLeaveMutation = useMutation(
    ({ id, reason }) => leaveAPI.reject(id, { reason }),
    {
      onSuccess: () => {
        toast.success('Leave rejected successfully!');
        queryClient.invalidateQueries(['allLeaves', 'pendingLeaves']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to reject leave');
      }
    }
  );

  const handleApplyLeave = (e) => {
    e.preventDefault();
    applyLeaveMutation.mutate(leaveForm);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaves</h1>
          <p className="text-gray-600">Manage leave requests and balances</p>
        </div>
        {user?.role === 'employee' && (
          <Button 
            variant="primary" 
            className="flex items-center"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus size={16} className="mr-2" />
            Apply Leave
          </Button>
        )}
      </div>

      {user?.role === 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {leaveBalance?.data && Object.entries(leaveBalance.data.balance).map(([type, balance]) => (
            <Card key={type}>
              <CardBody className="text-center">
                <p className="text-sm text-gray-600 capitalize">{type} Leave</p>
                <p className="text-2xl font-bold text-primary-600">{balance}</p>
                <p className="text-xs text-gray-500">days left</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {['admin', 'hr_manager'].includes(user?.role) && pendingLeaves?.data?.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Pending Approvals</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.data.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        {leave.employee?.personalInfo?.firstName} {leave.employee?.personalInfo?.lastName}
                      </td>
                      <td className="capitalize">{leave.leaveType}</td>
                      <td>
                        {moment(leave.startDate).format('MMM DD')} - {moment(leave.endDate).format('MMM DD, YYYY')}
                        <br />
                        <span className="text-xs text-gray-500">({leave.numberOfDays} days)</span>
                      </td>
                      <td>{leave.reason}</td>
                      <td>{moment(leave.createdAt).format('MMM DD, YYYY')}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => approveLeaveMutation.mutate({ id: leave._id, comments: '' })}
                            loading={approveLeaveMutation.isLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => rejectLeaveMutation.mutate({ id: leave._id, reason: 'Rejected' })}
                            loading={rejectLeaveMutation.isLoading}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {user?.role === 'employee' ? 'My Leave History' : 'All Leave Requests'}
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="table table-striped">
              <thead>
                <tr>
                  {user?.role !== 'employee' && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {(user?.role === 'employee' ? myLeaves?.data : allLeaves?.data)?.map((leave) => (
                  <tr key={leave._id}>
                    {user?.role !== 'employee' && (
                      <td>
                        {leave.employee?.personalInfo?.firstName} {leave.employee?.personalInfo?.lastName}
                      </td>
                    )}
                    <td className="capitalize">{leave.leaveType}</td>
                    <td>
                      {moment(leave.startDate).format('MMM DD')} - {moment(leave.endDate).format('MMM DD, YYYY')}
                    </td>
                    <td>{leave.numberOfDays}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <Badge variant={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                    </td>
                    <td>{moment(leave.createdAt).format('MMM DD, YYYY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={showApplyModal}
        onRequestClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
        size="md"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="form-label">Leave Type</label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="form-input"
              required
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Reason</label>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="form-input"
              rows="3"
              placeholder="Please provide a reason for your leave..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={applyLeaveMutation.isLoading}
              variant="primary"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;