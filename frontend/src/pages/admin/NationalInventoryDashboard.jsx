import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNationalDashboard } from '../../api/adminInventoryService';
import { Building2, AlertTriangle, Activity, Database, Search, ArrowRight, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import './NationalInventoryDashboard.css';

const NationalInventoryDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async (isLoading = false) => {
        if (!isLoading) setLoading(true);

        const { success, data, error } = await getNationalDashboard();
        
        if (success) {
            setDashboardData(data);
            setError(null);
        } else {
            setError(error || "Could not load dashboard data.");
        }
        setLoading(false);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>Loading...</div>;
    if (error) return <div style={{ backgroundColor: 'var(--color-critical-bg)', color: 'var(--color-critical)', padding: '16px', borderRadius: 'var(--radius-md)' }}>{error}</div>;
    if (!dashboardData) return null;

    // Extract unique districts
    const districts = [...new Set(dashboardData.hospitals.map(h => h.district))].filter(Boolean).sort();

    // Filter hospitals
    const filteredHospitals = dashboardData.hospitals.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDistrict = filterDistrict === '' || h.district === filterDistrict;
        return matchesSearch && matchesDistrict;
    });

    // Chart Data formatting
    const chartData = dashboardData.nationalStock.map(item => ({
        name: item.bloodType,
        units: item.units,
        color: item.status === 'Critical' ? '#ef4444' : item.status === 'Low' ? '#f59e0b' : '#10b981'
    }));

    return (
        <div className="national-inventory-container">
            <div className="inventory-header-section">
                <div>
                    <h1 style={{ marginBottom: '4px' }}>National Blood Inventory</h1>
                    <p className="text-muted text-sm">
                        Aggregated view of all hospital blood banks. Last updated: {new Date(dashboardData.updatedAt).toLocaleString()}
                    </p>
                </div>
                <button 
                    onClick={fetchDashboard}
                    className="btn btn-outline dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Activity size={16} /> Refresh Data
                </button>
            </div>

            {/* Top Stat Cards */}
            <div className="stats-grid">
                <StatCard 
                    title="Total Available Units" 
                    value={dashboardData.totalUnits} 
                    Icon={Database} 
                    colorClass="text-info" 
                />
                <StatCard 
                    title="Connected Hospitals" 
                    value={dashboardData.totalHospitals} 
                    Icon={Building2} 
                    colorClass="text-success" 
                />
                <StatCard 
                    title="Pending Camp Blood" 
                    value={dashboardData.pendingCampBlood} 
                    Icon={Truck} 
                    colorClass="text-warning"
                    onClick={() => navigate('/admin/camp-blood')}
                />
                <StatCard 
                    title="Active Expiry Alerts" 
                    value={Object.values(dashboardData.alertSummary || {}).reduce((a, b) => a + b, 0)} 
                    Icon={AlertTriangle} 
                    colorClass="text-critical"
                    onClick={() => navigate('/admin/expiry-alerts')}
                />
            </div>

            {/* Main Content Area */}
            <div className="inventory-main-grid">
                
                {/* Left Col: Chart */}
                <div className="chart-card-wrapper">
                    <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>National Stock by Blood Type</h2>
                    <div className="chart-container-box">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="blood-type-grid-summary">
                        {dashboardData.nationalStock.map(item => (
                            <div key={item.bloodType} className="blood-summary-item">
                                <span className="blood-summary-label">{item.bloodType}</span>
                                <span className="blood-summary-val">{item.units} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>units</span></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Hospital Table */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="table-header-toolbar">
                            <h2 style={{ margin: 0, fontSize: '18px' }}>Hospital Inventories</h2>
                            <div className="table-filters-wrapper">
                                <select 
                                    className="select-filter-input"
                                    value={filterDistrict}
                                    onChange={(e) => setFilterDistrict(e.target.value)}
                                >
                                    <option value="">All Districts</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="search-filter-box">
                                    <Search size={16} className="search-filter-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search hospital..."
                                        className="search-filter-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DataTable 
                        columns={['Hospital', 'District', 'Total Stock', 'Status', 'Expiring ≤ 7d', 'Action']}
                        data={filteredHospitals}
                        emptyMessage="No hospitals found matching your criteria."
                        renderRow={(hospital) => (
                            <tr key={hospital.id}>
                                <td><strong>{hospital.name}</strong></td>
                                <td>{hospital.district}</td>
                                <td>{hospital.totalUnits} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>units</span></td>
                                <td><StatusBadge status={hospital.status} /></td>
                                <td>
                                    {hospital.expiringSoon > 0 ? (
                                        <span style={{ color: 'var(--color-warning)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertTriangle size={14} /> {hospital.expiringSoon}
                                        </span>
                                    ) : (
                                        <span className="text-muted">0</span>
                                    )}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => navigate(`/admin/inventory/hospital/${hospital.id}`)}
                                        className="btn btn-outline dashboard"
                                        style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                                    >
                                        View <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default NationalInventoryDashboard;
