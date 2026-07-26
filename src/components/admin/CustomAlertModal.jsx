import React, { useState } from 'react';

/**
 * CustomAlertModal
 * A beautifully styled, glassmorphic modal to replace standard browser alert, confirm, and prompt.
 * Centered in the screen, styled to match the dark aesthetic of More X.
 */
function CustomAlertModal({ isOpen, title = 'More X', message, type = 'alert', placeholder = '', defaultValue = '', onConfirm, onCancel }) {
  const [inputValue, setInputValue] = useState(defaultValue || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 6, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
        direction: 'rtl'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div 
        style={{
          background: 'linear-gradient(135deg, #161a26 0%, #0d0f17 100%)',
          border: '1px solid #2e3d56',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 204, 0.05)',
          animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px 20px',
            borderBottom: '1px solid #243043',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.5px' }}>{title}</span>
            <span style={{ fontSize: '11px', background: 'rgba(0, 255, 204, 0.1)', color: '#00ffcc', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>إشعار آمن</span>
          </div>
          <button 
            onClick={onCancel || onConfirm}
            style={{
              background: 'none',
              border: 'none',
              color: '#8892b0',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
            onMouseLeave={(e) => e.target.style.color = '#8892b0'}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <p 
            style={{
              color: '#e2e8f0',
              fontSize: '15px',
              lineHeight: '1.6',
              margin: '0 0 20px 0',
              textAlign: 'right',
              fontWeight: '500',
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>

          {type === 'prompt' && (
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder={placeholder || 'اكتب القيمة هنا...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: '#0a0d14',
                  border: '1px solid #3b4e6b',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  textAlign: 'right',
                  transition: 'all 0.2s',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00ffcc';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(0, 255, 204, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#3b4e6b';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
                }}
              />
            </div>
          )}

          {/* Footer Controls */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid #1e2530',
              paddingTop: '16px',
              marginTop: '8px'
            }}
          >
            {type !== 'alert' && (
              <button 
                type="button"
                onClick={onCancel}
                style={{
                  background: '#1a1f2e',
                  border: '1px solid #2e3d56',
                  color: '#a9b5c8',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#242a3e';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1a1f2e';
                  e.target.style.color = '#a9b5c8';
                }}
              >
                إلغاء
              </button>
            )}
            <button 
              type="submit"
              style={{
                background: type === 'confirm' && message.includes('حذف') ? '#ef4444' : '#00ffcc',
                color: type === 'confirm' && message.includes('حذف') ? '#ffffff' : '#0b0c10',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: type === 'confirm' && message.includes('حذف') ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(0, 255, 204, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.opacity = 0.9;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.opacity = 1;
              }}
            >
              {type === 'confirm' && message.includes('حذف') ? 'حذف نهائي' : 'موافق'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomAlertModal;
