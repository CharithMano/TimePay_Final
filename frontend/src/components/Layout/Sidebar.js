import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  X,
  Building2
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'owner', 'accountant', 'hr_manager', 'branch_manager', 'supervisor', 'employee']
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
      roles: ['admin', 'owner', 'hr_manager', 'branch_manager']
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['admin', 'owner', 'accountant', 'hr_manager', 'branch_manager', 'supervisor', 'employee']
    },
    {
      name: 'Leaves',
      href: '/leaves',
      icon: Calendar,
      roles: ['admin', 'owner', 'hr_manager', 'branch_manager', 'supervisor', 'employee']
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: DollarSign,
      roles: ['admin', 'owner', 'accountant', 'hr_manager', 'employee']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'owner', 'accountant', 'hr_manager', 'branch_manager']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'owner', 'accountant', 'hr_manager', 'branch_manager', 'supervisor', 'employee']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-strong transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TimePay</h1>
              <p className="text-xs text-gray-500">Prasanga Shopping Center</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-lg">
                {user?.employee?.personalInfo?.firstName?.charAt(0)}
                {user?.employee?.personalInfo?.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.employee?.personalInfo?.firstName} {user?.employee?.personalInfo?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-400">
                {user?.employee?.employmentInfo?.department}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'sidebar-item',
                      isActive && 'active'
                    )}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © 2025 TimePay. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;