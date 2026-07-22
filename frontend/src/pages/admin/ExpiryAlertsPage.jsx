import React, { useEffect, useState } from 'react';
import { getExpiryAlerts, resolveExpiryAlert } from '../../api/adminInventoryService';
import { AlertTriangle, Clock, Info, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from '../../components/ui/DataTable';
import './ExpiryAlertsPage.css';

const ExpiryAlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterResolved, setFilterResolved] = useState(false);

    useEffect(() => {
        fetchAlerts();
    }, [filterResolved]);

    const fetchAlerts = async (isLoading = false) => {
        if (!isLoading) setLoading(true);
        const { success, data } = await getExpiryAlerts({ resolved: filterResolved });
        if (success) {
            setAlerts(data.alerts);
        }
        setLoading(false);
    };

    const handleResolve = async (alertId, action) => {
        // Confirmation dialog
        const result = await Swal.fire({
            title: 'Confirm Action',
            text: `Are you sure you want to mark this blood unit as ${action}?`,
            icon: action === 'discarded' ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: action === 'discarded' ? 'var(--color-critical)' : 'var(--color-primary)',
            cancelButtonColor: 'var(--color-text-muted)',
            confirmButtonText: `Yes, mark as ${action}`
        });

        if (result.isConfirmed) {
            const { success, error } = await resolveExpiryAlert(alertId, action);
            if (success) {
                Swal.fire('Resolved!', `The alert has been marked as ${action}.`, 'success');
                fetchAlerts();
            } else {
                Swal.fire('Error', error || 'Failed to resolve alert', 'error');
            }
        }
    };

    if (loading && alerts.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>Loading...</div>;

    return (
        <div className="expiry-alerts-container">
            <div className="alerts-header-section">
                <div>
                    <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle className="text-critical" /> Blood Expiry Alerts
                    </h1>
                    <p className="text-muted text-sm">
                        Manage blood units approaching expiration or already expired.
                    </p>
                </div>
                <div className="alerts-filter-tabs">
                    <button
                        onClick={() => setFilterResolved(false)}
                        className={`btn dashboard ${!filterResolved ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Active Alerts
                    </button>
                    <button
                        onClick={() => setFilterResolved(true)}
                        className={`btn dashboard ${filterResolved ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Resolved History
                    </button>
                </div>
            </div>

            <DataTable 
                columns={['Status', 'Hospital', 'Blood Type', 'Time Left', 'Action']}
                data={alerts}
                emptyMessage="All clear! No active expiry alerts at the moment."
                renderRow={(alert) => (
                    <tr key={alert.id} style={{ opacity: alert.isResolved ? 0.7 : 1 }}>
                        <td>
                            {alert.alertType === 'expired' && (
                                <span className="alert-type-pill expired">
                                    <AlertTriangle size={16} /> Expired
                                </span>
                            )}
                            {alert.alertType === 'expiring_critical' && (
                                <span className="alert-type-pill expiring_critical">
                                    <Clock size={16} /> Critical (≤3 days)
                                </span>
                            )}
                            {alert.alertType === 'expiring_soon' && (
                                <span className="alert-type-pill expiring_soon">
                                    <Info size={16} /> Warning (≤7 days)
                                </span>
                            )}
                        </td>
                        <td><strong>{alert.hospital.name}</strong></td>
                        <td>
                            <span className="blood-type-circle">
                                {alert.bloodType}
                            </span>
                        </td>
                        <td>
                            {alert.isResolved ? (
                                <span className="text-muted">Resolved</span>
                            ) : alert.daysUntilExpiry <= 0 ? (
                                <span style={{ color: 'var(--color-critical)', fontWeight: 'bold' }}>Past Expiry</span>
                            ) : (
                                <span>{alert.daysUntilExpiry} days remaining</span>
                            )}
                        </td>
                        <td>
                            {alert.isResolved ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                                    <CheckCircle size={16} />
                                    {alert.resolvedAction}
                                </span>
                            ) : (
                                <div className="resolve-actions-row">
                                    <button 
                                        onClick={() => handleResolve(alert.id, 'used')}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                    >
                                        <CheckCircle size={14} /> Mark Used
                                    </button>
                                    <button 
                                        onClick={() => handleResolve(alert.id, 'transferred')}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                                    >
                                        <ArrowRight size={14} /> Transfer
                                    </button>
                                    <button 
                                        onClick={() => handleResolve(alert.id, 'discarded')}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px', borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
                                    >
                                        <Trash2 size={14} /> Discard
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default ExpiryAlertsPage;
