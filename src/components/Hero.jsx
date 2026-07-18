import React from 'react';
import './Hero.css'

function Hero({ setIsPlansOpen }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>تتحرك الأسواق بسرعة.<br /><span>فلا تفوتها !</span></h1>
        <div className="sub-text">استثمر بربح يصل الي 3000%</div>
        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => setIsPlansOpen(true)}>ابدأ الاستثمار الآن</button>
          <button className="btn-secondary" onClick={() => setIsPlansOpen(true)}>شاهد خطط الأرباح</button>
        </div>
      </div>
      <div className="hero-image-container">
        <img src="/images/shart.webp" alt="Market Chart" className="hero-image" />
      </div>
    </section>
  );
}

export default Hero;