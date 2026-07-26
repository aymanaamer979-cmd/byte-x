import React from 'react';

/**
 * TransactionHistoryLists
 * Component displaying the 4 column transaction panels for complete financial tracking.
 */
function TransactionHistoryLists({
  userHistory,
  selectedUser,
  formatDateTime,
  onUpdateDepositStatusDirect,
  onEditDepositAmount,
  onDeleteDeposit,
  onUpdateWithdrawalStatusDirect,
  onEditWithdrawalAmount,
  onDeleteWithdrawal,
  onEditRewardAmount,
  onDeleteReward,
  onEditProfitAmount,
  onDeleteProfit
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
          marginBottom: '16px', 
          color: '#00ffcc',
          fontWeight: '700'
        }}
      >
        📑 سجل العمليات والمعاملات المالية بالكامل
      </h3>
      
      {userHistory.loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: '#a9b5c8', fontSize: '14px' }}>
          ⏳ جاري تحميل كافة السجلات وتاريخ العمليات...
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Deposits Column */}
          <div style={columnContainerStyle}>
            <h4 style={columnHeaderStyle('#10b981')}>
              <span>📥 عمليات الإيداع</span>
              <span style={badgeStyle('rgba(16, 185, 129, 0.15)', '#10b981')}>
                {userHistory.deposits.length}
              </span>
            </h4>
            {userHistory.deposits.length === 0 ? (
              <p style={emptyTextStyle}>لا يوجد سجلات إيداع.</p>
            ) : (
              <div style={listScrollStyle}>
                {userHistory.deposits.map(dep => (
                  <div key={dep.id} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>${dep.amount}</span>
                      <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(dep.createdAt)}</span>
                    </div>
                    {dep.description && (
                      <p style={descriptionStyle('#10b981')}>الوصف: {dep.description}</p>
                    )}
                    {dep.txId && (
                      <p style={subTextStyle}>TxID: {dep.txId}</p>
                    )}
                    
                    {/* Controls */}
                    <div style={controlsRowStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: dep.status === 'approved' ? '#10b981' : dep.status === 'pending' ? '#fbbf24' : '#ef4444' }}>
                        {dep.status === 'approved' && 'مقبول ✓'}
                        {dep.status === 'reviewing' && 'تحت المراجعة 🔍'}
                        {dep.status === 'pending' && 'معلق ⏳'}
                        {dep.status === 'failed' && 'مرفوض ❌'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select 
                          value={dep.status || 'pending'}
                          onChange={(e) => onUpdateDepositStatusDirect(dep.id, selectedUser.id, dep.status || 'pending', e.target.value, dep.amount, dep.txId)}
                          style={selectInputStyle}
                        >
                          <option value="pending">⏳ معلق</option>
                          <option value="reviewing">🔍 مراجعة</option>
                          <option value="approved">✓ مقبول</option>
                          <option value="failed">❌ مرفوض</option>
                        </select>
                        <button 
                          onClick={() => onEditDepositAmount(dep.id, selectedUser.id, dep.status || 'pending', dep.amount, dep.txId || '')} 
                          style={editButtonStyle}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDeleteDeposit(dep.id, dep.amount)} 
                          style={deleteButtonStyle}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawals Column */}
          <div style={columnContainerStyle}>
            <h4 style={columnHeaderStyle('#ff4d4d')}>
              <span>📤 عمليات السحب</span>
              <span style={badgeStyle('rgba(239, 68, 68, 0.15)', '#ff4d4d')}>
                {userHistory.withdrawals.length}
              </span>
            </h4>
            {userHistory.withdrawals.length === 0 ? (
              <p style={emptyTextStyle}>لا يوجد سجلات سحب.</p>
            ) : (
              <div style={listScrollStyle}>
                {userHistory.withdrawals.map(wit => (
                  <div key={wit.id} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#ff4d4d', fontSize: '15px' }}>${wit.amount}</span>
                      <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(wit.createdAt)}</span>
                    </div>
                    {wit.description && (
                      <p style={descriptionStyle('#ff4d4d')}>الوصف: {wit.description}</p>
                    )}
                    {wit.address && (
                      <p style={subTextStyle}>العنوان: {wit.address}</p>
                    )}

                    {/* Controls */}
                    <div style={controlsRowStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: wit.status === 'approved' ? '#10b981' : wit.status === 'pending' ? '#fbbf24' : '#ef4444' }}>
                        {wit.status === 'approved' && 'مكتمل ✓'}
                        {wit.status === 'pending' && 'معلق ⏳'}
                        {wit.status === 'failed' && 'مرفوض ❌'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select 
                          value={wit.status || 'pending'}
                          onChange={(e) => onUpdateWithdrawalStatusDirect(wit.id, selectedUser.id, wit.status || 'pending', e.target.value, wit.amount, wit.address)}
                          style={selectInputStyle}
                        >
                          <option value="pending">⏳ معلق</option>
                          <option value="approved">✓ مقبول</option>
                          <option value="failed">❌ مرفوض</option>
                        </select>
                        <button 
                          onClick={() => onEditWithdrawalAmount(wit.id, selectedUser.id, wit.status || 'pending', wit.amount, wit.address || '')} 
                          style={editButtonStyle}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDeleteWithdrawal(wit.id, wit.amount)} 
                          style={deleteButtonStyle}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rewards Column */}
          <div style={columnContainerStyle}>
            <h4 style={columnHeaderStyle('#fbbf24')}>
              <span>🎁 سجل المكافآت</span>
              <span style={badgeStyle('rgba(251, 191, 36, 0.15)', '#fbbf24')}>
                {userHistory.rewards.length}
              </span>
            </h4>
            {userHistory.rewards.length === 0 ? (
              <p style={emptyTextStyle}>لا يوجد سجلات مكافآت.</p>
            ) : (
              <div style={listScrollStyle}>
                {userHistory.rewards.map(rew => (
                  <div key={rew.id} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '15px' }}>${rew.amount}</span>
                      <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(rew.createdAt)}</span>
                    </div>
                    {rew.description && (
                      <p style={descriptionStyle('#fbbf24')}>الوصف: {rew.description}</p>
                    )}

                    {/* Controls */}
                    <div style={controlsRowStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#fbbf24' }}>مكتملة ✓</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => onEditRewardAmount(rew.id, selectedUser.id, rew.amount)} 
                          style={editButtonStyle}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDeleteReward(rew.id, rew.amount)} 
                          style={deleteButtonStyle}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profits Column */}
          <div style={columnContainerStyle}>
            <h4 style={columnHeaderStyle('#00cfc2')}>
              <span>📈 الأرباح المحققة</span>
              <span style={badgeStyle('rgba(0, 207, 194, 0.15)', '#00cfc2')}>
                {userHistory.profits.length}
              </span>
            </h4>
            {userHistory.profits.length === 0 ? (
              <p style={emptyTextStyle}>لا يوجد سجلات أرباح.</p>
            ) : (
              <div style={listScrollStyle}>
                {userHistory.profits.map(prof => (
                  <div key={prof.id} style={itemCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#00cfc2', fontSize: '15px' }}>${prof.amount}</span>
                      <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(prof.createdAt)}</span>
                    </div>
                    {prof.description && (
                      <p style={descriptionStyle('#00cfc2')}>الوصف: {prof.description}</p>
                    )}

                    {/* Controls */}
                    <div style={controlsRowStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#00cfc2' }}>مكتملة ✓</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => onEditProfitAmount(prof.id, selectedUser.id, prof.amount)} 
                          style={editButtonStyle}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDeleteProfit(prof.id, prof.amount)} 
                          style={deleteButtonStyle}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// Styling Constants
const columnContainerStyle = {
  background: '#0d0f15', 
  border: '1px solid #1e2530', 
  borderRadius: '10px', 
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const columnHeaderStyle = (color) => ({
  fontSize: '14px', 
  margin: '0', 
  borderBottom: '1px solid #1e2530', 
  paddingBottom: '10px', 
  color, 
  display: 'flex', 
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: '700'
});

const badgeStyle = (bg, color) => ({
  fontSize: '11px',
  background: bg,
  color,
  padding: '2px 8px',
  borderRadius: '10px',
  fontWeight: 'bold'
});

const emptyTextStyle = {
  color: '#8892b0', 
  fontSize: '12px', 
  textAlign: 'center', 
  padding: '24px 0'
};

const listScrollStyle = {
  maxHeight: '450px', 
  overflowY: 'auto', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '10px',
  paddingRight: '2px'
};

const itemCardStyle = {
  padding: '12px', 
  background: '#151824', 
  border: '1px solid #232534', 
  borderRadius: '8px', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '8px'
};

const descriptionStyle = (color) => ({
  fontSize: '12px', 
  color: '#a9b5c8', 
  margin: 0, 
  borderRight: `3px solid ${color}`, 
  paddingRight: '6px',
  lineHeight: '1.4'
});

const subTextStyle = {
  fontSize: '10px', 
  color: '#687590', 
  margin: 0,
  fontFamily: 'monospace'
};

const controlsRowStyle = {
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginTop: '4px', 
  borderTop: '1px solid #1e2530', 
  paddingTop: '8px'
};

const selectInputStyle = {
  background: '#0d0f15', 
  color: '#ffffff', 
  border: '1px solid #2e3040', 
  borderRadius: '4px', 
  fontSize: '11px', 
  padding: '2px 4px', 
  cursor: 'pointer',
  outline: 'none'
};

const editButtonStyle = {
  background: 'rgba(56, 189, 248, 0.1)', 
  border: 'none', 
  color: '#38bdf8', 
  fontSize: '11px', 
  padding: '4px 8px', 
  borderRadius: '4px', 
  cursor: 'pointer',
  fontWeight: 'bold'
};

const deleteButtonStyle = {
  background: 'rgba(239, 68, 68, 0.15)', 
  border: 'none', 
  color: '#f87171', 
  fontSize: '11px', 
  padding: '4px 8px', 
  borderRadius: '4px', 
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default TransactionHistoryLists;
