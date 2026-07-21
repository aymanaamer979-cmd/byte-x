import React from 'react';

/**
 * InvestorInfo
 * Compact grid-based investor details section to maximize screen space.
 */
function InvestorInfo({ selectedUser }) {
  if (!selectedUser) return null;

  return (
    <div 
      style={{ 
        background: 'linear-gradient(145deg, #11131c, #161824)', 
        border: '1px solid #243043', 
        borderRadius: '14px', 
        padding: '20px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      <h3 
        style={{ 
          fontSize: '16px', 
          borderBottom: '1px solid #2e3040', 
          paddingBottom: '10px', 
          marginBottom: '16px', 
          color: '#00ffcc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '700'
        }}
      >
        <span>📌 ملف بيانات المستثمر</span>
      </h3>

      {/* Grid of multi-column parameters to save space */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px', 
          fontSize: '13px'
        }}
      >
        <div style={infoItemStyle}>
          <span style={labelStyle}>👤 الاسم الكامل:</span>
          <span style={valueStyle}>{selectedUser.displayName || selectedUser.name || '—'}</span>
        </div>

        <div style={infoItemStyle}>
          <span style={labelStyle}>📧 البريد الإلكتروني:</span>
          <span style={valueStyle}>{selectedUser.email || '—'}</span>
        </div>

        <div style={infoItemStyle}>
          <span style={labelStyle}>📞 الهاتف المحقّق:</span>
          <span style={{ ...valueStyle, color: selectedUser.phone ? '#10b981' : '#f87171' }}>
            {selectedUser.phone || 'غير مسجل'}
          </span>
        </div>

        <div style={infoItemStyle}>
          <span style={labelStyle}>🗓️ تاريخ التسجيل:</span>
          <span style={valueStyle}>
            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Inline styles for high-fidelity component Look & Feel
const infoItemStyle = {
  background: '#0d0f15',
  border: '1px solid #1e2530',
  borderRadius: '8px',
  padding: '10px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
};

const labelStyle = {
  color: '#8892b0',
  fontWeight: '500'
};

const valueStyle = {
  color: '#ffffff',
  fontWeight: '600',
  wordBreak: 'break-all'
};

export default InvestorInfo;
