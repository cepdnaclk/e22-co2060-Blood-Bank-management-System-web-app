import React, { useState, useEffect } from 'react';
import { getHospitals, createHospital } from '../../api/adminHospitalService';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Swal from 'sweetalert2';
import { Plus, Building } from 'lucide-react';

const HospitalManagement = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        hosName: '',
        address: '',
        phone: ''
    });

    const loadHospitals = async () => {
        setLoading(true);
        try {
            const data = await getHospitals();
            setHospitals(data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load hospitals', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHospitals();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createHospital(formData);
            Swal.fire('Success', 'Hospital registered successfully', 'success');
            setShowModal(false);
            setFormData({ hosName: '', address: '', phone: '' });
            loadHospitals();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.detail || 'Failed to register hospital', 'error');
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                    <Building size={24} /> Hospital Management
                </h2>
                <button 
                    className="dashboard btn btn-primary" 
                    onClick={() => setShowModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={16} /> Register Hospital
                </button>
            </div>

            {loading ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Loading hospitals...</p>
            ) : (
                <DataTable 
                    columns={['ID', 'Name', 'Address', 'Phone', 'Status']}
                    data={hospitals}
                    emptyMessage="No hospitals registered yet."
                    renderRow={(h) => (
                        <tr key={h.id}>
                            <td>{h.id}</td>
                            <td style={{ fontWeight: '500' }}>{h.hosName}</td>
                            <td>{h.address || '-'}</td>
                            <td>{h.phone || '-'}</td>
                            <td><StatusBadge status="active" /></td>
                        </tr>
                    )}
                />
            )}

            {/* Simple Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-text-main)' }}>Register New Hospital</h3>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: 'var(--color-text-main)' }}>Hospital Name *</label>
                                <input 
                                    type="text" 
                                    name="hosName" 
                                    required 
                                    value={formData.hosName} 
                                    onChange={handleChange} 
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: 'var(--color-text-main)' }}>Address</label>
                                <textarea 
                                    name="address" 
                                    rows="3" 
                                    value={formData.address} 
                                    onChange={handleChange} 
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: 'var(--color-text-main)' }}>Phone Number</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button 
                                    type="button" 
                                    className="dashboard btn btn-outline" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="dashboard btn btn-primary"
                                >
                                    Register Hospital
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalManagement;
