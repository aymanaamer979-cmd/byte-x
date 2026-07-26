import React from 'react';
import './Support.css';
const Support = () => {
  return (
    <section className="support-section">
      <div className="support-card">
        <i className="fa-solid fa-headset support-icon"></i>
        <h2 className="support-title">دعمنا في خدمتك</h2>
        <p className="support-desc">خدمة عملاء احترافية من قبل فريق بشري جاهز لمساعدتك كلما احتجت إليهم.</p>
        <button className="btn-support" onClick={() => {
          const chatBtn = document.querySelector('.chat-trigger-btn');
          if(chatBtn) chatBtn.click();
        }}>
          <i className="fa-regular fa-comments"></i> ابدأ الدردشة المباشرة
        </button>
      </div>
    </section>
  );
};

export default Support;