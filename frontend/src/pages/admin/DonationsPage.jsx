import React, { useState } from 'react';
import { Award, Search, Download } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';

const DonationsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    // Mock donation history since we do not have a robust backend completed endpoint for overall donation list yet
    const [donations] = useState([
        { id: 1, donorName: 'John Doe', bloodGroup: 'A+', units: 1, date: '2026-07-15', location: 'City Hall Blood Drive', type: 'Camp' },
        { id: 2, donorName: 'Jane Smith', bloodGroup: 'O-', units: 1, date: '2026-07-18', location: 'National Hospital Colombo', type: 'Direct' },
        { id: 3, donorName: 'Robert Johnson', bloodGroup: 'B+', units: 1, date: '2026-07-20', location: 'Central Blood Camp', type: 'Camp' },
    ]);

    const handleExport = () => {
        alert("Exporting donations history list to CSV...");
    };

    const filteredDonations = donations.filter(d => 
        d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award className="text-success" /> Completed Donations
                    </h1>
                    <p className="text-muted text-sm">Monitor all processed blood donations from campaigns and direct walks.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search donations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '6px 12px 6px 32px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                        />
                    </div>
                    <button onClick={handleExport} className="btn btn-outline dashboard" style={{ gap: '8px' }}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <DataTable
                columns={['Donor', 'Blood Group', 'Units', 'Date', 'Donation Source', 'Type']}
                data={filteredDonations}
                emptyMessage="No donations found."
                renderRow={(donation) => (
                    <tr key={donation.id}>
                        <td><strong>{donation.donorName}</strong></td>
                        <td>
                            <span className="blood-type-circle">{donation.bloodGroup}</span>
                        </td>
                        <td>{donation.units} Unit(s)</td>
                        <td>{donation.date}</td>
                        <td>{donation.location}</td>
                        <td>
                            <span className={`status-badge ${donation.type === 'Camp' ? 'info' : 'success'}`}>
                                {donation.type}
                            </span>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};

export default DonationsPage;
