import React from 'react';
import './Modals.css';

function LicenseModal({ isOpen, onClose }) {
  // الشرط ده ممتاز وبيمنع الكارت من الظهور تماماً في الـ DOM طول ما هو مقفول
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header-title">
          <i className="fa-solid fa-shield-halved"></i> التراخيص والرقابة القانونية العالمية
        </div>
        
        <p className="modal-body-text" style={{ marginBottom: '10px' }}>
          <strong>more x</strong> هي شركة استثمارية رائدة مقرها الرئيسي في إستونيا ولها مكاتب إدارية في تالين، ومدرجة مسبقاً في السوق الرئيسي لبورصة لندن للشركات المدرجة. تخضع المنصة لأطر رقابية صارمة وتدقيق مالي دوري من كبرى المنظمات في كافة القارات:
        </p>

        <div className="info-rows-container">
          <div className="info-row-item"><p className="row-text-content">الشركة مرخصة وخاضعة للرقابة من قبل هيئة الرقابة المالية الإستونية (EFSA)، بترخيص رقم 5.1-1/20.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">شركة more x هي شركة مرخصة ومنظمة من قبل الهيئة القبرصية للأوراق المالية والبورصات (CySEC) بموجب رخصة رقم 260/14.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">تحمل المنصة ترخيص رقم AFSL #417727 الصادر عن الهيئة الأسترالية للأوراق المالية والاستثمارات (ASIC).</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">مسجلة برقم FSP رقم 486226 الصادر عن هيئة الأسواق المالية (FMA) في نيوزيلندا.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">مزود خدمات مالية معتمد يحمل ترخيص رقم #47544 صادر عن سلطة سلوك القطاع المالي (FSCA) في جنوب أفريقيا.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">مرخصة ومنظمة بالكامل من قِبل سلطة الخدمات المالية في سيشل (FSA) بموجب ترخيص رقم SD059.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">تحمل ترخيص خدمات أسواق رأس المال من سلطة النقد في سنغافورة (MAS) برقم CMS100448.</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
          <div className="info-row-item"><p className="row-text-content">مرخصة ومقننة بالكامل تحت رقابة سلطة دبي للخدمات المالية (DFSA) برقم مرجعي (F005661).</p><i className="fa-solid fa-building-shield row-check-badge"></i></div>
        </div>
      </div>
    </div>
  );
}

export default LicenseModal;