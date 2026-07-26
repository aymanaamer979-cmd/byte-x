import React from 'react';

/**
 * FinancialQuickStats
 * Simple, high-contrast, beautiful dashboard stats cards for the selected user.
 */
function FinancialQuickStats({ selectedUser }) {
  if (!selectedUser) return null;

  const totalDeposits = selectedUser.investments || selectedUser.totalDeposits || 0;
  const profits = selectedUser.profits || selectedUser.earnings || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      
      {/* Balance */}
      <div style={cardStyle('#10b981')}>
        <span style={labelStyle}>الرصيد الحالي المتاح</span>
        <strong style={valueStyle('#10b981')}>
          ${selectedUser.balance?.toFixed(2) || '0.00'}
        </strong>
      </div>

      {/* Total Deposits */}
      <div style={cardStyle('#3b82f6')}>
        <span style={labelStyle}>إجمالي الإيداعات</span>
        <strong style={valueStyle('#3b82f6')}>
          ${Number(totalDeposits).toFixed(2)}
        </strong>
      </div>

      {/* Profits */}
      <div style={cardStyle('#00cfc2')}>
        <span style={labelStyle}>الأرباح المتراكمة</span>
        <strong style={valueStyle('#00cfc2')}>
          ${Number(profits).toFixed(2)}
        </strong>
      </div>

      {/* Deposit Bonus */}
      <div style={cardStyle('#fbbf24')}>
        <span style={labelStyle}>بونص الإيداع الحالي</span>
        <strong style={valueStyle('#fbbf24')}>
          ${selectedUser.depositBonus || 0}
        </strong>
      </div>

    </div>
  );
}

const cardStyle = (glowColor) => ({
  background: 'linear-gradient(135deg, #161a23 0%, #11131a 100%)',
  border: '1px solid #243043',
  borderRadius: '12px',
  padding: '16px 20px',
  textAlign: 'center',
  boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 10px ${glowColor}0a`,
  transition: 'transform 0.2s',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '6px'
});

const labelStyle = {
  color: '#a9b5c8',
  fontSize: '13px',
  fontWeight: '500'
};

const valueStyle = (color) => ({
  fontSize: '26px',
  color,
  fontWeight: '800',
  letterSpacing: '-0.5px'
});

export default FinancialQuickStats;
