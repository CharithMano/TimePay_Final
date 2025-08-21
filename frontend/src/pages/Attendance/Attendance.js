import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { attendanceAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Clock, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';

const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: myAttendance } = useQuery(
    'myAttendance',
    () => attendanceAPI.getMyAttendance({
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    }),
    { enabled: user?.role === 'employee' }
  );

  const { data: allAttendance } = useQuery(
    'allAttendance',
    () => attendanceAPI.getAll({
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    }),
    { enabled: ['admin', 'owner', 'accountant', 'hr_manager', 'branch_manager'].includes(user?.role) }
  );

  const clockInMutation = useMutation(
    () => attendanceAPI.clockIn({ workType: 'office' }),
    {
      onSuccess: () => {
        toast.success('Clocked in successfully!');
        queryClient.invalidateQueries('myAttendance');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to clock in');
      }
    }
  );

  const clockOutMutation = useMutation(
    () => attendanceAPI.clockOut({ breakTime: 60 }),
    {
      onSuccess: () => {
        toast.success('Clocked out successfully!');
        queryClient.invalidateQueries('myAttendance');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to clock out');
      }
    }
  );

  const attendanceData = myAttendance?.data?.attendance || myAttendance?.data || [];
  const todayAttendance = attendanceData.find(a => 
    moment(a.date).isSame(moment(), 'day')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track and manage attendance</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {moment().format('dddd, MMMM Do YYYY')}
          </p>
          <p className="text-xs text-gray-400">
            {moment().format('h:mm A')}
          </p>
        </div>
      </div>

      {user?.role === 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Clock className="mr-2" size={20} />
                Today's Attendance
              </h3>
            </CardHeader>
            <CardBody>
              {todayAttendance ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Clock In:</span>
                    <span className="font-medium">
                      {todayAttendance.clockIn ? 
                        moment(todayAttendance.clockIn).format('HH:mm') : 
                        'Not clocked in'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Clock Out:</span>
                    <span className="font-medium">
                      {todayAttendance.clockOut ? 
                        moment(todayAttendance.clockOut).format('HH:mm') : 
                        'Not clocked out'
                      }
                    </span>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    {!todayAttendance.clockIn ? (
                      <Button
                        onClick={() => clockInMutation.mutate()}
                        loading={clockInMutation.isLoading}
                        variant="success"
                        className="flex-1"
                      >
                        Clock In
                      </Button>
                    ) : !todayAttendance.clockOut ? (
                      <Button
                        onClick={() => clockOutMutation.mutate()}
                        loading={clockOutMutation.isLoading}
                        variant="danger"
                        className="flex-1"
                      >
                        Clock Out
                      </Button>
                    ) : (
                      <div className="w-full text-center text-green-600 font-medium">
                        Day completed!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No attendance record for today</p>
                  <Button
                    onClick={() => clockInMutation.mutate()}
                    loading={clockInMutation.isLoading}
                    variant="success"
                  >
                    Clock In
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="mr-2" size={20} />
                This Month Summary
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Present Days:</span>
                  <span className="font-medium text-green-600">
                    {myAttendance?.data?.summary?.presentDays || attendanceData.filter(a => a.status === 'present').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Absent Days:</span>
                  <span className="font-medium text-red-600">
                    {myAttendance?.data?.summary?.absentDays || attendanceData.filter(a => a.status === 'absent').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">
                    {(myAttendance?.data?.summary?.totalRegularHours || attendanceData.reduce((sum, a) => sum + (a.totalHours || 0), 0)).toFixed(1) || 0}h
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {user?.role === 'employee' ? 'My Attendance History' : 'All Employee Attendance'}
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  {user?.role !== 'employee' && <th>Employee</th>}
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(user?.role === 'employee' ? attendanceData : allAttendance?.data || [])?.map((record) => (
                  <tr key={record._id}>
                    <td>{moment(record.date).format('MMM DD, YYYY')}</td>
                    {user?.role !== 'employee' && (
                      <td>
                        {record.employee?.personalInfo?.firstName} {record.employee?.personalInfo?.lastName}
                      </td>
                    )}
                    <td>
                      {record.clockIn ? moment(record.clockIn).format('HH:mm') : '-'}
                    </td>
                    <td>
                      {record.clockOut ? moment(record.clockOut).format('HH:mm') : '-'}
                    </td>
                    <td>{record.totalHours?.toFixed(1) || '-'}h</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
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

export default Attendance;