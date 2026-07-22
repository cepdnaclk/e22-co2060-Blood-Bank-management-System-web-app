import React, { useEffect, useState } from 'react';
import { getAllBloodRequests, updateBloodRequestStatus } from '../../api/adminInventoryService';
import { FileText, CheckCircle, XCircle, Search, Stethoscope } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const BloodRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async (isLoading = false) => {
        if (!isLoading) setLoading(true);
        const { success, data } = await getAllBloodRequests();
        if (success) {
            setRequests(data);
        }
        setLoading(false);
    };

    const handleApprove = async (id, requestedUnits) => {
        Swal.fire({
            title: 'Approve Request',
            html: `
                <div style="text-align: left; margin-bottom: 8px;">
                    <label style="font-weight: 600;">Units to Approve (Requested: ${requestedUnits})</label>
                    <input id="swal-units" type="number" class="swal2-input" value="${requestedUnits}" style="width: 100%; margin-top: 4px;">
                </div>
                <div style="text-align: left;">
                    <label style="font-weight: 600;">Approval Note</label>
                    <input id="swal-note" type="text" class="swal2-input" placeholder="e.g. Dispatched in cold storage" style="width: 100%; margin-top: 4px;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: 'var(--color-success)',
            confirmButtonText: 'Approve & Allocate',
            preConfirm: () => {
                const units = document.getElementById('swal-units').value;
                const note = document.getElementById('swal-note').value;
                if (!units) {
                    Swal.showValidationMessage('Please specify approved units');
                }
                return { status: 'APPROVED', units_approved: parseInt(units), approval_note: note };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await updateBloodRequestStatus(id, result.value);
                if (res.success) {
                    Swal.fire('Approved!', 'Request approved and units allocated.', 'success');
                    fetchRequests();
                } else {
                    Swal.fire('Error', res.error?.detail || 'Could not approve request.', 'error');
                }
            }
        });
    };

    const handleReject = (id) => {
        Swal.fire({
            title: 'Reject Request',
            input: 'text',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'e.g. Insufficient inventory stock available',
            showCancelButton: true,
            confirmButtonColor: 'var(--color-critical)',
            confirmButtonText: 'Reject Request',
            preConfirm: (note) => {
                if (!note) Swal.showValidationMessage('A reason is required.');
                return { status: 'REJECTED', rejection_note: note };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await updateBloodRequestStatus(id, result.value);
                if (res.success) {
                    Swal.fire('Rejected', 'The request has been rejected.', 'info');
                    fetchRequests();
                } else {
                    Swal.fire('Error', 'Could not reject request.', 'error');
                }
            }
        });
    };

    const filteredRequests = requests.filter(req => 
        req.blood_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.doctor_name && req.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.hospital && req.hospital.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>Loading...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText className="text-info" /> Doctor Blood Requests
                    </h1>
                    <p className="text-muted text-sm">Review and fulfill blood requests from regional medical officers.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '6px 12px 6px 32px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    />
                </div>
            </div>

            <DataTable
                columns={['Date Requested', 'Doctor / Hospital', 'Blood Group', 'Units Requested', 'Priority', 'Status', 'Actions']}
                data={filteredRequests}
                emptyMessage="No blood requests found."
                renderRow={(req) => (
                    <tr key={req.id}>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                            <strong>{req.doctor_name || `Dr. #${req.doctor}`}</strong>
                            <div className="text-muted text-xs">{req.hospital || '-'}</div>
                        </td>
                        <td>
                            <span className="blood-type-circle">{req.blood_group}</span>
                        </td>
                        <td>{req.units_requested}</td>
                        <td>
                            <StatusBadge status={req.priority_level} />
                        </td>
                        <td>
                            <StatusBadge status={req.status} />
                        </td>
                        <td>
                            {req.status === 'PENDING' ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className="btn btn-outline dashboard" 
                                        style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', padding: '4px 8px', fontSize: '12px' }}
                                        onClick={() => handleApprove(req.id, req.units_requested)}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        className="btn btn-outline dashboard" 
                                        style={{ borderColor: 'var(--color-critical)', color: 'var(--color-critical)', padding: '4px 8px', fontSize: '12px' }}
                                        onClick={() => handleReject(req.id)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <span className="text-muted text-xs">
                                    {req.status === 'REJECTED' ? `Reason: ${req.rejection_note || 'N/A'}` : `Allocated: ${req.units_approved}`}
                                </span>
                            )}
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default BloodRequestsPage;
