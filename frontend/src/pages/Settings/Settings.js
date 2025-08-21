import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeAPI, authAPI, roleAPI } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import { toast } from 'react-toastify';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  Save,
  X,
  Check,
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  Database,
  FileText
} from 'lucide-react';

const Settings = () => {
  const { user, loadUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification State
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailLeaveApprovals: true,
    emailPayslips: true,
    smsNotifications: false,
    inAppNotifications: true,
    birthdayReminders: true,
    taskReminders: true
  });

  // Admin State
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    role: 'employee',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    baseSalary: 0
  });

  // Fetch employee profile
  const { data: employeeProfile, refetch: refetchProfile } = useQuery(
    'myProfile',
    employeeAPI.getMyProfile,
    {
      onSuccess: (data) => {
        setProfileData({
          firstName: data.data.personalInfo.firstName,
          lastName: data.data.personalInfo.lastName,
          phone: data.data.personalInfo.phone || '',
          address: data.data.personalInfo.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          }
        });
      }
    }
  );

  // Fetch all users (admin only)
  const { data: allUsers, refetch: refetchUsers } = useQuery(
    'allUsers',
    roleAPI.getAllUsers,
    {
      enabled: user?.role === 'admin'
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => employeeAPI.update(employeeProfile?.data?._id, {
      personalInfo: {
        ...employeeProfile?.data?.personalInfo,
        ...data,
        address: data.address
      }
    }),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        setIsEditingProfile(false);
        refetchProfile();
        loadUser();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => authAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to change password');
      }
    }
  );

  // Create user mutation (admin)
  const createUserMutation = useMutation(
    (data) => roleAPI.createUser({
      email: data.email,
      password: data.password,
      role: data.role,
      employeeData: {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName
        },
        employmentInfo: {
          department: data.department,
          position: data.position,
          joiningDate: new Date()
        },
        compensation: {
          baseSalary: data.baseSalary
        }
      }
    }),
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        setShowUserModal(false);
        refetchUsers();
        setUserFormData({
          email: '',
          password: '',
          role: 'employee',
          firstName: '',
          lastName: '',
          department: '',
          position: '',
          baseSalary: 0
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create user');
      }
    }
  );

  // Update user role mutation
  const updateUserRoleMutation = useMutation(
    ({ userId, role }) => roleAPI.updateUserRole(userId, { role }),
    {
      onSuccess: () => {
        toast.success('User role updated successfully!');
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update user role');
      }
    }
  );

  // Activate/Deactivate user mutations
  const activateUserMutation = useMutation(
    (userId) => roleAPI.activateUser(userId),
    {
      onSuccess: () => {
        toast.success('User activated successfully!');
        refetchUsers();
      }
    }
  );

  const deactivateUserMutation = useMutation(
    (userId) => roleAPI.deactivateUser(userId),
    {
      onSuccess: () => {
        toast.success('User deactivated successfully!');
        refetchUsers();
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (userId) => roleAPI.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        refetchUsers();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      }
    }
  );

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleNotificationSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    toast.success('Notification preferences saved!');
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    createUserMutation.mutate(userFormData);
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing data export...');
      // Create a sample data export
      const exportData = {
        timestamp: new Date().toISOString(),
        employees: allUsers?.data?.length || 0,
        exportedBy: user?.email,
        data: {
          users: allUsers?.data || [],
          profile: employeeProfile?.data || {}
        }
      };
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleBackup = () => {
    toast.info('System backup initiated');
    setTimeout(() => {
      toast.success('System backup completed successfully!');
    }, 2000);
  };

  const handleSystemLogs = () => {
    // Create sample system logs
    const logs = [
      { timestamp: new Date().toISOString(), level: 'INFO', message: 'User logged in', user: user?.email },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'INFO', message: 'Employee data updated' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'WARNING', message: 'High server load detected' },
      { timestamp: new Date(Date.now() - 10800000).toISOString(), level: 'INFO', message: 'Backup completed' },
    ];
    
    // Create and download log file
    const logContent = logs.map(log => `[${log.timestamp}] ${log.level}: ${log.message} ${log.user ? `(${log.user})` : ''}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('System logs downloaded!');
  };

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPrefs');
    if (savedPrefs) {
      setNotificationPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="mr-2" size={20} />
                  Profile Information
                </h3>
                {!isEditingProfile ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={handleProfileUpdate}
                      loading={updateProfileMutation.isLoading}
                    >
                      <Save size={16} className="mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setIsEditingProfile(false);
                        refetchProfile();
                      }}
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                  <Input
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                  <Input
                    label="Email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <Input
                    label="Employee ID"
                    value={employeeProfile?.data?.employeeId || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <Input
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                  <Input
                    label="Department"
                    value={employeeProfile?.data?.employmentInfo?.department || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <Input
                    label="Position"
                    value={employeeProfile?.data?.employmentInfo?.position || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <Input
                    label="Joining Date"
                    value={employeeProfile?.data?.employmentInfo?.joiningDate ? 
                      new Date(employeeProfile.data.employmentInfo.joiningDate).toLocaleDateString() : ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {isEditingProfile && (
                  <>
                    <h4 className="font-semibold text-gray-900 mt-6 mb-4">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Street"
                        value={profileData.address.street}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, street: e.target.value }
                        })}
                      />
                      <Input
                        label="City"
                        value={profileData.address.city}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, city: e.target.value }
                        })}
                      />
                      <Input
                        label="State"
                        value={profileData.address.state}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, state: e.target.value }
                        })}
                      />
                      <Input
                        label="Country"
                        value={profileData.address.country}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, country: e.target.value }
                        })}
                      />
                      <Input
                        label="ZIP Code"
                        value={profileData.address.zipCode}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, zipCode: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}
              </form>
            </CardBody>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Lock className="mr-2" size={20} />
                Change Password
              </h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  loading={changePasswordMutation.isLoading}
                >
                  Change Password
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Bell className="mr-2" size={20} />
                Notification Preferences
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Email notifications for leave approvals</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailLeaveApprovals}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      emailLeaveApprovals: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Email notifications for payslip generation</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailPayslips}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      emailPayslips: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">SMS notifications for important updates</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.smsNotifications}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      smsNotifications: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">In-app notifications</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.inAppNotifications}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      inAppNotifications: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Birthday reminders</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.birthdayReminders}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      birthdayReminders: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Task reminders</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.taskReminders}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      taskReminders: e.target.checked
                    })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                </label>
              </div>
              <div className="mt-6">
                <Button variant="primary" onClick={handleNotificationSave}>
                  Save Preferences
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Account Summary</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role:</span>
                  <Badge variant="primary" className="capitalize">
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">
                    {employeeProfile?.data?.employmentInfo?.department || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">
                    {employeeProfile?.data?.employmentInfo?.position || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium">
                    {employeeProfile?.data?.employeeId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Stats</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Leave Balance:</span>
                  <span className="font-medium">
                    {employeeProfile?.data?.leaveBalance?.annual || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sick Leave:</span>
                  <span className="font-medium">
                    {employeeProfile?.data?.leaveBalance?.sick || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Employment Type:</span>
                  <span className="font-medium capitalize">
                    {employeeProfile?.data?.employmentInfo?.employmentType?.replace('-', ' ') || 'N/A'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <Shield className="mr-2" size={20} />
                  Admin Actions
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setShowUserModal(true)}
                  >
                    <Users size={16} className="mr-2" />
                    Manage Users
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={handleExportData}
                  >
                    <FileText size={16} className="mr-2" />
                    Export Data
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={handleBackup}
                  >
                    <Database size={16} className="mr-2" />
                    Backup System
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={handleSystemLogs}
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    System Logs
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* User Management Modal (Admin) */}
      {user?.role === 'admin' && (
        <Modal
          isOpen={showUserModal}
          onRequestClose={() => setShowUserModal(false)}
          title="User Management"
          size="xl"
        >
          <div className="space-y-6">
            {/* Create New User Form */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Create New User</h4>
              <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required
                />
                <Input
                  label="First Name"
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  required
                />
                <div>
                  <label className="form-label">Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Input
                  label="Department"
                  value={userFormData.department}
                  onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                  required
                />
                <div>
                  <label className="form-label">Position</label>
                  <select
                    value={userFormData.position}
                    onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Select Position</option>
                    <option value="salesman">Salesman</option>
                    <option value="accountant">Accountant</option>
                    <option value="driver">Driver</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="security">Security</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
                <Input
                  label="Base Salary"
                  type="number"
                  value={userFormData.baseSalary}
                  onChange={(e) => setUserFormData({ ...userFormData, baseSalary: parseFloat(e.target.value) })}
                  required
                />
                <div className="col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={createUserMutation.isLoading}
                  >
                    Create User
                  </Button>
                </div>
              </form>
            </div>

            {/* Existing Users List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Existing Users</h4>
              <div className="overflow-x-auto">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers?.data?.map((userData) => (
                      <tr key={userData._id}>
                        <td>
                          {userData.employee?.personalInfo?.firstName} {userData.employee?.personalInfo?.lastName}
                        </td>
                        <td>{userData.email}</td>
                        <td>
                          <select
                            value={userData.role}
                            onChange={(e) => updateUserRoleMutation.mutate({
                              userId: userData._id,
                              role: e.target.value
                            })}
                            className="form-input py-1 px-2 text-sm"
                            disabled={userData._id === user._id}
                          >
                            <option value="employee">Employee</option>
                            <option value="hr_manager">HR Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{userData.employee?.employmentInfo?.department}</td>
                        <td>
                          <Badge variant={userData.isActive ? 'success' : 'danger'}>
                            {userData.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            {userData.isActive ? (
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => deactivateUserMutation.mutate(userData._id)}
                                disabled={userData._id === user._id}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => activateUserMutation.mutate(userData._id)}
                              >
                                Activate
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this user?')) {
                                  deleteUserMutation.mutate(userData._id);
                                }
                              }}
                              disabled={userData._id === user._id}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;