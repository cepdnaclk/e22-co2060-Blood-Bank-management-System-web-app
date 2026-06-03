import React from 'react';
import { useApi } from "../../hooks/userApi.js";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import { Plus, Edit2 } from "lucide-react";

const InventoryPage = () => {
  const { data: inventory, loading, error } = useApi('/inventory/');

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <div>Error loading inventory</div>;

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Live Blood Stock</h2>
        <button className="dashboard btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <DataTable 
        columns={['Blood Group', 'Total Units', 'Status', 'Last Updated', 'Actions']}
        data={inventory || []}
        emptyMessage="No inventory data available."
        renderRow={(item) => (
          <tr key={item.id}>
            <td>
              <span style={{ 
                backgroundColor: 'var(--color-critical-bg)', 
                color: 'var(--color-critical)', 
                padding: '4px 12px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 600 
              }}>
                {item.blood_group}
              </span>
            </td>
            <td><strong>{item.units} ml</strong></td>
            <td>
              <StatusBadge status={item.units > 50 ? 'Adequate' : 'Low Stock'} />
            </td>
            <td className="text-muted text-sm">{item.last_updated}</td>
            <td style={{ textAlign: 'right' }}>
              <button className="dashboard btn btn-outline" title="Edit" style={{ padding: '6px' }}>
                <Edit2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default InventoryPage;