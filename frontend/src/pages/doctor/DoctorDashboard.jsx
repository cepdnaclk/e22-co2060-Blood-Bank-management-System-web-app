import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import {
    Activity, Search, Ambulance,
    LayoutDashboard, Droplet, ClipboardList, Bell, User,
    UserCircle, Camera, QrCode, Stethoscope, CheckCircle, Clock
} from 'lucide-react';
import Swal from 'sweetalert2';
import QRScanner from '../../components/doctor/QRScanner';
import { getDoctorRequests, createBloodRequest } from '../../api/bloodRequestService';
import { getBloodStock } from '../../api/inventoryService';
import api from '../../api/api';
import {
    approveCampRegistration,
    getScreeningQueue,
    getWorkflowNotifications,
    markWorkflowNotificationRead,
    rejectCampRegistration,
} from '../../services/campService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const DoctorDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [profileImage, setProfileImage] = useState(null);
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [userProfileData, setUserProfileData] = useState(null);

    const [requests, setRequests] = useState([]);
    const [inventory, setInventory] = useState({});
    const [screeningQueue, setScreeningQueue] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [queueActionLoading, setQueueActionLoading] = useState(null);

    useEffect(() => {
        if (user && user.user_id) {
            fetchDoctorProfile();
            fetchDashboardData();
            const timer = setInterval(fetchDashboardData, 8000);
            return () => clearInterval(timer);
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        const [reqRes, invRes, queueRes, notiRes] = await Promise.all([
            getDoctorRequests(),
            getBloodStock(),
            getScreeningQueue(),
            getWorkflowNotifications(),
        ]);

        if (reqRes.success) {
            setRequests(Array.isArray(reqRes.data) ? reqRes.data : (reqRes.data?.results || []));
        }
        if (invRes.success) setInventory(invRes.data);
        setScreeningQueue(Array.isArray(queueRes) ? queueRes : (queueRes?.results || []));
        setNotifications(Array.isArray(notiRes) ? notiRes : (notiRes?.results || []));
        setLoading(false);
    };

    const fetchDoctorProfile = async () => {
        try {
            const [doctorRes, profileRes] = await Promise.all([
                api.get(`adminDashboard/doctor/profile/${user.user_id}/`),
                api.get('auth/profile/'),
            ]);
            setProfileData(doctorRes.data);
            setUserProfileData(profileRes.data);
            if (doctorRes.data.profile_pic) {
                setProfileImage(doctorRes.data.profile_pic);
            }
        } catch (error) {
            try {
                const profileRes = await api.get('auth/profile/');
                setUserProfileData(profileRes.data);
                setProfileData(null);
            } catch {
                setUserProfileData(null);
                setProfileData(null);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            await api.patch('medicalOfficers/doctor/profile-pic/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfileImage(URL.createObjectURL(file));
            Swal.fire({
                title: 'Photo Uploaded!',
                text: 'Your profile photo has been updated.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire('Upload Failed', 'Could not save the image. Try again.', 'error');
        }
    };

    const handleEmergencyRequest = () => {
        Swal.fire({
            title: 'EMERGENCY BLOOD REQUEST',
            html: `
                <div style="text-align: left;">
                    <p style="color: var(--color-critical); font-weight: bold; margin-bottom: 10px;">This triggers an immediate high-priority alert to the blood bank AND eligible donors.</p>
                    <label>Blood Group Required:</label>
                    <select id="em-blood" class="swal2-select" style="display: flex; width: 100%;">
                        <option>O-</option><option>O+</option><option>A-</option><option>A+</option>
                        <option>B-</option><option>B+</option><option>AB-</option><option>AB+</option>
                    </select>
                    <label style="margin-top: 10px; display: block;">Units Needed:</label>
                    <input id="em-units" type="number" value="2" class="swal2-input" style="display: flex; width: 100%;" />
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--color-critical)',
            confirmButtonText: 'SUBMIT EMERGENCY REQUEST',
            preConfirm: () => ({
                blood_group: document.getElementById('em-blood').value,
                units_requested: document.getElementById('em-units').value,
                priority_level: 'CRITICAL'
            })
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            const res = await createBloodRequest(result.value);
            if (res.success) {
                Swal.fire('Dispatched!', 'Emergency request sent.', 'success');
                fetchDashboardData();
            } else {
                Swal.fire('Error', 'Failed to dispatch emergency request.', 'error');
            }
        });
    };

    const handleBloodRequestSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.priority_level = data.urgency === 'Critical (Immediate)' ? 'CRITICAL' : (data.urgency === 'Urgent (Within 4h)' ? 'HIGH' : 'NORMAL');

        const res = await createBloodRequest(data);
        if (res.success) {
            Swal.fire('Success', 'Blood Request Submitted successfully', 'success');
            fetchDashboardData();
            setActiveTab('requests');
        } else {
            Swal.fire('Error', res.error?.detail || 'Submission failed', 'error');
        }
    };

    const handleApproveDonor = async (registrationId) => {
        try {
            setQueueActionLoading(registrationId);
            await approveCampRegistration(registrationId);
            await fetchDashboardData();
            Swal.fire('Approved', 'Donor approved for collection.', 'success');
        } catch (error) {
            Swal.fire('Error', error.response?.data?.detail || 'Could not approve donor.', 'error');
        } finally {
            setQueueActionLoading(null);
        }
    };

    const handleRejectDonor = async (registrationId) => {
        const result = await Swal.fire({
            title: 'Reject Donor',
            input: 'text',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'e.g. Hb below threshold',
            showCancelButton: true,
            preConfirm: (reason) => {
                if (!reason) Swal.showValidationMessage('Rejection reason is required');
                return reason;
            },
        });
        if (!result.isConfirmed) return;

        try {
            setQueueActionLoading(registrationId);
            await rejectCampRegistration(registrationId, result.value);
            await fetchDashboardData();
            Swal.fire('Rejected', 'Donor rejected with reason.', 'info');
        } catch (error) {
            Swal.fire('Error', error.response?.data?.detail || 'Could not reject donor.', 'error');
        } finally {
            setQueueActionLoading(null);
        }
    };

    const handleOpenNotifications = async () => {
        const html = notifications.length
            ? `<div style="text-align:left;max-height:300px;overflow:auto;">${notifications.map(
                (n) => `<div style="padding:8px 0;border-bottom:1px solid var(--color-border);">
                    <strong style="color:var(--color-text-main);">${n.event_type}</strong><br/>
                    <span style="color:var(--color-text-muted);">${n.message}</span><br/>
                    <small style="color:var(--color-text-muted);">${new Date(n.created_at).toLocaleString()}</small>
                  </div>`
            ).join('')}</div>`
            : '<p>No notifications.</p>';
        await Swal.fire({ title: 'Notifications', html, width: 700 });
        await Promise.all(notifications.filter((n) => !n.is_read).map((n) => markWorkflowNotificationRead(n.id)));
        await fetchDashboardData();
    };

    const displayName = profileData?.full_name || userProfileData?.profile?.fullName || profileData?.user?.first_name || user?.username || "Doctor Dashboard";
    const displayEmail = profileData?.user?.email || userProfileData?.user?.email || "";
    const displayHospital = profileData?.hospital || userProfileData?.profile?.hospital || "Hospital";
    const displayDepartment = profileData?.specialization || "Dept";

    const renderContent = () => {
        if (loading && requests.length === 0 && screeningQueue.length === 0) {
            return <p>Loading data...</p>;
        }

        switch (activeTab) {
            case 'screening-queue':
                return (
                    <DataTable 
                        columns={['Camp', 'Donor', 'Blood Group', 'Phone', 'Status', 'Actions']}
                        data={screeningQueue}
                        emptyMessage="No donors waiting for screening."
                        renderRow={(item) => (
                            <tr key={item.id}>
                                <td>{item.camp_title}</td>
                                <td>{item.donor_name}</td>
                                <td>{item.donor_blood_group || 'N/A'}</td>
                                <td>{item.donor_phone || 'N/A'}</td>
                                <td><StatusBadge status={item.status} /></td>
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="dashboard btn btn-primary"
                                        style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                        onClick={() => handleApproveDonor(item.id)}
                                        disabled={queueActionLoading === item.id}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="dashboard btn"
                                        style={{ backgroundColor: 'var(--color-critical)', color: '#fff', padding: '6px 12px', fontSize: '0.875rem' }}
                                        onClick={() => handleRejectDonor(item.id)}
                                        disabled={queueActionLoading === item.id}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        )}
                    />
                );
            case 'request-blood':
                return (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">New Blood Request</h2>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleBloodRequestSubmit} style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                <div>
                                    <label className="stat-label" style={{display: 'block'}}>Blood Group Required</label>
                                    <select name="blood_group" required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="stat-label" style={{display: 'block'}}>Units Needed</label>
                                    <input name="units_requested" type="number" min="1" defaultValue="1" required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
                                </div>
                                <div>
                                    <label className="stat-label" style={{display: 'block'}}>Urgency Level</label>
                                    <select name="urgency" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}>
                                        <option>Normal (Within 24h)</option>
                                        <option>Urgent (Within 4h)</option>
                                        <option>Critical (Immediate)</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="stat-label" style={{display: 'block'}}>Reason for Transfusion</label>
                                    <textarea name="reason" rows="2" placeholder="Surgery, Accident, etc." required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="dashboard btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            case 'requests':
                return (
                    <DataTable 
                        columns={['Date', 'Blood Group', 'Units', 'Priority', 'Status', 'Notes']}
                        data={requests}
                        emptyMessage="No requests found."
                        renderRow={(req) => (
                            <tr key={req.id}>
                                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                <td><strong>{req.blood_group}</strong></td>
                                <td>{req.units_requested}</td>
                                <td><StatusBadge status={req.priority_level} /></td>
                                <td><StatusBadge status={req.status} /></td>
                                <td className="text-muted text-sm">{req.status === 'REJECTED' ? req.rejection_note : (req.status === 'APPROVED' ? req.approval_note : '-')}</td>
                            </tr>
                        )}
                    />
                );
            case 'availability':
                return (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Blood Availability (Live Inventory)</h2>
                        </div>
                        <div className="card-body">
                            {Object.keys(inventory).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                                    <p>Inventory data currently unavailable.</p>
                                    <button className="dashboard btn btn-outline" onClick={fetchDashboardData}>Retry Fetch</button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                                    {Object.entries(inventory).map(([group, data]) => {
                                        const isLow = data.status === 'LOW' || data.status === 'CRITICAL';
                                        return (
                                            <div key={group} style={{ 
                                                padding: '20px', 
                                                borderRadius: 'var(--radius-lg)', 
                                                border: `1px solid ${isLow ? 'var(--color-warning)' : 'var(--color-success)'}`,
                                                backgroundColor: isLow ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                                                textAlign: 'center'
                                            }}>
                                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: isLow ? 'var(--color-warning)' : 'var(--color-success)' }}>{group}</h3>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{data.units} Units</div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: isLow ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '4px' }}>{data.status}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'scanner':
                return <div className="card"><div className="card-body"><QRScanner /></div></div>;
            case 'profile':
                return (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">My Profile</h2>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '150px', height: '150px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-secondary-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--color-border)'
                                    }}>
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : <User size={80} color="var(--color-text-muted)" />}
                                    </div>
                                    <label className="dashboard btn btn-outline" style={{ cursor: 'pointer', display: 'flex', gap: '8px' }}>
                                        <Camera size={16} /> Upload Photo
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    </label>
                                </div>
                                <div style={{ flex: 1, minWidth: '250px', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    <div>
                                        <label className="stat-label" style={{display: 'block'}}>Full Name</label>
                                        <input type="text" value={displayName} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
                                    </div>
                                    <div>
                                        <label className="stat-label" style={{display: 'block'}}>Email</label>
                                        <input type="email" value={displayEmail} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
                                    </div>
                                    <div>
                                        <label className="stat-label" style={{display: 'block'}}>Hospital</label>
                                        <input type="text" value={displayHospital} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
                                    </div>
                                    <div>
                                        <label className="stat-label" style={{display: 'block'}}>Department</label>
                                        <input type="text" value={displayDepartment} readOnly style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-text-main)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'dashboard':
            default:
                const pendingCount = requests.filter(r => r.status === 'PENDING').length;
                const completedCount = requests.filter(r => r.status === 'FULFILLED' || r.status === 'COMPLETED').length;

                return (
                    <div className="stats-grid">
                        <StatCard 
                            title="Total Requests" 
                            value={requests.length} 
                            Icon={ClipboardList} 
                            colorClass="text-primary"
                        />
                        <StatCard 
                            title="Pending Requests" 
                            value={pendingCount} 
                            Icon={Clock} 
                            colorClass="text-warning"
                        />
                        <StatCard 
                            title="Donors Waiting Screening" 
                            value={screeningQueue.length} 
                            Icon={Stethoscope} 
                            colorClass="text-info"
                        />
                        <StatCard 
                            title="Completed Requests" 
                            value={completedCount} 
                            Icon={CheckCircle} 
                            colorClass="text-success"
                        />
                    </div>
                );
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const menuItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'screening-queue', icon: <Stethoscope size={20} />, label: 'Screening Queue' },
        { id: 'request-blood', icon: <Droplet size={20} />, label: 'Request Blood' },
        { id: 'requests', icon: <ClipboardList size={20} />, label: 'My Requests' },
        { id: 'availability', icon: <Search size={20} />, label: 'Blood Availability' },
        { id: 'scanner', icon: <QrCode size={20} />, label: 'Donor Scanner' },
        { id: 'profile', icon: <UserCircle size={20} />, label: 'Profile' },
    ];

    const headerActions = (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleOpenNotifications}>
                <Bell size={24} style={{ color: 'var(--color-text-main)' }} />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--color-critical)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unreadCount}
                    </span>
                )}
            </div>
            <button
                onClick={handleEmergencyRequest}
                className="dashboard btn"
                style={{
                    backgroundColor: 'var(--color-critical)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-md)'
                }}
            >
                <Ambulance size={20} />
                <span className="hidden sm:inline">EMERGENCY</span>
            </button>
        </div>
    );

    return (
        <DashboardLayout
            title={displayName}
            subtitle={`${displayHospital} • ${displayDepartment}`}
            brandLabel="Doctor Portal"
            menuItems={menuItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            headerActions={headerActions}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default DoctorDashboard;
