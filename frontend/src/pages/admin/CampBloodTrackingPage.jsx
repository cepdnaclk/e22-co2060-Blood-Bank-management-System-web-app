import React, { useEffect, useState } from 'react';
import { getPendingCampBlood, receiveCampBlood, verifyCampBlood } from '../../api/adminInventoryService';
import { Truck, CheckCircle, XCircle, Clock, MapPin, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from '../../components/ui/DataTable';
import './CampBloodTrackingPage.css';

const CampBloodTrackingPage = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true);
        }
        const { success, data } = await getPendingCampBlood();
        if (success) {
            setCollections(data.collections);
        }
        setLoading(false);
    };

    const handleReceive = async (collectionId) => {
        const { success, error } = await receiveCampBlood(collectionId);
        if (success) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Blood unit received and marked for quality check',
                showConfirmButton: false,
                timer: 3000
            });
            fetchCollections();
        } else {
            Swal.fire('Error', error || 'Failed to receive blood', 'error');
        }
    };

    const handleVerify = async (collectionId, reject = false) => {
        let rejectionReason = "";
        let temp = 4.0;

        if (reject) {
            const { value: reason } = await Swal.fire({
                title: 'Reject Blood Unit',
                input: 'text',
                inputLabel: 'Reason for rejection',
                inputPlaceholder: 'e.g. Temperature deviation, bag damaged',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) return 'You need to write a reason!';
                }
            });
            if (!reason) return;
            rejectionReason = reason;
        } else {
            const { value: t } = await Swal.fire({
                title: 'Verify Blood Unit',
                input: 'number',
                inputLabel: 'Storage Temperature (°C)',
                inputValue: 4.0,
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) return 'You need to enter a temperature!';
                }
            });
            if (!t) return;
            temp = parseFloat(t);
        }

        const { success, error } = await verifyCampBlood(collectionId, {
            reject: reject,
            rejection_reason: rejectionReason,
            temperature: temp
        });

        if (success) {
            Swal.fire({
                icon: reject ? 'info' : 'success',
                title: reject ? 'Blood Rejected' : 'Blood Verified',
                text: reject ? 'Unit marked as rejected.' : 'Unit successfully added to hospital inventory.',
            });
            fetchCollections();
        } else {
            Swal.fire('Error', error || 'Failed to verify blood', 'error');
        }
    };

    const filteredCollections = collections.filter(c => 
        c.campTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.destinationHospital && c.destinationHospital.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && collections.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>Loading...</div>;

    return (
        <div className="camp-blood-tracking-container">
            <div className="tracking-header-section">
                <div>
                    <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck className="text-info" /> Incoming Camp Blood
                    </h1>
                    <p className="text-muted text-sm">
                        Track and verify blood units arriving from donation camps.
                    </p>
                </div>
                <div className="search-filter-box">
                    <Search size={16} className="search-filter-icon" />
                    <input
                        type="text"
                        placeholder="Search camps or hospitals..."
                        className="search-filter-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <DataTable 
                columns={['Blood Source', 'Blood Type', 'Destination', 'Status', 'Actions']}
                data={filteredCollections}
                emptyMessage="No incoming blood collections found."
                renderRow={(col) => (
                    <tr key={col.id}>
                        <td>
                            <strong>{col.campTitle}</strong>
                            <div className="text-muted text-xs" style={{ marginTop: '4px' }}>
                                Donor: {col.donorName}
                            </div>
                        </td>
                        <td>
                            <span className="blood-type-circle">
                                {col.bloodType}
                            </span>
                        </td>
                        <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} className="text-muted" />
                                {col.destinationHospital ? col.destinationHospital.name : 'Unassigned'}
                            </div>
                            {col.transitStartedAt && (
                                <div className="text-muted text-xs" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> Dispatched: {new Date(col.transitStartedAt).toLocaleTimeString()}
                                </div>
                            )}
                        </td>
                        <td>
                            {col.status === 'collected' && <span className="transit-badge">At Camp</span>}
                            {col.status === 'in_transit' && <span className="transit-badge transit"><Truck size={12}/> Transit</span>}
                            {col.status === 'received' && <span className="transit-badge received"><Clock size={12}/> Quality Check</span>}
                        </td>
                        <td>
                            {col.status === 'collected' && (
                                <span className="text-muted text-xs" style={{ fontStyle: 'italic' }}>Waiting for dispatch</span>
                            )}
                            {col.status === 'in_transit' && (
                                <button 
                                    onClick={() => handleReceive(col.id)}
                                    className="btn btn-primary dashboard"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    Mark Received
                                </button>
                            )}
                            {col.status === 'received' && (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => handleVerify(col.id, false)}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                    >
                                        <CheckCircle size={14} /> Pass
                                    </button>
                                    <button 
                                        onClick={() => handleVerify(col.id, true)}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px', borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
                                    >
                                        <XCircle size={14} /> Fail
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

export default CampBloodTrackingPage;
