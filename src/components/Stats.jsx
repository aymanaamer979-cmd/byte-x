import React from 'react';
import './Stats.css'

function Stats() {
  return (
    <div className="main-grid-container">
      <div className="stats-container">
        <div className="stat-item"><div className="stat-number">+140K</div><div className="stat-label">مستثمر نشط عالمياً</div></div>
        <div className="stat-item"><div className="stat-number">$32.8M</div><div className="stat-label">إجمالي المبالغ المستثمرة</div></div>
        <div className="stat-item"><div className="stat-number">+99.9%</div><div className="stat-label">معدل الحماية وآمن العمليات</div></div>
      </div>
      
      <div className="stat-item phone-trust-item">
        <div className="trust-flex">
          <img src="/images/trust.svg" alt="Trust Icon" className="stat-icon" style={{ marginBottom: 0 }} />
          <span className="trust-rating">4.6</span>
        </div>
        <div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>تقييم Trustpilot</div>
      </div>

      <div className="trust-container">
        <div className="stat-item"><img src="/images/bulls.svg" alt="Bulls Partner" className="stat-icon" /><div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>شريك رسمي</div></div>
        <div className="stat-item"><img src="/images/stock.svg" alt="Stock Listed" className="stat-icon" /><div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>مدرج منذ 2013</div></div>
        <div className="stat-item desktop-trust-item">
          <div className="trust-flex">
            <img src="/images/trust.svg" alt="Trust Icon" className="stat-icon" style={{ marginBottom: 0 }} />
            <span className="trust-rating">4.6</span>
          </div>
          <div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>تقييم Trustpilot</div>
        </div>
      </div>
    </div>
  );
}

export default Stats;