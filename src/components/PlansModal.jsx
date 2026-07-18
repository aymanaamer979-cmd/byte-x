import React from 'react';
import './Modals.css';

function PlansModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header-title">
          <i className="fa-solid fa-chart-pie"></i> خطط الحسابات الاستثمارية والأرباح
        </div>
        <p className="modal-body-text" style={{ marginBottom: '15px' }}>
          اختر الخطة الاستثمارية المناسبة لأهدافك المالية وابدأ في جني الأرباح اليومية المدعومة بالذكاء الاصطناعي:
        </p>

        <div className="plans-grid">
          {/* الخطة الأولى */}
          <div className="plan-card-item">
            <div className="plan-name">الخطة الأساسية</div>
            <div className="plan-profit">حتى 150% ربح</div>
            <ul className="plan-details">
              <li><i className="fa-solid fa-check"></i> الحد الأدنى للإيداع: $100</li>
              <li><i className="fa-solid fa-check"></i> سحب أرباح أسبوعي</li>
              <li><i className="fa-solid fa-check"></i> دعم فني مالي 24/5</li>
            </ul>
            <button className="btn-plan-select" onClick={() => alert('جاري الانتقال لفتح حساب على الخطة الأساسية...')}>ابدأ الآن</button>
          </div>

          {/* الخطة الثانية (المميزة) */}
          <div className="plan-card-item featured">
            <div className="plan-name">خطة النمو المتقدمة</div>
            <div className="plan-profit">حتى 800% ربح</div>
            <ul className="plan-details">
              <li><i className="fa-solid fa-star" style={{ color: '#f3ba2f' }}></i> الحد الأدنى للإيداع: $1,000</li>
              <li><i className="fa-solid fa-check"></i> سحب أرباح يومي فوري</li>
              <li><i className="fa-solid fa-check"></i> مدير حسابات خاص متاح 24/7</li>
            </ul>
            <button className="btn-plan-select" onClick={() => alert('جاري الانتقال لفتح حساب على خطة النمو المتقدمة...')}>الأكثر طلباً</button>
          </div>

          {/* الخطة الثالثة */}
          <div className="plan-card-item">
            <div className="plan-name">خطة VIP الاحترافية</div>
            <div className="plan-profit">حتى 3000% ربح</div>
            <ul className="plan-details">
              <li><i className="fa-solid fa-check"></i> الحد الأدنى للإيداع: $10,000</li>
              <li><i className="fa-solid fa-check"></i> عوائد مركبة يومية قصوى</li>
              <li><i className="fa-solid fa-check"></i> تغطية تأمينية شاملة للمخاطر</li>
            </ul>
            <button className="btn-plan-select" onClick={() => alert('جاري الانتقال لفتح حساب على خطة VIP...')}>تواصل مع الإدارة</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlansModal;