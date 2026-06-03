import React from 'react';

const DataTable = ({ columns, data, emptyMessage = "No records found.", renderRow }) => {
  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th key={index}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((row, index) => renderRow(row, index))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                    <span className="text-muted">{emptyMessage}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
