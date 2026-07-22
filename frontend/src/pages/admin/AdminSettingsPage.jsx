import React from 'react';
import { Settings, Shield, Bell, Database } from 'lucide-react';

const AdminSettingsPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings className="text-muted" /> System Settings
                </h1>
                <p className="text-muted text-sm">Configure system preferences, user permissions, and thresholds.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="card">
                    <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} className="text-info" /> Security & Role Access
                    </div>
                    <div className="card-body" style={{ padding: '24px' }}>
                        <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>Manage system security access keys and token timeouts.</p>
                        <button className="btn btn-outline dashboard">Configure Roles</button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={18} className="text-warning" /> Notification Triggers
                    </div>
                    <div className="card-body" style={{ padding: '24px' }}>
                        <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>Define thresholds for critical stock warnings (default: 50 units).</p>
                        <button className="btn btn-outline dashboard">Adjust Limits</button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} className="text-success" /> System Backups
                    </div>
                    <div className="card-body" style={{ padding: '24px' }}>
                        <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>Schedule automated system database backups and data retention.</p>
                        <button className="btn btn-outline dashboard">Manage Backups</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
