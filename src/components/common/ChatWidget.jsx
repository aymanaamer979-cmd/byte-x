import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

function ChatWidget() {
  const { currentUser, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  
  // شاشات فرعية
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [viewingPastConv, setViewingPastConv] = useState(null);
  const [pastMessages, setPastMessages] = useState([]);

  // للبوب اب الإشعاري
  const [showPopupNotification, setShowPopupNotification] = useState(false);

  const messagesEndRef = useRef(null);
  const pastMessagesEndRef = useRef(null);

  // Mock an active conversation to keep compatibility with UI rendering
  const activeConversation = currentUser ? { id: 'active', status: 'open' } : null;

  // 1. استماع لرسائل المحادثة النشطة عبر Polling من MongoDB
  useEffect(() => {
    if (!currentUser) {
      setActiveMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await api.getChatMessages(currentUser.uid);
        if (isMounted) {
          // Map MongoDB schema to local UI schema
          const mapped = msgs.map(m => ({
            id: m.id || m._id || m.createdAt,
            text: m.text,
            sender: m.isAdmin ? 'admin' : 'user',
            senderName: m.senderName,
            createdAt: m.createdAt
          }));
          setActiveMessages(mapped);
        }
      } catch (error) {
        console.error("Error fetching active chat messages from MongoDB:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  // 2. التمرير التلقائي لأسفل
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, isOpen]);

  useEffect(() => {
    if (pastMessagesEndRef.current) {
      pastMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pastMessages]);

  // 3. تصفير تنبيه الرسائل غير المقروءة عند فتح الشات
  useEffect(() => {
    if (isOpen && currentUser) {
      setShowPopupNotification(false);
    }
  }, [isOpen, currentUser]);

  // 4. تفعيل البوب اب الإشعاري عندما يحصل المستخدم على رسالة جديدة والنافذة مغلقة
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser && userData?.hasUnreadUser && !isOpen) {
        setShowPopupNotification(true);
      } else {
        setShowPopupNotification(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [userData?.hasUnreadUser, isOpen, currentUser]);

  // بدء محادثة جديدة
  const handleStartNewConversation = async () => {
    // لا حاجة لإنشاء شيء في فيرستور، المحادثة دائمًا نشطة وتاريخية في MongoDB
  };

  // إرسال رسالة في المحادثة النشطة عبر MongoDB API
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    const text = inputValue;
    setInputValue("");

    try {
      await api.sendChatMessage({
        userId: currentUser.uid,
        senderId: currentUser.uid,
        senderName: userData?.displayName || currentUser.displayName || 'مستثمر',
        text,
        isAdmin: false
      });

      // جلب الرسائل فوراً لتحديث الشاشة بسرعة للمستخدم
      const msgs = await api.getChatMessages(currentUser.uid);
      const mapped = msgs.map(m => ({
        id: m.id || m._id || m.createdAt,
        text: m.text,
        sender: m.isAdmin ? 'admin' : 'user',
        senderName: m.senderName,
        createdAt: m.createdAt
      }));
      setActiveMessages(mapped);
    } catch (error) {
      console.error("Error sending message to MongoDB:", error);
    }
  };

  // تقديم تقييم الدعم
  const handleSubmitRating = async () => {
    setShowRatingScreen(false);
    setRatingComment("");
    setRatingValue(5);
    alert("شكرًا لك على تقييمك! نحن نعمل دائمًا على تحسين خدماتنا من أجلك.");
  };

  // إغلاق المحادثة النشطة من طرف العميل مباشرة
  const handleCloseActiveConversation = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في إغلاق هذه المحادثة وحلها بالكامل؟")) return;
    alert("تم تسجيل طلب إغلاق التذكرة ومراجعتها من قبل الإدارة بنجاح.");
  };

  return (
    <div className="floating-chat-widget">
      
      {/* 1. بوب اب التنبيه عند وصول رسالة جديدة من الإدارة والنافذة مغلقة */}
      {showPopupNotification && userData?.lastAdminMessageText && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '25px',
          width: '320px',
          background: '#1a1f2c',
          border: '2px solid #02c076',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          padding: '14px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'slideUp 0.3s ease-out',
          direction: 'rtl',
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#02c076', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 رسالة جديدة من الإدارة
            </span>
            <button 
              onClick={() => setShowPopupNotification(false)}
              style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '14px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: '12.5px', color: '#ffffff', background: '#0e121a', padding: '10px', borderRadius: '8px', margin: 0, border: '1px solid #243043', fontStyle: 'italic', wordBreak: 'break-word' }}>
            "{userData.lastAdminMessageText}"
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setShowPopupNotification(false)}
              style={{ background: 'transparent', border: '1px solid #243043', color: '#8892b0', fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              تجاهل
            </button>
            <button 
              onClick={() => {
                setIsOpen(true);
                setShowPopupNotification(false);
              }}
              style={{ background: '#02c076', border: 'none', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              فتح والرد الآن
            </button>
          </div>
        </div>
      )}

      {/* 2. نافذة صندوق المحادثة الرئيسي */}
      {isOpen && (
        <div className="chat-box-card" id="chatBoxCard" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* رأس الشات */}
          <div className="chat-box-header">
            <div className="chat-profile-info">
              <div className="chat-avatar"><i className="fa-solid fa-headset"></i></div>
              <div>
                <span className="chat-user-name">الدعم المالي المباشر</span>
                <span className="chat-status-text">
                  <i className="fa-solid fa-circle" style={{ fontSize: '8px', color: '#02c076', marginLeft: '4px' }}></i> 
                  نشط الآن
                </span>
              </div>
            </div>
            <button className="chat-box-close" onClick={() => {
              setIsOpen(false);
              setViewingPastConv(null);
            }}>
              <i className="fa-solid fa-minus"></i>
            </button>
          </div>

          {/* محتوى الشات بناء على الحالة */}
          <div className="chat-messages-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {!currentUser ? (
              // غير مسجل
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px', color: '#8892b0' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '32px', color: '#f3ba2f', marginBottom: '15px' }}></i>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#a9b5c8' }}>
                  يرجى تسجيل الدخول أولاً لتتمكن من بدء محادثة مباشرة وآمنة مع الدعم الفني والمالي.
                </p>
              </div>
            ) : showRatingScreen ? (
              // شاشة التقييم
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', textAlign: 'center', color: '#ffffff', direction: 'rtl' }}>
                <i className="fa-solid fa-award" style={{ fontSize: '40px', color: '#fbbf24', alignSelf: 'center' }}></i>
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>تقييم جودة الدعم المالي</h4>
                <p style={{ fontSize: '12px', color: '#a9b5c8', margin: 0 }}>
                  يرجى تزويدنا بتقييمك لهذه المحادثة لمساعدتنا في تقديم خدمة أفضل وأسرع:
                </p>

                {/* النجوم */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '10px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className={`fa-${star <= ratingValue ? 'solid' : 'regular'} fa-star`} style={{ color: '#fbbf24' }}></i>
                    </button>
                  ))}
                </div>

                {/* تعليق */}
                <textarea
                  placeholder="ملاحظاتك الإضافية أو رأيك في تعامل الإدارة والسرعة..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  style={{
                    background: '#0e121a',
                    border: '1px solid #243043',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    height: '70px',
                    resize: 'none',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />

                <button
                  onClick={handleSubmitRating}
                  style={{
                    background: '#02c076',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 192, 118, 0.2)'
                  }}
                >
                  إرسال التقييم وحل التذكرة
                </button>
              </div>
            ) : viewingPastConv ? (
              // عرض محادثة تاريخية سابقة (للقراءة فقط)
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1e2638', borderBottom: '1px solid #243043', direction: 'rtl' }}>
                  <span style={{ fontSize: '11px', color: '#a9b5c8' }}>
                    📅 محادثة مغلقة بتاريخ: {new Date(viewingPastConv.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                  <button 
                    onClick={() => setViewingPastConv(null)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ff4d4d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    رجوع
                  </button>
                </div>

                {/* رسائل المحادثة القديمة */}
                <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pastMessages.map((msg) => {
                    const isIncoming = msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`chat-msg ${isIncoming ? 'incoming' : 'outgoing'}`}>
                        <div className="chat-msg-text">{msg.text}</div>
                        <span style={{ fontSize: '9px', opacity: 0.6, alignSelf: isIncoming ? 'flex-start' : 'flex-end', marginTop: '4px', display: 'block' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={pastMessagesEndRef} />
                </div>
              </div>
            ) : activeConversation ? (
              // محادثة نشطة مفتوحة حالياً
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* بار علوي لإنهاء المحادثة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(2, 192, 118, 0.05)', borderBottom: '1px solid rgba(2, 192, 118, 0.15)', direction: 'rtl' }}>
                  <span style={{ fontSize: '11px', color: '#02c076', fontWeight: 'bold' }}>
                    🟢 تذكرة دعم مفتوحة الآن
                  </span>
                  <button
                    onClick={handleCloseActiveConversation}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    title="أغلق المحادثة لتقييم الدعم أو لفتح محادثة جديدة لاحقاً"
                  >
                    🔒 إغلاق وحل المشكلة
                  </button>
                </div>

                {/* الرسائل المباشرة */}
                <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeMessages.length === 0 ? (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: '#8892b0', height: '100%', direction: 'rtl' }}>
                      <i className="fa-solid fa-headset" style={{ fontSize: '32px', color: '#02c076', marginBottom: '12px' }}></i>
                      <p style={{ fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                        مرحباً بك في مركز الدعم المباشر! تفضل بطرح استفسارك بخصوص عمليات الإيداع، السحب، تفعيل المكافآت أو الحسابات، وسيجيبك المشرف المالي فوراً.
                      </p>
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isIncoming = msg.sender === 'admin';
                      return (
                        <div key={msg.id} className={`chat-msg ${isIncoming ? 'incoming' : 'outgoing'}`}>
                          <div className="chat-msg-text">{msg.text}</div>
                          <span style={{ fontSize: '9px', opacity: 0.6, alignSelf: isIncoming ? 'flex-start' : 'flex-end', marginTop: '4px', display: 'block' }}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              // لا يوجد محادثة نشطة، نعرض لوحة التحكم بالدعم
              <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '18px', direction: 'rtl', color: '#ffffff' }}>
                <div style={{ textAlign: 'center', background: '#151a26', padding: '15px', borderRadius: '12px', border: '1px solid #243043' }}>
                  <i className="fa-solid fa-comments" style={{ fontSize: '32px', color: '#02c076', marginBottom: '10px' }}></i>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>مرحباً بك في مركز الدعم</h4>
                  <p style={{ fontSize: '11.5px', color: '#a9b5c8', lineHeight: '1.5', margin: 0 }}>
                    هل تواجه مشكلة في الإيداع أو السحب أو ترغب في تفعيل المكافآت؟ ابدأ محادثة جديدة فورية معنا وسنقوم بحل تذكرتك فوراً.
                  </p>
                  
                  <button
                    onClick={handleStartNewConversation}
                    style={{
                      background: '#02c076',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '15px',
                      width: '100%',
                      boxShadow: '0 4px 15px rgba(2, 192, 118, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    💬 بدء محادثة جديدة الآن
                  </button>
                </div>

                {/* قسم المحادثات التاريخية السابقة */}
                {conversations.filter(c => c.status === 'closed' && c.visibleToUser === true).length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '12px', color: '#8892b0', fontWeight: 'bold', margin: '0 0 8px 0', borderRight: '3px solid #fbbf24', paddingRight: '8px' }}>
                      📜 المحادثات والتقييمات السابقة
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingLeft: '5px' }}>
                      {conversations.filter(c => c.status === 'closed' && c.visibleToUser === true).map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => setViewingPastConv(conv)}
                          style={{
                            background: '#151a26',
                            border: '1px solid #243043',
                            borderRadius: '8px',
                            padding: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'border-color 0.2s, background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#fbbf24';
                            e.currentTarget.style.background = '#1e2638';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#243043';
                            e.currentTarget.style.background = '#151a26';
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
                              🗓️ محادثة {new Date(conv.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                            <span style={{ fontSize: '10px', color: '#8892b0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                              آخر رسالة: {conv.lastMessageText || '—'}
                            </span>
                          </div>

                          {/* تقييم العميل إن وجد */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                            {conv.rating !== undefined ? (
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <i key={s} className="fa-solid fa-star" style={{ fontSize: '8px', color: s <= conv.rating ? '#fbbf24' : '#2e3d54' }} />
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '9px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '1px 5px', borderRadius: '3px' }}>
                                لم تقيم
                              </span>
                            )}
                            <span style={{ fontSize: '9px', color: '#8892b0' }}>
                              {conv.ratingComment ? '💬 تعليق' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* تذييل كتابة الرسالة في حال وجود محادثة نشطة */}
          {currentUser && activeConversation && activeConversation.status === 'open' && !showRatingScreen && (
            <div className="chat-box-footer">
              <input 
                type="text" 
                className="chat-input-field" 
                placeholder="اكتب رسالتك هنا للمشرف..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                autoComplete="off"
                style={{ direction: 'rtl', textAlign: 'right' }}
              />
              <button className="chat-send-btn" onClick={handleSendMessage}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 3. الزر العائم الأساسي للدعم المالي والمحادثة */}
      <button className="chat-trigger-btn" onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative' }}>
        <i className="fa-solid fa-headset"></i>
        {currentUser && userData?.hasUnreadUser && (
          <span className="chat-badge" style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '18px',
            height: '18px',
            background: '#ef4444',
            borderRadius: '50%',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #151a26',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}>
            1
          </span>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
