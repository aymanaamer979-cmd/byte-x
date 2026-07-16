import React, { useState } from 'react';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "مرحباً بك في منصة More X. كيف يمكنني مساعدتك اليوم بخصوص حسابك الاستثماري أو الإيداعات؟", type: "incoming" }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // إضافة رسالة المستخدم
    const userMsg = { text: inputValue, type: "outgoing" };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    // رد تلقائي ذكي بعد ثانية كمحاكاة للدعم
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "شكراً لتواصلك معنا. جاري تحويلك الآن لأحد ممثلي الدعم المالي لمتابعة طلبك...",
        type: "incoming"
      }]);
    }, 1000);
  };

  return (
    <div className="floating-chat-widget">
      {isOpen && (
        <div className="chat-box-card" id="chatBoxCard">
          <div className="chat-box-header">
            <div className="chat-profile-info">
              <div className="chat-avatar"><i className="fa-solid fa-headset"></i></div>
              <div>
                <span className="chat-user-name">الدعم المالي المباشر</span>
                <span className="chat-status-text"><i className="fa-solid fa-circle" style={{ fontSize: '8px', color: '#02c076' }}></i> متصل الآن</span>
              </div>
            </div>
            <button className="chat-box-close" onClick={() => setIsOpen(false)}>
              <i className="fa-solid fa-minus"></i>
            </button>
          </div>

          <div className="chat-messages-body">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-msg ${msg.type}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-box-footer">
            <input 
              type="text" 
              className="chat-input-field" 
              placeholder="اكتب رسالتك هنا..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              autoComplete="off"
            />
            <button className="chat-send-btn" onClick={handleSendMessage}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
      
      <button className="chat-trigger-btn" onClick={() => setIsOpen(!isOpen)}>
        <i className="fa-solid fa-headset"></i>
      </button>
    </div>
  );
}

export default ChatWidget;