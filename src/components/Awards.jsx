import React from 'react';
import './Awards.css';
const Awards = () => {
  return (
    <section className="awards-section">
      <h2 className="awards-title">أفضل الجوائز في المجال</h2>
      <div className="awards-container">
        <div className="award-item">
          <i className="fa-solid fa-trophy award-icon-fa"></i>
          <div className="award-name">fxempire</div>
          <div className="award-desc">افضل وسيط اوروبي لعام 2025</div>
        </div>
        <div className="award-item">
          <i className="fa-solid fa-award award-icon-fa"></i>
          <div className="award-name">forex broker</div>
          <div className="award-desc">الافضل من حيث سهولة الاستخدام لعام 2025</div>
        </div>
        <div className="award-item">
          <i className="fa-solid fa-earth-americas award-icon-fa"></i>
          <div className="award-name">advfn</div>
          <div className="award-desc">الافضل لمقدم خدمات ماليه حول العالم 2025</div>
        </div>
      </div>
    </section>
  );
};

export default Awards;