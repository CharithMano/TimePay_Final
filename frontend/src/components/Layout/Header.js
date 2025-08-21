import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationAPI } from '../../services/api';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import Badge from '../UI/Badge';
import { toast } from 'react-toastify';
import moment from 'moment';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef();
  const userMenuRef = useRef();

  const { data: unreadCount } = useQuery(
    'unreadNotifications',
    () => notificationAPI.getUnreadCount(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: notifications, refetch: refetchNotifications } = useQuery(
    'myNotifications',
    () => notificationAPI.getMy({ limit: 10 }),
    {
      enabled: showNotifications,
    }
  );

  const markAsReadMutation = useMutation(
    (id) => notificationAPI.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('unreadNotifications');
        queryClient.invalidateQueries('myNotifications');
      }
    }
  );

  const markAllAsReadMutation = useMutation(
    () => notificationAPI.markAllAsRead(),
    {
      onSuccess: () => {
        toast.success('All notifications marked as read');
        queryClient.invalidateQueries('unreadNotifications');
        queryClient.invalidateQueries('myNotifications');
      }
    }
  );

  const deleteNotificationMutation = useMutation(
    (id) => notificationAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Notification deleted');
        queryClient.invalidateQueries('myNotifications');
        queryClient.invalidateQueries('unreadNotifications');
      }
    }
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return <Calendar size={16} className="text-blue-500" />;
      case 'payslip':
        return <DollarSign size={16} className="text-green-500" />;
      case 'announcement':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'task':
        return <Clock size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'leave_approved':
        return 'text-green-600';
      case 'leave_rejected':
        return 'text-red-600';
      case 'leave_request':
        return 'text-blue-600';
      case 'payslip':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          
          {/* Logo */}
          <div className="flex items-center mr-4">
            <img src="/ps_logo.png" alt="PS Logo" className="h-10 w-auto" />
          </div>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {user?.employee?.personalInfo?.firstName || 'User'}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  refetchNotifications();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell size={20} />
              {unreadCount?.data?.count > 0 && (
                <Badge 
                  variant="danger" 
                  className="absolute -top-1 -right-1 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {unreadCount.data.count > 99 ? '99+' : unreadCount.data.count}
                </Badge>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {notifications?.data?.notifications?.some(n => !n.isRead) && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications?.data?.notifications?.length > 0 ? (
                    notifications.data.notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {moment(notification.createdAt).fromNow()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification._id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Mark as read"
                              >
                                <Check size={14} className="text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification._id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Delete"
                            >
                              <X size={14} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        You'll see important updates here
                      </p>
                    </div>
                  )}
                </div>
                
                {notifications?.data?.hasMore && (
                  <div className="p-3 text-center border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-primary-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.employee?.personalInfo?.firstName} {user?.employee?.personalInfo?.lastName}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.employee?.personalInfo?.firstName} {user?.employee?.personalInfo?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                
                <button 
                  onClick={() => {
                    navigate(`/employees/${user?.employee?._id}`);
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                  <User size={16} className="mr-2" />
                  Profile
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                  <Settings size={16} className="mr-2" />
                  Settings
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;