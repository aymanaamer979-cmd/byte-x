import React from 'react';

/**
 * ManualFinancialActions
 * High-fidelity control panel containing action triggers to adjust balances or inject transactions.
 */
function ManualFinancialActions({
  selectedUser,
  onUpdateField,
  onAddManualDeposit,
  onAddManualReward,
  onAddManualProfit,
  onAddManualWithdrawal
}) {
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
          marginBottom: '14px', 
          color: '#00ffcc',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>⚙️ لوحة التعديل والتحكم المالي الفوري</span>
      </h3>

      {/* Instant update buttons */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '12px', 
          marginBottom: '24px' 
        }}
      >
        <button 
          onClick={() => onUpdateField('balance', selectedUser.balance, 'الرصيد المتاح')}
          style={adjustmentButtonStyle('#10b981')}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#a9b5c8' }}>💸 الرصيد المتاح</span>
          <div style={counterStyle('#10b981')}>
            ${Number(selectedUser.balance || 0).toFixed(2)}
          </div>
        </button>

        <button 
          onClick={() => onUpdateField('totalDeposits', selectedUser.investments || selectedUser.totalDeposits, 'إجمالي الإيداع')}
          style={adjustmentButtonStyle('#3b82f6')}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#a9b5c8' }}>📥 إجمالي الإيداع</span>
          <div style={counterStyle('#3b82f6')}>
            ${Number(selectedUser.investments || selectedUser.totalDeposits || 0).toFixed(2)}
          </div>
        </button>

        <button 
          onClick={() => onUpdateField('earnings', selectedUser.profits || selectedUser.earnings, 'الأرباح الكلية')}
          style={adjustmentButtonStyle('#00cfc2')}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#a9b5c8' }}>📈 الأرباح المتراكمة</span>
          <div style={counterStyle('#00cfc2')}>
            ${Number(selectedUser.profits || selectedUser.earnings || 0).toFixed(2)}
          </div>
        </button>
      </div>

      {/* Manual Transaction Injection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <button 
          onClick={onAddManualDeposit} 
          style={actionButtonStyle('rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)', '#10b981')}
        >
          ➕ إضافة إيداع
        </button>
        <button 
          onClick={onAddManualReward} 
          style={actionButtonStyle('rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.3)', '#fbbf24')}
        >
          🎁 إضافة مكافأة
        </button>
        <button 
          onClick={onAddManualProfit} 
          style={actionButtonStyle('rgba(0, 207, 194, 0.1)', 'rgba(0, 207, 194, 0.3)', '#00cfc2')}
        >
          📈 إضافة أرباح
        </button>
        <button 
          onClick={onAddManualWithdrawal} 
          style={actionButtonStyle('rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)', '#ef4444')}
        >
          ➖ إضافة سحب
        </button>
      </div>
    </div>
  );
}

// Reusable styling generators
const adjustmentButtonStyle = (glowColor) => ({
  padding: '12px 14px',
  background: '#0d0f15',
  border: `1px solid ${glowColor}30`,
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '12px',
  cursor: 'pointer',
  textAlign: 'right',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  transition: 'all 0.2s',
  boxShadow: `0 2px 5px rgba(0,0,0,0.2), 0 0 8px ${glowColor}0a`
});

const counterStyle = (color) => ({
  background: '#06080d',
  border: `1px solid ${color}40`,
  borderRadius: '6px',
  padding: '6px 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '6px',
  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)',
  fontFamily: 'monospace',
  fontSize: '15px',
  fontWeight: '800',
  color,
  letterSpacing: '0.5px',
  width: '100%',
  boxSizing: 'border-box'
});

const actionButtonStyle = (bg, border, color) => ({
  padding: '12px 8px',
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: '8px',
  color,
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center'
});

export default ManualFinancialActions;
