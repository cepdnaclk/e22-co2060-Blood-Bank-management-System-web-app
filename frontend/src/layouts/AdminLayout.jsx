import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Activity, Users, Calendar, Droplet, FileText, CheckCircle, Settings } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();

  const menuItems = [
    { path: '/admin', icon: <Activity size={20} />, label: 'Dashboard' },
    { path: '/admin?tab=donors', icon: <Users size={20} />, label: 'Manage Donors' },
    { path: '/admin?tab=camps', icon: <Calendar size={20} />, label: 'Camp Organizers' },
    { path: '/admin/doctors', icon: <Users size={20} />, label: 'Doctors' },
    { path: '/admin/inventory', icon: <Droplet size={20} />, label: 'Inventory' },
    { path: '/admin/requests', icon: <FileText size={20} />, label: 'Blood Requests' },
    { path: '/admin/donations', icon: <CheckCircle size={20} />, label: 'Donations' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <DashboardLayout
      title="Admin Command Center"
      subtitle="Manage inventory, donors, and campaigns seamlessly"
      brandLabel="Admin Panel"
      menuItems={menuItems}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;
