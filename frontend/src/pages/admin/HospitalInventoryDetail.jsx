import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHospitalInventoryDetail } from '../../api/adminInventoryService';
import { ArrowLeft, MapPin, Phone, AlertCircle, Droplet, Clock, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import './HospitalInventoryDetail.css';

const HospitalInventoryDetail = () => {
    const { hospitalId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDetail();
    }, [hospitalId]);

    const fetchDetail = async (isLoading = false) => {
        if (!isLoading) setLoading(true);
        const response = await getHospitalInventoryDetail(hospitalId);
        if (response.success) {
            setData(response.data);
        } else {
            setError(response.error || "Failed to load hospital inventory");
        }
        setLoading(false);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>Loading...</div>;
    if (error) return <div style={{ backgroundColor: 'var(--color-critical-bg)', color: 'var(--color-critical)', padding: '16px', borderRadius: 'var(--radius-md)' }}>{error}</div>;
    if (!data) return null;

    const { hospital, stockSummary, inventory, alertSummary, expiringSoon } = data;

    // Filter individual units
    const filteredInventory = inventory.filter(item => 
        item.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Chart formatting
    const chartData = stockSummary.map(item => ({
        name: item.bloodType,
        units: item.units,
        color: item.status === 'Critical' ? '#ef4444' : item.status === 'Low' ? '#f59e0b' : '#10b981'
    }));

    return (
        <div className="hospital-inventory-container">
            {/* Header */}
            <div className="hospital-header-section">
                <button 
                    onClick={() => navigate('/admin/inventory')}
                    className="btn btn-outline dashboard"
                    style={{ padding: '8px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0 }}>{hospital.name}</h1>
                    <div className="hospital-meta-info">
                        <span className="meta-item"><MapPin size={14} /> {hospital.address || hospital.district}</span>
                        {hospital.phone && <span className="meta-item"><Phone size={14} /> {hospital.phone}</span>}
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="stats-grid">
                <StatCard 
                    title="Total Available Units" 
                    value={`${stockSummary.reduce((acc, curr) => acc + curr.units, 0)} Units`} 
                    Icon={Droplet} 
                    colorClass="text-info" 
                />
                <StatCard 
                    title="Expiring Soon (≤ 7 days)" 
                    value={expiringSoon} 
                    Icon={Clock} 
                    colorClass="text-warning" 
                />
                <StatCard 
                    title="Active Expiry Alerts" 
                    value={Object.values(alertSummary).reduce((a, b) => a + b, 0)} 
                    Icon={AlertCircle} 
                    colorClass="text-critical" 
                    subtitle="Click to view alerts"
                    onClick={() => navigate('/admin/expiry-alerts')}
                />
            </div>

            {/* Content Split */}
            <div className="hospital-details-grid">
                
                {/* Chart */}
                <div className="chart-card-wrapper">
                    <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Stock Breakdown</h2>
                    <div className="chart-container-box">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="units" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Individual Units Table */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="table-header-title-section">
                            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Droplet size={18} style={{ color: 'var(--color-primary)' }} /> Individual Blood Units
                            </h2>
                            <div className="search-hosp-input-box">
                                <Search size={14} className="search-hosp-icon" />
                                <input
                                    type="text"
                                    placeholder="Search units..."
                                    className="search-hosp-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable 
                        columns={['Blood Type', 'Collected', 'Expiry Date', 'Source', 'Status']}
                        data={filteredInventory}
                        emptyMessage="No blood units found in inventory."
                        renderRow={(item) => (
                            <tr key={item.id}>
                                <td>
                                    <span className="blood-type-circle">
                                        {item.bloodType}
                                    </span>
                                </td>
                                <td>{item.collectedDate}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                            fontWeight: item.daysToExpiry <= 7 ? '600' : '400',
                                            color: item.daysToExpiry <= 3 ? 'var(--color-critical)' : item.daysToExpiry <= 7 ? 'var(--color-warning)' : 'var(--color-text-main)'
                                        }}>
                                            {item.expiryDate}
                                        </span>
                                        {item.daysToExpiry <= 7 && (
                                            <span className="expiry-time-left">
                                                <Clock size={12} /> {item.daysToExpiry}d left
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{item.sourceType}</td>
                                <td><StatusBadge status={item.status} /></td>
                            </tr>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default HospitalInventoryDetail;
