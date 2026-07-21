import React from 'react';

/**
 * DirectSupportChat
 * Component containing user support tickets, message timeline, editing/deleting controls, and archive.
 */
function DirectSupportChat({
  db,
  userId,
  adminConversations,
  adminActiveConversation,
  adminChatMessages,
  adminChatInput,
  setAdminChatInput,
  onAdminSendMessage,
  onAdminCloseConversation,
  adminViewingPastConv,
  onSetAdminViewingPastConv,
  adminPastMessages,
  onAdminEditMessage,
  onAdminDeleteMessage,
  onToggleChatVisibility,
  adminChatEndRef,
  adminPastChatEndRef
}) {
  if (!userId) return null;

  const closedConvs = adminConversations.filter(c => c.status === 'closed');

  return (
    <div 
      style={{ 
        background: 'linear-gradient(145deg, #11131c, #161824)', 
        border: '1px solid #243043', 
        borderRadius: '14px', 
        padding: '20px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <h3 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          justifyContent: 'space-between', 
          fontSize: '16px', 
          borderBottom: '1px solid #2e3040', 
          paddingBottom: '10px', 
          marginBottom: '4px', 
          color: '#00ffcc',
          fontWeight: '700'
        }}
      >
        <span>💬 الدعم الفني والمالي المباشر</span>
        <span style={{ fontSize: '12px', background: '#243043', padding: '4px 10px', borderRadius: '12px', color: '#02c076', fontWeight: 'bold' }}>
          إجمالي التذاكر: {adminConversations.length}
        </span>
      </h3>

      {/* Active Conversation Ticket */}
      <div style={{ background: '#0a0c14', border: '1px solid #1e2530', borderRadius: '10px', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e2530', paddingBottom: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: adminActiveConversation ? '#02c076' : '#9ca3af', borderRadius: '50%', display: 'inline-block' }}></span>
            <strong style={{ fontSize: '13px', color: '#ffffff' }}>
              {adminActiveConversation ? 'التذكرة المفتوحة حالياً' : 'لا توجد تذكرة مفتوحة'}
            </strong>
          </div>
          {adminActiveConversation && (
            <button
              onClick={() => onAdminCloseConversation(adminActiveConversation.id)}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.12)'}
            >
              🔒 إغلاق التذكرة
            </button>
          )}
        </div>

        {adminActiveConversation ? (
          <>
            {/* Active chat messages container */}
            <div 
              style={{
                height: '350px',
                background: '#07080d',
                border: '1px solid #1a2230',
                borderRadius: '8px',
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '12px'
              }}
            >
              {adminChatMessages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#8892b0', fontSize: '12px' }}>
                  المحادثة فارغة. اكتب رسالة للبدء!
                </div>
              ) : (
                adminChatMessages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div 
                      key={msg.id || msg.createdAt} 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        textAlign: 'right'
                      }}
                    >
                      <div 
                        style={{
                          background: isAdmin ? '#1e2638' : '#02c076',
                          color: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: isAdmin ? '12px 12px 12px 0px' : '12px 12px 0px 12px',
                          fontSize: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          wordBreak: 'break-word',
                          position: 'relative'
                        }}
                      >
                        {msg.text}
                        
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', justifyContent: 'flex-start' }}>
                          {isAdmin ? (
                            <>
                              <button 
                                onClick={() => onAdminEditMessage(msg.id, msg.text)}
                                style={msgActionStyle}
                              >
                                ✏️ تعديل
                              </button>
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>|</span>
                              <button 
                                onClick={() => onAdminDeleteMessage(msg.id)}
                                style={msgActionStyleRed}
                              >
                                🗑️ حذف
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => onAdminDeleteMessage(msg.id)}
                              style={msgActionStyleRed}
                            >
                              🗑️ حذف رسالة العميل
                            </button>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '9px', color: '#8892b0', marginTop: '3px', alignSelf: isAdmin ? 'flex-start' : 'flex-end', padding: '0 4px' }}>
                        {msg.senderName || (isAdmin ? 'الدعم' : 'العميل')} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        {msg.isEdited && ' (معدلة)'}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={adminChatEndRef} />
            </div>

            {/* Chat Send Area */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="اكتب رسالتك للمستثمر..."
                value={adminChatInput}
                onChange={(e) => setAdminChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdminSendMessage()}
                style={{
                  flex: 1,
                  background: '#151a26',
                  border: '1px solid #243043',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00ffcc'}
                onBlur={(e) => e.target.style.borderColor = '#243043'}
              />
              <button
                onClick={onAdminSendMessage}
                style={{
                  background: '#02c076',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#02a565'}
                onMouseLeave={(e) => e.target.style.background = '#02c076'}
              >
                إرسال 🚀
              </button>
            </div>
          </>
        ) : (
          /* Create new ticket when none is active */
          <div style={{ textAlign: 'center', padding: '15px 0' }}>
            <p style={{ fontSize: '12px', color: '#8892b0', marginBottom: '14px' }}>
              لا توجد تذكرة دردشة مفتوحة حالياً. يمكنك فتح تذكرة جديدة لبدء محادثة.
            </p>
            <button
              onClick={() => {
                alert("التذكرة مفتوحة ونشطة بالفعل وموصولة بـ MongoDB.");
              }}
              style={{
                background: '#02c076',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#02a565'}
              onMouseLeave={(e) => e.target.style.background = '#02c076'}
            >
              ➕ فتح تذكرة جديدة للمستخدم
            </button>
          </div>
        )}
      </div>

      {/* Conversations Archive */}
      <div style={{ background: '#0a0c14', border: '1px solid #1e2530', borderRadius: '10px', padding: '15px' }}>
        <h4 style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px', borderBottom: '1px solid #1e2530', paddingBottom: '8px', fontWeight: 'bold' }}>
          📜 أرشيف المحادثات والتقييمات ({closedConvs.length})
        </h4>

        {closedConvs.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#8892b0', textAlign: 'center', margin: '10px 0' }}>
            لا يوجد أي محادثات مغلقة أو مؤرشفة.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {closedConvs.map((conv) => (
              <div key={conv.id} style={{ background: '#131722', border: '1px solid #1f2535', borderRadius: '6px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#8892b0' }}>
                    أُغلقت: {new Date(conv.closedAt || conv.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                  {conv.rating ? (
                    <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>
                      {'⭐'.repeat(conv.rating)} ({conv.rating}/5)
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#8892b0', fontStyle: 'italic' }}>بلا تقييم</span>
                  )}
                </div>

                {conv.ratingComment && (
                  <div style={{ background: '#06080d', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', color: '#a9b5c8', marginBottom: '6px', borderRight: '2px solid #fbbf24' }}>
                    ملاحظة العميل: {conv.ratingComment}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      if (adminViewingPastConv?.id === conv.id) {
                        onSetAdminViewingPastConv(null);
                      } else {
                        onSetAdminViewingPastConv(conv);
                      }
                    }}
                    style={{ background: '#243043', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {adminViewingPastConv?.id === conv.id ? '❌ إغلاق الأرشيف' : '🔎 مراجعة الرسائل'}
                  </button>

                  <button
                    onClick={() => onToggleChatVisibility(conv.id, conv.visibleToUser)}
                    style={{
                      background: conv.visibleToUser ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                      border: 'none',
                      color: conv.visibleToUser ? '#10b981' : '#9ca3af',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {conv.visibleToUser ? '👁️ مرئي للمستثمر' : '👁️‍عون مخفي'}
                  </button>
                </div>

                {/* Inline past conversations reviewer */}
                {adminViewingPastConv?.id === conv.id && (
                  <div style={{ marginTop: '10px', background: '#07080d', borderRadius: '6px', padding: '10px', border: '1px solid #1a2230' }}>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {adminPastMessages.map(m => {
                        const isMAdmin = m.sender === 'admin';
                        return (
                          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMAdmin ? 'flex-start' : 'flex-end', maxWidth: '90%' }}>
                            <div style={{ background: isMAdmin ? '#1e2638' : '#0c0e17', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                              {m.text}
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '2px' }}>
                                {isMAdmin ? (
                                  <>
                                    <button onClick={() => onAdminEditMessage(m.id, m.text, conv.id)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '9px', cursor: 'pointer' }}>✏️</button>
                                    <button onClick={() => onAdminDeleteMessage(m.id, conv.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '9px', cursor: 'pointer' }}>🗑️</button>
                                  </>
                                ) : (
                                  <button onClick={() => onAdminDeleteMessage(m.id, conv.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '9px', cursor: 'pointer' }}>🗑️ حذف</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={adminPastChatEndRef} />
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const msgActionStyle = {
  background: 'none', 
  border: 'none', 
  color: '#a9b5c8', 
  fontSize: '10px', 
  cursor: 'pointer', 
  padding: '0'
};

const msgActionStyleRed = {
  background: 'none', 
  border: 'none', 
  color: '#f87171', 
  fontSize: '10px', 
  cursor: 'pointer', 
  padding: '0'
};

export default DirectSupportChat;
