import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, MessageSquare, Plus, Search, Eye, EyeOff, Download, Send, Filter, Key } from 'lucide-react';
import {
  fetchAllDoctors,
  deleteDoctor,
  createDoctorCredentials,
  sendMessageToDoctor,
  createDoctor,
  updateDoctor,
} from '../../api/doctorService';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    specialization: '',
    hospital: '',
    status: '',
  });
  
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [editingDoctor, setEditingDoctor] = useState(null);

  useEffect(() => {
    loadDoctors();
  }, []);
  
  useEffect(() => {
    applyFiltersAndSort();
  }, [doctors, filters, searchTerm]);

  const loadDoctors = async () => {
    setLoading(true);
    const result = await fetchAllDoctors();
    if (result.success) {
      setDoctors(result.data);
      setFilteredDoctors(result.data);
    }
    setLoading(false);
  };

  const applyFiltersAndSort = () => {
    let result = [...doctors];
    
    if (filters.specialization) {
      result = result.filter(d => d.specialization === filters.specialization);
    }
    if (filters.hospital) {
      result = result.filter(d => d.hospital === filters.hospital);
    }
    if (filters.status) {
      result = result.filter(d => 
        filters.status === 'active' ? d.is_active : !d.is_active
      );
    }
    
    if (searchTerm.trim() !== '') {
      result = result.filter(d => 
        d.id.toString().includes(searchTerm) ||
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDoctors(result);
  };
  
  const getUniqueSpecializations = () => [...new Set(doctors.map(d => d.specialization).filter(Boolean))];
  const getUniqueHospitals = () => [...new Set(doctors.map(d => d.hospital).filter(Boolean))];
  
  const handleDelete = async (doctorId, doctorName) => {
    if (window.confirm(`Delete ${doctorName}? This action cannot be undone.`)) {
      const result = await deleteDoctor(doctorId);
      if (result.success) {
        alert('Doctor deleted successfully');
        loadDoctors();
      } else {
        alert('Failed to delete doctor: ' + result.message);
      }
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedDoctors.length === 0) return alert('Please select doctors to delete');
    if (!window.confirm(`Delete ${selectedDoctors.length} doctor(s)? This action cannot be undone.`)) return;
    
    setLoading(true);
    for (const doctorId of selectedDoctors) {
      await deleteDoctor(doctorId);
    }
    setSelectedDoctors([]);
    loadDoctors();
  };
  
  const handleBulkMessage = async () => {
    if (selectedDoctors.length === 0) return alert('Please select doctors to message');
    
    const subject = prompt('Enter message subject:');
    if (!subject) return;
    const message = prompt('Enter message:');
    if (!message) return;
    
    setLoading(true);
    for (const doctorId of selectedDoctors) {
      await sendMessageToDoctor(doctorId, subject, message);
    }
    setSelectedDoctors([]);
    alert(`Message sent to ${selectedDoctors.length} doctor(s)`);
    loadDoctors();
  };
  
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Specialization', 'Phone', 'License', 'Hospital', 'Status'];
    const data = filteredDoctors.map(d => [
      d.id, d.full_name, d.email, d.specialization || 'N/A', d.phone || 'N/A',
      d.license_number || 'N/A', d.hospital || 'N/A', d.is_active ? 'Active' : 'Inactive',
    ]);
    
    const csv = [headers.join(','), ...data.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  
  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctors(prev =>
      prev.includes(doctorId) ? prev.filter(id => id !== doctorId) : [...prev, doctorId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedDoctors.length === filteredDoctors.length) {
      setSelectedDoctors([]);
    } else {
      setSelectedDoctors(filteredDoctors.map(d => d.id));
    }
  };

  const handleCreateCredentials = async () => {
    if (!tempPassword) return alert('Please enter a temporary password');
    const result = await createDoctorCredentials(selectedDoctor.id, tempPassword);
    if (result.success) {
      alert(`Credentials created! Username: ${selectedDoctor.email}\nPassword: ${tempPassword}`);
      setShowCredentialsModal(false);
      setTempPassword('');
    } else {
      alert('Failed to create credentials: ' + result.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject || !messageText) return alert('Please fill in subject and message');
    const result = await sendMessageToDoctor(selectedDoctor.id, messageSubject, messageText);
    if (result.success) {
      alert('Message sent successfully');
      setShowMessageModal(false);
      setMessageSubject('');
      setMessageText('');
    } else {
      alert('Failed to send message: ' + result.message);
    }
  };
  
  const handleEditClick = (doctor) => {
    setEditingDoctor(doctor);
    setShowAddModal(true);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Doctors Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="dashboard btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add New Doctor
            </button>
            <button className="dashboard btn btn-outline" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Export CSV
            </button>
            <button className="dashboard btn btn-outline" onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} /> Filters
            </button>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search by ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>

          {showFilters && (
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: 'var(--color-secondary-light)', borderRadius: 'var(--radius-md)' }}>
              <select value={filters.specialization} onChange={(e) => setFilters({...filters, specialization: e.target.value})} style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="">All Specializations</option>
                {getUniqueSpecializations().map(spec => <option key={spec} value={spec}>{spec}</option>)}
              </select>
              <select value={filters.hospital} onChange={(e) => setFilters({...filters, hospital: e.target.value})} style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="">All Hospitals</option>
                {getUniqueHospitals().map(hospital => <option key={hospital} value={hospital}>{hospital}</option>)}
              </select>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="dashboard btn btn-outline" onClick={() => setFilters({specialization: '', hospital: '', status: ''})}>Clear Filters</button>
            </div>
          )}

          {selectedDoctors.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', padding: '10px', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedDoctors.length} doctor(s) selected</span>
              <button className="dashboard btn" style={{ backgroundColor: 'var(--color-info)', color: 'white', display: 'flex', gap: '8px' }} onClick={handleBulkMessage}>
                <Send size={16} /> Message Selected
              </button>
              <button className="dashboard btn" style={{ backgroundColor: 'var(--color-critical)', color: 'white', display: 'flex', gap: '8px' }} onClick={handleBulkDelete}>
                <Trash2 size={16} /> Delete Selected
              </button>
            </div>
          )}

          {loading ? <p>Loading doctors...</p> : (
            <DataTable 
              columns={[
                <input type="checkbox" onChange={handleSelectAll} checked={selectedDoctors.length === filteredDoctors.length && filteredDoctors.length > 0} />,
                'ID', 'Name', 'Email', 'Specialization', 'Phone', 'License #', 'Status', 'Actions'
              ]}
              data={filteredDoctors}
              emptyMessage="No doctors found"
              renderRow={(doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <input type="checkbox" checked={selectedDoctors.includes(doctor.id)} onChange={() => handleSelectDoctor(doctor.id)} />
                  </td>
                  <td>#{doctor.id}</td>
                  <td><strong>{doctor.full_name}</strong></td>
                  <td>{doctor.email}</td>
                  <td>{doctor.specialization || '-'}</td>
                  <td>{doctor.phone || '-'}</td>
                  <td>{doctor.license_number || '-'}</td>
                  <td><StatusBadge status={doctor.is_active ? 'Active' : 'Inactive'} /></td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="dashboard btn btn-outline" title="Edit" onClick={() => handleEditClick(doctor)} style={{ padding: '6px' }}><Edit2 size={16} /></button>
                    <button className="dashboard btn btn-outline" title="Credentials" onClick={() => { setSelectedDoctor(doctor); setShowCredentialsModal(true); }} style={{ padding: '6px' }}><Key size={16} /></button>
                    <button className="dashboard btn btn-outline" title="Message" onClick={() => { setSelectedDoctor(doctor); setShowMessageModal(true); }} style={{ padding: '6px' }}><MessageSquare size={16} /></button>
                    <button className="dashboard btn btn-outline" title="Delete" onClick={() => handleDelete(doctor.id, doctor.full_name)} style={{ padding: '6px', color: 'var(--color-critical)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddDoctorModal 
          onClose={() => { setShowAddModal(false); setEditingDoctor(null); }} 
          onSuccess={loadDoctors}
          editingDoctor={editingDoctor}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'var(--color-surface)' }}>
            <div className="card-header">
              <h3 className="card-title">Create Login Credentials</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p><strong>Doctor:</strong> {selectedDoctor?.full_name}</p>
              <div>
                <label className="stat-label">Temporary Password</label>
                <div style={{ display: 'flex', position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Username: {selectedDoctor?.email}</small>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="dashboard btn btn-outline" onClick={() => setShowCredentialsModal(false)}>Cancel</button>
                <button className="dashboard btn btn-primary" onClick={handleCreateCredentials}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'var(--color-surface)' }}>
            <div className="card-header">
              <h3 className="card-title">Send Message to Doctor</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p><strong>Doctor:</strong> {selectedDoctor?.full_name}</p>
              <div>
                <label className="stat-label">Subject</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                />
              </div>
              <div>
                <label className="stat-label">Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows="4"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="dashboard btn btn-outline" onClick={() => setShowMessageModal(false)}>Cancel</button>
                <button className="dashboard btn btn-primary" onClick={handleSendMessage}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddDoctorModal = ({ onClose, onSuccess, editingDoctor }) => {
  const [formData, setFormData] = useState(
    editingDoctor ? {
      username: editingDoctor.username || '',
      email: editingDoctor.email || '',
      full_name: editingDoctor.full_name || '',
      specialization: editingDoctor.specialization || '',
      license_number: editingDoctor.license_number || '',
      phone: editingDoctor.phone || '',
      hospital: editingDoctor.hospital || '',
    } : {
      username: '', email: '', full_name: '', specialization: '', license_number: '', phone: '', hospital: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!editingDoctor && !formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let result;
      if (editingDoctor) {
        result = await updateDoctor(editingDoctor.id, formData);
      } else {
        result = await createDoctor(formData);
      }
      
      if (result.success) {
        alert(`Doctor ${editingDoctor ? 'updated' : 'added'} successfully`);
        onSuccess();
        onClose();
      } else {
        alert(`Failed to ${editingDoctor ? 'update' : 'add'} doctor: ` + result.message);
        if (result.errors) setErrors(result.errors);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '600px', backgroundColor: 'var(--color-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header">
          <h3 className="card-title">{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="stat-label">Full Name *</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
              {errors.full_name && <small style={{ color: 'var(--color-critical)' }}>{errors.full_name}</small>}
            </div>
            <div>
              <label className="stat-label">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingDoctor} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
              {errors.email && <small style={{ color: 'var(--color-critical)' }}>{errors.email}</small>}
            </div>
            <div>
              <label className="stat-label">Username {!editingDoctor && '*'}</label>
              <input type="text" name="username" value={formData.username} onChange={handleInputChange} required={!editingDoctor} disabled={!!editingDoctor} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
              {errors.username && <small style={{ color: 'var(--color-critical)' }}>{errors.username}</small>}
            </div>
            <div>
              <label className="stat-label">Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
              {errors.phone && <small style={{ color: 'var(--color-critical)' }}>{errors.phone}</small>}
            </div>
            <div>
              <label className="stat-label">Specialization *</label>
              <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
              {errors.specialization && <small style={{ color: 'var(--color-critical)' }}>{errors.specialization}</small>}
            </div>
            <div>
              <label className="stat-label">License Number</label>
              <input type="text" name="license_number" value={formData.license_number} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
            </div>
            <div>
              <label className="stat-label">Hospital</label>
              <input type="text" name="hospital" value={formData.hospital} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="dashboard btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="dashboard btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Doctor'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorsList;
