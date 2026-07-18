import React from 'react';
import './Regulations.css';

function Regulations() {
  return (
    <section className="regulation-section" id="regulations">
      <h2 className="regulation-title">تحت رقابة هيئات ومنظمات مالية عالمية</h2>
      
      <div className="regulation-container">
        <div className="reg-item">
          <img src="/images/efsa.svg" alt="EFCA" className="reg-icon" />
          <p className="reg-label">هيئة الرقابه الماليه الاستونيه</p>
        </div>
        <div className="reg-item">
          <img src="/images/cysec.svg" alt="CySEC" className="reg-icon" />
          <p className="reg-label">لجنة الاوراق الماليه والبورصه القبرصيه</p>
        </div>
        <div className="reg-item">
          <img src="/images/cftc.svg" alt="CFTC" className="reg-icon" />
          <p className="reg-label">هيئة تداول السلع الاجله</p>
        </div>
        <div className="reg-item">
          <img src="/images/asic.svg" alt="ASIC" className="reg-icon" />
          <p className="reg-label">هيئة الاوراق الماليه والاستثمارات الاستراليه</p>
        </div>
        <div className="reg-item">
          <img src="/images/fma.svg" alt="FMA" className="reg-icon" />
          <p className="reg-label">هيئة الاوراق الماليه</p>
        </div>
        <div className="reg-item">
          <img src="/images/fsca.svg" alt="FSCA" className="reg-icon" />
          <p className="reg-label">هيئة مراقبة السلوك المالي</p>
        </div>
        <div className="reg-item">
          <img src="/images/sca.svg" alt="SCA" className="reg-icon" />
          <p className="reg-label">هيئة الاوراق الماليه والسلع</p>
        </div>
        <div className="reg-item">
          <img src="/images/dfsa.svg" alt="DFSA" className="reg-icon" />
          <p className="reg-label">سلطة دبي للخدمات الماليه</p>
        </div>
        <div className="reg-item">
          <img src="/images/jfsa.svg" alt="JFSA" className="reg-icon" />
          <p className="reg-label">وكالة الخدمات الماليه اليابانيه</p>
        </div>
        <div className="reg-item">
          <img src="/images/mas.svg" alt="MAS" className="reg-icon" />
          <p className="reg-label">سلطة النقد في سنغافورا</p>
        </div>
        <div className="reg-item">
          <img src="/images/fsa.svg" alt="FSA" className="reg-icon" />
          <p className="reg-label">هيئة الخدمات الماليه في سيشل</p>
        </div>
        <div className="reg-item">
          <img src="/images/scb.svg" alt="SCB" className="reg-icon" />
          <p className="reg-label">هيئة الاوراق الماليه في جزر البهاما</p>
        </div>
        <div className="reg-item">
          <img src="/images/bappebti.svg" alt="BAPPEBTI" className="reg-icon" />
          <p className="reg-label">هيئة تنظيم تداول السلع الاجله</p>
        </div>
        <div className="reg-item">
          <img src="/images/ciro.svg" alt="CIRO" className="reg-icon" />
          <p className="reg-label">الهيئة الكنديه لتنظيم الاستثمار</p>
        </div>
      </div>
    </section>
  );
}

export default Regulations;