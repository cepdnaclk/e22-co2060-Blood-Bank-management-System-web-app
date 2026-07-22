import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Bell, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    completeCampRegistration,
    getCampRegistrations,
    getOrganizerCamps,
    getWorkflowNotifications,
    markRegistrationArrived,
    markWorkflowNotificationRead,
    sendRegistrationToScreening,
} from '../../services/campService';
import './LabDashboard.css';

const LabDashboard = () => {
    const [camps, setCamps] = useState([]);
    const [selectedCampId, setSelectedCampId] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const loadData = async (campIdOverride = null, silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [campData, notificationData] = await Promise.all([
                getOrganizerCamps(),
                getWorkflowNotifications(),
            ]);

            setCamps(campData);
            setNotifications(notificationData);

            const activeCampId = campIdOverride || selectedCampId || campData?.[0]?.id;
            if (activeCampId) {
                const regData = await getCampRegistrations(activeCampId);
                setSelectedCampId(activeCampId);
                setRegistrations(regData);
            } else {
                setRegistrations([]);
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.detail || 'Failed to load staff dashboard data.', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const timer = setInterval(() => loadData(null, true), 8000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const grouped = useMemo(() => {
        return {
            registered: registrations.filter((r) => r.status === 'registered'),
            arrived: registrations.filter((r) => r.status === 'arrived'),
            approved: registrations.filter((r) => r.status === 'approved'),
        };
    }, [registrations]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const runAction = async (registrationId, action) => {
        try {
            setProcessingId(registrationId);
            if (action === 'arrive') await markRegistrationArrived(registrationId);
            if (action === 'screening') await sendRegistrationToScreening(registrationId);
            if (action === 'donated') await completeCampRegistration(registrationId);
            await loadData(selectedCampId);
        } catch (error) {
            Swal.fire('Action Failed', error.response?.data?.detail || 'Could not update donor status.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const openNotifications = async () => {
        const html = notifications.length
            ? `<div style="text-align:left;max-height:280px;overflow:auto;">${notifications
                  .map(
                      (n) =>
                          `<div style="padding:8px 0;border-bottom:1px solid #eee;">
                            <strong>${n.event_type}</strong><br/>
                            <span>${n.message}</span><br/>
                            <small>${new Date(n.created_at).toLocaleString()}</small>
                           </div>`,
                  )
                  .join('')}</div>`
            : '<p>No notifications.</p>';
        await Swal.fire({ title: 'Workflow Notifications', html, width: 700 });
        const unread = notifications.filter((n) => !n.is_read);
        await Promise.all(unread.map((n) => markWorkflowNotificationRead(n.id)));
        await loadData(selectedCampId);
    };

    const renderTable = (title, rows, actionLabel, onClick) => (
        <div className="card">
            <div className="card-header">
                <h2>{title}</h2>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Donor</th>
                                <th>Blood Group</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 18 }}>No donors in this stage.</td></tr>
                            ) : rows.map((reg) => (
                                <tr key={reg.id}>
                                    <td>{reg.donor_name}</td>
                                    <td>{reg.donor_blood_group || 'N/A'}</td>
                                    <td>{reg.donor_phone || 'N/A'}</td>
                                    <td><span className={`badge ${reg.status}`}>{reg.status}</span></td>
                                    <td>
                                        <button
                                            className="btn btn-primary"
                                            disabled={processingId === reg.id}
                                            onClick={() => onClick(reg.id)}
                                        >
                                            {processingId === reg.id ? 'Updating...' : actionLabel}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard lab-dashboard fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 className="welcome-text">Camp Operations Dashboard</h1>
                    <p className="text-muted">Scan donor → Arrived → Screening → Donated</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" onClick={() => loadData(selectedCampId)}>
                        <RefreshCcw size={16} style={{ marginRight: 6 }} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openNotifications}>
                        <Bell size={16} style={{ marginRight: 6 }} /> Notifications ({unreadCount})
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="col-span-12">
                    <div className="alert-card wrapper-alert">
                        <div className="alert-icon-wrapper">
                            <Clock size={24} color="var(--color-expiring)" />
                        </div>
                        <div className="alert-text">
                            <h4>Current Camp</h4>
                            <p>Select a camp and process donors through each workflow stage.</p>
                        </div>
                        <select
                            className="form-control"
                            style={{ maxWidth: 300 }}
                            value={selectedCampId}
                            onChange={(e) => loadData(e.target.value)}
                        >
                            {camps.length === 0 && <option value="">No camps found</option>}
                            {camps.map((camp) => (
                                <option key={camp.id} value={camp.id}>
                                    {camp.title} ({camp.date})
                                </option>
                            ))}
                        </select>
                        <button className="btn btn-outline text-sm bg-white" onClick={() => loadData(selectedCampId)}>
                            <AlertTriangle size={16} style={{ marginRight: 6 }} /> Live Polling Enabled
                        </button>
                    </div>
                </div>

                <div className="col-span-12">
                    {loading ? (
                        <div className="card"><div className="card-body">Loading donor workflow...</div></div>
                    ) : (
                        <>
                            {renderTable('Registered Donors', grouped.registered, 'Mark Arrived', (id) => runAction(id, 'arrive'))}
                            {renderTable('Arrived Donors', grouped.arrived, 'Send to Doctor', (id) => runAction(id, 'screening'))}
                            {renderTable('Approved Donors', grouped.approved, 'Mark Donated', (id) => runAction(id, 'donated'))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
