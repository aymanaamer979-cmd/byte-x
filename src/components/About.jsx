import React from 'react';
import './About.css'

function About({ setIsLicenseOpen, setIsProtectionOpen, setIsPlansOpen }) {
  return (
    <section id="about" className="about-section">
      <div className="about-card">
        <h2 className="about-title">
          <i className="fa-solid fa-circle-info"></i> من نحن
        </h2>
        <p className="about-text">
          <strong>more x</strong> هي مجموعة عالمية متعددة الأصول في مجال التكنولوجيا المالية تعمل على تشغيل منصات تداول قائمة على التكنولوجيا. تقدم more x للعملاء مجموعة من منتجات التداول، بما في ذلك عقود الفروقات ("CFD") وتداول الأسهم، وفي الولايات المتحدة، تقدم more x تداول العقود الآجلة. تتمتع more x بإدراج متميز في السوق الرئيسية لبورصة لندن كما تستثمر في أدوات البرمجة والذكاء الاصطناعي والشركات والمصانع وترعى نوادي رياضية والتسويق الإلكتروني مما يخلف أرباحاً كبيرة مقارنة برأس المال المستثمر.
        </p>
        
        <div className="about-inline-buttons">
          {/* ربط الأزرار مباشرة بالـ States اللي بتفتح المودالز */}
          <button className="btn-about-action license-btn" onClick={() => setIsLicenseOpen(true)}>
            <i className="fa-solid fa-shield-halved"></i> التراخيص والرقابة
          </button>
          <button className="btn-about-action protection-btn" onClick={() => setIsProtectionOpen(true)}>
            <i className="fa-solid fa-lock"></i> حماية أموال العملاء
          </button>
          <button className="btn-about-action plans-btn" onClick={() => setIsPlansOpen(true)}>
            <i className="fa-solid fa-chart-pie"></i> الخطط الاستثمارية
          </button>
        </div>
        
        <div className="about-features">
          <div className="feat-box"><i class="fa-solid fa-microchip"></i><span>برمجيات ذكاء اصطناعي</span></div>
          <div className="feat-box"><i class="fa-solid fa-chart-line"></i><span>أصول مالية متعددة</span></div>
          <div className="feat-box"><i class="fa-solid fa-building-columns"></i><span>مدرجة ببورصة لندن</span></div>
        </div>
      </div>
    </section>
  );
}

export default About;