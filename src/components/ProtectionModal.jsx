import React from 'react';

function ProtectionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <i className="fa-solid fa-lock protection-icon-top"></i>
        <div className="modal-header-title" style={{ justifyContent: 'center', borderBottom: 'none', marginBottom: '10px' }}>
          حماية أموال العملاء
        </div>
        <p className="protection-lead-text">
          عند فتح حساب، ستحتفظ <strong>more x</strong> بأموالك في حسابات بنكية منفصلة، وفقًا بقواعد حماية أموال العملاء بموجب قانون سوق الأوراق المالية الإستونية.
        </p>
        <div className="info-rows-container">
          <div className="info-row-item"><p className="row-text-content">يتم الاحتفاظ بجميع أموال العملاء في حساب مصرفي منفصل تماماً عن أموال الشركة المصاريف التشغيلية.</p><i className="fa-solid fa-circle-check row-leading-icon"></i></div>
          <div className="info-row-item"><p className="row-text-content">تستخدم more x أموالها الخاصة فقط للتحوط وتأمين الصفقات.</p><i className="fa-solid fa-circle-check row-leading-icon"></i></div>
          <div className="info-row-item"><p className="row-text-content">more x لا تحول أموال زبون تجزئة إلى أطراف تحوط أخرى.</p><i className="fa-solid fa-circle-check row-leading-icon"></i></div>
          <div className="info-row-item"><p className="row-text-content">المنصة محمية ومؤمنة ضد أي عجز مالي بالكامل.</p><i className="fa-solid fa-circle-check row-leading-icon"></i></div>
        </div>
      </div>
    </div>
  );
}

export default ProtectionModal;