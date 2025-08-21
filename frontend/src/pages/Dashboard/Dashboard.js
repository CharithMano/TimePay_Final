import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { reportAPI, attendanceAPI, leaveAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: employeeSummary, isLoading: loadingEmployees } = useQuery(
    'employeeSummary',
    reportAPI.getEmployeeSummary,
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const { data: attendanceSummary, isLoading: loadingAttendance } = useQuery(
    ['attendanceSummary', moment().month() + 1, moment().year()],
    () => reportAPI.getAttendanceSummary({
      month: moment().month() + 1,
      year: moment().year()
    }),
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const { data: leaveSummary, isLoading: loadingLeaves } = useQuery(
    ['leaveSummary', moment().year()],
    () => reportAPI.getLeaveSummary({ year: moment().year() }),
    { enabled: ['admin', 'hr_manager'].includes(user?.role) }
  );

  const { data: myAttendance } = useQuery(
    'myAttendance',
    () => attendanceAPI.getMyAttendance({
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().endOf('month').format('YYYY-MM-DD')
    }),
    { enabled: user?.role === 'employee' }
  );

  const { data: myLeaves } = useQuery(
    'myLeaves',
    leaveAPI.getMyLeaves,
    { enabled: user?.role === 'employee' }
  );

  const { data: leaveBalance } = useQuery(
    'leaveBalance',
    leaveAPI.getBalance,
    { enabled: user?.role === 'employee' }
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employees"
          value={employeeSummary?.data?.totalEmployees || 0}
          icon={Users}
          color="blue"
          loading={loadingEmployees}
        />
        <StatsCard
          title="Active Employees"
          value={employeeSummary?.data?.activeEmployees || 0}
          icon={CheckCircle}
          color="green"
          loading={loadingEmployees}
        />
        <StatsCard
          title="Present Today"
          value={attendanceSummary?.data?.totalPresent || 0}
          icon={Clock}
          color="purple"
          loading={loadingAttendance}
        />
        <StatsCard
          title="Pending Leaves"
          value={leaveSummary?.data?.pending || 0}
          icon={Calendar}
          color="orange"
          loading={loadingLeaves}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Department Distribution</h3>
          </CardHeader>
          <CardBody>
            {loadingEmployees ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {employeeSummary?.data?.departmentWise?.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{dept._id}</span>
                    <span className="font-medium">{dept.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Attendance Overview</h3>
          </CardHeader>
          <CardBody>
            {loadingAttendance ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Present</span>
                  <span className="font-medium text-green-600">
                    {attendanceSummary?.data?.totalPresent || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Absent</span>
                  <span className="font-medium text-red-600">
                    {attendanceSummary?.data?.totalAbsent || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">On Leave</span>
                  <span className="font-medium text-yellow-600">
                    {attendanceSummary?.data?.totalOnLeave || 0}
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const renderEmployeeDashboard = () => {
    const todayAttendance = myAttendance?.data?.find(a => 
      moment(a.date).isSame(moment(), 'day')
    );

    const thisMonthPresent = myAttendance?.data?.filter(a => a.status === 'present').length || 0;
    const thisMonthTotal = moment().daysInMonth();
    const attendanceRate = ((thisMonthPresent / thisMonthTotal) * 100).toFixed(1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Days Present"
            value={thisMonthPresent}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Annual Leave Left"
            value={leaveBalance?.data?.balance?.annual || 0}
            icon={Calendar}
            color="purple"
          />
          <StatsCard
            title="Sick Leave Left"
            value={leaveBalance?.data?.balance?.sick || 0}
            icon={AlertCircle}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Today's Status</h3>
            </CardHeader>
            <CardBody>
              {todayAttendance ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Clock In</span>
                    <span className="font-medium">
                      {todayAttendance.clockIn ? 
                        moment(todayAttendance.clockIn).format('HH:mm') : 
                        'Not clocked in'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Clock Out</span>
                    <span className="font-medium">
                      {todayAttendance.clockOut ? 
                        moment(todayAttendance.clockOut).format('HH:mm') : 
                        'Not clocked out'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`font-medium capitalize ${
                      todayAttendance.status === 'present' ? 'text-green-600' :
                      todayAttendance.status === 'absent' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {todayAttendance.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No attendance record for today</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Leaves</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {myLeaves?.data?.slice(0, 3).map((leave, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{leave.leaveType}</p>
                      <p className="text-xs text-gray-500">
                        {moment(leave.startDate).format('MMM DD')} - {moment(leave.endDate).format('MMM DD')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
                {(!myLeaves?.data || myLeaves.data.length === 0) && (
                  <p className="text-gray-500">No recent leaves</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'employee' ? 'Your personal overview' : 'Organization overview'}
          </p>
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

      {user?.role === 'employee' ? renderEmployeeDashboard() : renderAdminDashboard()}
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? <LoadingSpinner size="sm" /> : value}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default Dashboard;