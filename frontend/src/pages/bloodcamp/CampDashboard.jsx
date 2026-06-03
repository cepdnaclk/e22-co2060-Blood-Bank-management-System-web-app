import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeCampRegistration,
  createBloodCamp,
  getCampRegistrations,
  getOrganizerCamps,
  getWorkflowNotifications,
  markRegistrationArrived,
  markWorkflowNotificationRead,
  sendRegistrationToScreening,
  getOrganizerDonatedHistory
} from '../../services/campService';
import { 
  LayoutDashboard, Calendar, MapPin, Clock, Plus, CheckCircle, 
  LogOut, User, Activity, Bell, Settings, History, Droplet, 
  Users, AlertTriangle, CalendarDays, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/auth/useAuth';
import Swal from 'sweetalert2';
import api from '../../api/api';

import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const CampDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [processingRegistrationId, setProcessingRegistrationId] = useState(null);
  const [donatedHistory, setDonatedHistory] = useState([]);

  const [newCamp, setNewCamp] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
  });

  const groupedRegistrations = useMemo(() => ({
    registered: registrations.filter((r) => r.status === 'registered'),
    arrived: registrations.filter((r) => r.status === 'arrived'),
    screening: registrations.filter((r) => r.status === 'screening'),
    approved: registrations.filter((r) => r.status === 'approved'),
    rejected: registrations.filter((r) => r.status === 'rejected'),
    donated: registrations.filter((r) => r.status === 'donated'),
  }), [registrations]);

  const loadProfile = async () => {
    try {
      const response = await api.get('auth/profile/');
      setProfileData(response.data);
    } catch {
      setProfileData(null);
    }
  };

  const loadCamps = async () => {
    const data = await getOrganizerCamps();
    setCamps(data);
  };

  const loadRegistrations = async (campId) => {
    const data = await getCampRegistrations(campId);
    setRegistrations(data);
  };

  const loadNotifications = async () => {
    const data = await getWorkflowNotifications();
    setNotifications(Array.isArray(data) ? data : []);
  };
  
  const loadDonatedHistory = async () => {
    const data = await getOrganizerDonatedHistory();
    setDonatedHistory(data);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProfile(), loadCamps(), loadNotifications(), loadDonatedHistory()]);
      if (selectedCamp?.id) {
        await loadRegistrations(selectedCamp.id);
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Failed to load camp dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const intervalId = setInterval(() => {
      loadAll();
    }, 8000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamp?.id]);

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      await createBloodCamp(newCamp);
      Swal.fire('Success', 'Blood Camp created.', 'success');
      setActiveTab('dashboard');
      setNewCamp({ title: '', date: '', start_time: '', end_time: '', location: '', description: '' });
      await loadCamps();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Failed to create camp.', 'error');
    }
  };

  const handleViewRegistrations = async (camp) => {
    setSelectedCamp(camp);
    await loadRegistrations(camp.id);
  };

  const runRegistrationAction = async (registrationId, action) => {
    try {
      setProcessingRegistrationId(registrationId);
      if (action === 'arrive') await markRegistrationArrived(registrationId);
      if (action === 'screening') await sendRegistrationToScreening(registrationId);
      if (action === 'donated') await completeCampRegistration(registrationId);
      await loadRegistrations(selectedCamp.id);
    } catch (error) {
      Swal.fire('Action Failed', error.response?.data?.detail || 'Could not update donor status.', 'error');
    } finally {
      setProcessingRegistrationId(null);
    }
  };

  const handleWorkflowNotifications = async () => {
    const html = notifications.length
      ? `<div style="text-align:left;max-height:300px;overflow:auto;">${notifications.map(
          (n) => `<div style="padding:10px 0;border-bottom:1px solid var(--color-border);">
                    <strong style="color:var(--color-critical);">${n.event_type}</strong><br/>
                    <span style="color:var(--color-text-main);">${n.message}</span><br/>
                    <small style="color:var(--color-text-muted);">${new Date(n.created_at).toLocaleString()}</small>
                  </div>`
        ).join('')}</div>`
      : '<p style="color:var(--color-text-muted);">No notifications.</p>';
    await Swal.fire({ title: 'Workflow Notifications', html, width: 700 });
    await Promise.all(notifications.filter((n) => !n.is_read).map((n) => markWorkflowNotificationRead(n.id)));
    await loadNotifications();
  };

  const profileUser = profileData?.user || {};
  const profile = profileData?.profile || {};

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview', onClick: () => setSelectedCamp(null) },
    { id: 'history', icon: <History size={20} />, label: 'Donated History', onClick: () => setSelectedCamp(null) },
    { id: 'create', icon: <Plus size={20} />, label: 'Create Camp' },
    { id: 'profile', icon: <Settings size={20} />, label: 'Settings', onClick: () => setSelectedCamp(null) },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleWorkflowNotifications}>
        <Bell size={24} style={{ color: 'var(--color-text-main)' }} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--color-critical)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'create') {
      return (
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--color-text-main)' }}>Create New Blood Camp</h2>
          <form onSubmit={handleCreateCamp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="stat-label">Camp Title</label>
              <input type="text" required value={newCamp.title} onChange={e => setNewCamp({ ...newCamp, title: e.target.value })} placeholder="e.g. Summer Blood Drive" style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="stat-label">Date</label>
                <input type="date" required value={newCamp.date} onChange={e => setNewCamp({ ...newCamp, date: e.target.value })} style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="stat-label">Start Time</label>
                <input type="time" required value={newCamp.start_time} onChange={e => setNewCamp({ ...newCamp, start_time: e.target.value })} style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="stat-label">End Time</label>
                <input type="time" required value={newCamp.end_time} onChange={e => setNewCamp({ ...newCamp, end_time: e.target.value })} style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="stat-label">Location</label>
              <input type="text" required value={newCamp.location} onChange={e => setNewCamp({ ...newCamp, location: e.target.value })} placeholder="Full Address / Venue" style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="stat-label">Description</label>
              <textarea rows="3" value={newCamp.description} onChange={e => setNewCamp({ ...newCamp, description: e.target.value })} style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)', resize: 'vertical' }} />
            </div>
            <button type="submit" className="dashboard btn btn-primary" style={{ padding: '12px', marginTop: '10px' }}>Publish Camp</button>
          </form>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <DataTable 
          columns={['Donor Name', 'Blood Group', 'Camp Location', 'Date', 'Status']}
          data={donatedHistory}
          emptyMessage="No donation records yet."
          renderRow={(record) => (
            <tr key={record.id}>
              <td>{record.donor_name}</td>
              <td><StatusBadge status={record.blood_group || 'N/A'} /></td>
              <td>{record.camp_location}</td>
              <td>{new Date(record.donated_at).toLocaleDateString()}</td>
              <td><StatusBadge status="completed" /></td>
            </tr>
          )}
        />
      );
    }

    if (activeTab === 'profile') {
      return (
        <div style={{ backgroundColor: 'var(--color-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--color-text-main)' }}>Organizer Profile</h2>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label className="stat-label" style={{display: 'block'}}>Full Name</label>
              <input type="text" value={profile?.fullName || profileUser?.username || ''} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
            </div>
            <div>
              <label className="stat-label" style={{display: 'block'}}>Email Address</label>
              <input type="email" value={profileUser?.email || user?.email || ''} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
            </div>
            <div>
              <label className="stat-label" style={{display: 'block'}}>Phone</label>
              <input type="text" value={profile?.phoneNumber || 'N/A'} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
            </div>
            <div>
              <label className="stat-label" style={{display: 'block'}}>Role</label>
              <input type="text" value={profileUser?.role || user?.role || ''} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)', textTransform: 'capitalize' }} />
            </div>
          </div>
        </div>
      );
    }

    // Default: 'dashboard' tab
    if (selectedCamp) {
      return (
        <div>
          <button 
            className="dashboard btn btn-outline" 
            onClick={() => setSelectedCamp(null)}
            style={{ marginBottom: '20px' }}
          >
            ← Back to Camps
          </button>
          
          {/* Camp Details Section */}
          <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--color-text-main)' }}>{selectedCamp.title} - Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>Date</span>
                <span style={{ color: 'var(--color-text-main)' }}>{new Date(selectedCamp.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>Time</span>
                <span style={{ color: 'var(--color-text-main)' }}>{selectedCamp.start_time} - {selectedCamp.end_time}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>Location</span>
                <span style={{ color: 'var(--color-text-main)' }}>{selectedCamp.location}</span>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px', color: 'var(--color-text-main)' }}>Donor Workflow</h3>
          
          <div style={{ marginBottom: '20px', color: 'var(--color-text-muted)', fontSize: '0.92rem', padding: '12px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <strong>Summary:</strong>{' '}
            Registered <StatusBadge status={groupedRegistrations.registered.length.toString()} /> • 
            Arrived <StatusBadge status={groupedRegistrations.arrived.length.toString()} /> • 
            Screening <StatusBadge status={groupedRegistrations.screening.length.toString()} /> • 
            Approved <StatusBadge status={groupedRegistrations.approved.length.toString()} /> • 
            Rejected <StatusBadge status={groupedRegistrations.rejected.length.toString()} /> • 
            Donated <StatusBadge status={groupedRegistrations.donated.length.toString()} />
          </div>

          <DataTable 
            columns={['Donor Name', 'Blood Group', 'Phone', 'Status', 'Actions']}
            data={registrations}
            emptyMessage="No donor registrations yet."
            renderRow={(reg) => (
              <tr key={reg.id}>
                <td>{reg.donor_name}</td>
                <td><StatusBadge status={reg.donor_blood_group || 'N/A'} /></td>
                <td>{reg.donor_phone || 'N/A'}</td>
                <td>
                  <StatusBadge status={reg.status} />
                  {reg.rejection_reason && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Reason: {reg.rejection_reason}</div>
                  )}
                  {reg.collected_at && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}><Clock size={12} style={{ display: 'inline' }} /> {new Date(reg.collected_at).toLocaleString()}</div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {reg.status === 'registered' && (
                      <button onClick={() => runRegistrationAction(reg.id, 'arrive')} className="dashboard btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={processingRegistrationId === reg.id}>
                        <CheckCircle size={14} /> Mark Arrived
                      </button>
                    )}
                    {reg.status === 'arrived' && (
                      <button onClick={() => runRegistrationAction(reg.id, 'screening')} className="dashboard btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-info)', color: 'white', border: 'none' }} disabled={processingRegistrationId === reg.id}>
                        <Activity size={14} /> To Screening
                      </button>
                    )}
                    {reg.status === 'approved' && (
                      <button onClick={() => runRegistrationAction(reg.id, 'donated')} className="dashboard btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-success)', color: 'white', border: 'none' }} disabled={processingRegistrationId === reg.id}>
                        <Droplet size={14} /> Complete Donation
                      </button>
                    )}
                    {(reg.status === 'screening' || reg.status === 'rejected' || reg.status === 'donated') && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No action available</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      );
    }

    // Dashboard Overview
    const upcomingCampsCount = camps.filter(c => new Date(c.date) >= new Date()).length;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="stats-grid">
          <StatCard 
            title="Total Units Collected" 
            value="4,520" 
            Icon={Droplet} 
            colorClass="text-primary"
            trend="+12% from last month"
          />
          <StatCard 
            title="Active Donors" 
            value="245" 
            Icon={Users} 
            colorClass="text-info"
            trend="Registered this week"
          />
          <StatCard 
            title="Critical Stock" 
            value="O- (20%)" 
            Icon={AlertTriangle} 
            colorClass="text-warning"
            trend="Action Required"
          />
          <StatCard 
            title="Upcoming Camps" 
            value={upcomingCampsCount} 
            Icon={CalendarDays} 
            colorClass="text-success"
            trend="Scheduled this month"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'var(--color-text-main)' }}>Your Camps</h2>
              <button className="dashboard btn btn-primary" onClick={() => setActiveTab('create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Schedule Camp
              </button>
            </div>
            
            {camps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                <CalendarDays size={48} style={{ color: 'var(--color-border)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>No camps organized yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {camps.map(camp => (
                  <div key={camp.id} style={{ backgroundColor: 'var(--color-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-text-main)' }}>{camp.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      <Calendar size={14} /> {camp.date} ({camp.start_time} - {camp.end_time})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      <MapPin size={14} /> {camp.location}
                    </div>
                    <div>
                      <StatusBadge status={camp.status} />
                    </div>
                    <button onClick={() => handleViewRegistrations(camp)} className="dashboard btn btn-outline" style={{ marginTop: 'auto', width: '100%' }}>
                      View Workflow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', alignSelf: 'start' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', marginBottom: '16px', fontSize: '1.1rem' }}>
              <Activity size={18} /> Live Activity Feed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>No recent activity.</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <strong style={{ color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{n.event_type}</strong>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{n.message}</span>
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', opacity: 0.7 }}>{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const displayName = profile?.fullName || profileUser?.username || user?.username || "Organizer";
  const displayRole = profileUser?.role || user?.role || "Organizer";

  return (
    <DashboardLayout
      userName={displayName}
      userRole={displayRole}
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={headerActions}
      onLogout={logout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CampDashboard;
