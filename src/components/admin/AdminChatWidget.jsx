import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, 
  collectionGroup, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function AdminChatWidget() {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTabs, setActiveTabs] = useState([]); // [{ userId, chatId, displayName, isOnline }]
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('active'); // 'active' | 'closed' | 'users'

  const isSupportedAdmin = userData && userData.role === 'admin';

  // 1. الاستماع لجميع المستخدمين في النظام لمعرفة أسمائهم وحالتهم (نشط / غير نشط)
  useEffect(() => {
    if (!isSupportedAdmin) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const uList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(uList);
    }, (error) => {
      console.error("Error listening to users in AdminChatWidget:", error);
    });

    return () => unsubscribe();
  }, [isSupportedAdmin]);

  // 2. الاستماع لجميع المحادثات عبر كافة المستخدمين (collectionGroup)
  useEffect(() => {
    if (!isSupportedAdmin) return;

    const q = collectionGroup(db, 'chats');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => {
        const data = doc.data();
        const userId = doc.ref.parent.parent.id; // استخراج معرف المستخدم الأب
        return {
          id: doc.id,
          userId,
          ...data
        };
      });

      // ترتيب المحادثات حسب آخر تاريخ رسالة تنازلياً
      chatList.sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || a.createdAt || 0);
        const dateB = new Date(b.lastMessageAt || b.createdAt || 0);
        return dateB - dateA;
      });

      setChats(chatList);
    }, (error) => {
      console.error("Error listening to all chats via collectionGroup:", error);
    });

    return () => unsubscribe();
  }, [isSupportedAdmin]);

  if (!isSupportedAdmin) return null;

  // إيجاد بيانات المستخدم بسهولة
  const getUserData = (userId) => {
    const user = users.find(u => u.id === userId);
    return user || { displayName: 'مستثمر مجهول', isOnline: false, email: '' };
  };

  // تصفية المحادثات بناء على البحث وحالة التذكرة (نشطة أم مغلقة)
  const filteredChats = chats.filter(chat => {
    const user = getUserData(chat.userId);
    const matchesSearch = (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const isActive = chat.status !== 'closed';
    const matchesStatus = filterType === 'active' ? isActive : !isActive;

    return matchesSearch && matchesStatus;
  });

  // تصفية وترتيب المستخدمين (المتصلون أولاً ثم غير المتصلين)
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const filteredUsers = sortedUsers.filter(u => {
    return (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // حساب إجمالي الرسائل غير المقروءة الموجهة للادمن
  const totalUnreadCount = chats.filter(c => c.status !== 'closed' && c.hasUnreadSupport).length;

  // فتح تبويب شات عائم للمستثمر
  const handleOpenChatTab = async (chat) => {
    const user = getUserData(chat.userId);
    
    // التحقق مما إذا كان التبويب مفتوحاً بالفعل
    if (activeTabs.some(tab => tab.chatId === chat.id)) {
      return;
    }

    // إضافة التبويب (بحد أقصى 3 تبويبات لتجنب ازدحام الشاشة)
    setActiveTabs(prev => {
      const updated = [...prev, {
        userId: chat.userId,
        chatId: chat.id,
        displayName: user.displayName,
        isOnline: user.isOnline
      }];
      if (updated.length > 3) {
        return updated.slice(1); // إزالة أقدم تبويب مفتوح
      }
      return updated;
    });

    // تصفير مؤشر الرسائل غير المقروءة للادمن عند الفتح
    try {
      const chatDocRef = doc(db, 'users', chat.userId, 'chats', chat.id);
      await updateDoc(chatDocRef, {
        hasUnreadSupport: false
      });
    } catch (error) {
      console.error("Error updating hasUnreadSupport status:", error);
    }
  };

  // فتح/بدء محادثة مباشرة مع مستخدم معين من تبويب "المستثمرون"
  const handleStartChatWithUser = async (user) => {
    // ابحث عن تذكرة مفتوحة أولاً
    const existingChat = chats.find(c => c.userId === user.id && c.status !== 'closed');
    if (existingChat) {
      handleOpenChatTab(existingChat);
      return;
    }

    // إذا لم تكن هناك تذكرة مفتوحة، يمكننا إعادة فتح أقدم تذكرة مؤرشفة أو إنشاء تذكرة جديدة تماماً
    const existingClosedChat = chats.find(c => c.userId === user.id && c.status === 'closed');
    if (existingClosedChat) {
      try {
        const chatDocRef = doc(db, 'users', user.id, 'chats', existingClosedChat.id);
        await updateDoc(chatDocRef, {
          status: 'open',
          lastMessageText: 'تم إعادة فتح تذكرة الدعم بواسطة الإدارة 🔓',
          lastMessageAt: new Date().toISOString()
        });
        handleOpenChatTab({ ...existingClosedChat, status: 'open' });
      } catch (err) {
        console.error("Error reopening existing closed chat:", err);
      }
      return;
    }

    // إنشاء تذكرة جديدة تماماً
    try {
      const chatsRef = collection(db, 'users', user.id, 'chats');
      const newChatRef = await addDoc(chatsRef, {
        status: 'open',
        createdAt: new Date().toISOString(),
        lastMessageText: 'مرحباً بك! تم بدء محادثة دعم جديدة.',
        lastMessageAt: new Date().toISOString(),
        hasUnreadUser: true,
        hasUnreadSupport: false
      });

      const msgsRef = collection(db, 'users', user.id, 'chats', newChatRef.id, 'messages');
      await addDoc(msgsRef, {
        text: `أهلاً بك يا سيد ${user.displayName}، لقد قمنا بفتح هذه المحادثة لمساعدتك في أي استفسارات أو عمليات إيداع/سحب وتوجيهك اليوم بشكل مباشر.`,
        sender: 'admin',
        senderName: 'الدعم المالي المباشر',
        createdAt: new Date().toISOString()
      });

      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        hasUnreadUser: true,
        lastAdminMessageText: `لقد قمنا بفتح محادثة دعم جديدة لمساعدتك.`,
        lastMessageAt: new Date().toISOString()
      });

      // فتح التبويب فوراً
      handleOpenChatTab({
        id: newChatRef.id,
        userId: user.id,
        status: 'open',
        hasUnreadSupport: false
      });
    } catch (error) {
      console.error("Error initiating new admin-user chat:", error);
    }
  };

  const handleCloseChatTab = (chatId) => {
    setActiveTabs(prev => prev.filter(tab => tab.chatId !== chatId));
  };

  return (
    <div style={containerStyle}>
      {/* 1. صندوق ماسنجر الرئيسي المفتوح أو الزر العائم (مثبت في أقصى اليسار ltr) */}
      <div style={{ pointerEvents: 'auto', direction: 'rtl' }}>
        {isOpen ? (
          <div style={messengerPanelStyle}>
            {/* رأس ماسنجر */}
            <div style={messengerHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={avatarIconStyle}>💬</span>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#00ffcc', display: 'block' }}>بريد الدعم المباشر</span>
                  <span style={{ fontSize: '11px', color: '#a9b5c8' }}>ماسنجر الإدارة المباشر</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={closePanelButtonStyle}
              >
                ×
              </button>
            </div>

            {/* محرك البحث والتصفية */}
            <div style={{ padding: '12px', borderBottom: '1px solid #1e2530', background: '#0e121a' }}>
              <input 
                type="text"
                placeholder="🔍 ابحث عن مستثمر أو بريد إلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchFieldStyle}
              />

              {/* أزرار التصفية المحدثة لثلاثة خيارات */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                <button 
                  onClick={() => setFilterType('active')}
                  style={filterButtonStyle(filterType === 'active', '#10b981')}
                >
                  📥 النشطة
                </button>
                <button 
                  onClick={() => setFilterType('closed')}
                  style={filterButtonStyle(filterType === 'closed', '#8892b0')}
                >
                  📁 المؤرشفة
                </button>
                <button 
                  onClick={() => setFilterType('users')}
                  style={filterButtonStyle(filterType === 'users', '#38bdf8')}
                >
                  👥 المستثمرون
                </button>
              </div>
            </div>

            {/* قائمة الشات أو قائمة المستثمرين */}
            <div style={chatsListContainerStyle}>
              {filterType === 'users' ? (
                // عرض قائمة المستثمرين بالكامل مع المتصلين أولاً
                filteredUsers.length === 0 ? (
                  <div style={emptyStateStyle}>لا يوجد مستثمرون مسجلون حالياً.</div>
                ) : (
                  filteredUsers.map(user => {
                    return (
                      <div 
                        key={user.id}
                        onClick={() => handleStartChatWithUser(user)}
                        style={chatItemStyle(false)}
                      >
                        <div style={{ position: 'relative' }}>
                          <div style={chatAvatarStyle}>
                            {(user.displayName || 'م')[0].toUpperCase()}
                          </div>
                          <span style={onlineStatusDotStyle(user.isOnline)} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={userNameStyle(false)}>{user.displayName}</span>
                            <span style={{ fontSize: '10px', color: user.isOnline ? '#02c076' : '#8892b0', fontWeight: 'bold' }}>
                              {user.isOnline ? 'نشط الآن' : 'غير متصل'}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#8892b0', margin: '3px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email || 'بلا بريد إلكتروني'}
                          </p>
                        </div>
                        <span style={{ fontSize: '15px' }}>⚡</span>
                      </div>
                    );
                  })
                )
              ) : (
                // عرض قائمة المحادثات (النشطة أو المغلقة)
                filteredChats.length === 0 ? (
                  <div style={emptyStateStyle}>لا يوجد أي محادثات مطابقة حالياً.</div>
                ) : (
                  filteredChats.map(chat => {
                    const user = getUserData(chat.userId);
                    const isOnline = user.isOnline;
                    const unread = chat.status !== 'closed' && chat.hasUnreadSupport;

                    return (
                      <div 
                        key={chat.id}
                        onClick={() => handleOpenChatTab(chat)}
                        style={chatItemStyle(unread)}
                      >
                        <div style={{ position: 'relative' }}>
                          <div style={chatAvatarStyle}>
                            {(user.displayName || 'م')[0].toUpperCase()}
                          </div>
                          <span style={onlineStatusDotStyle(isOnline)} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={userNameStyle(unread)}>{user.displayName}</span>
                            <span style={{ fontSize: '10px', color: '#8892b0' }}>
                              {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={lastMessageTextStyle(unread)}>
                            {chat.lastMessageText || 'محادثة فارغة...'}
                          </p>
                        </div>

                        {unread && <span style={unreadDotStyle} />}
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            style={mainFloatingTriggerStyle(totalUnreadCount > 0)}
          >
            <span style={{ fontSize: '24px' }}>💬</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>بريد الدعم المباشر</span>
              {totalUnreadCount > 0 && <span style={{ fontSize: '9px', color: '#ff5c5c' }}>يوجد رسائل غير مقروءة</span>}
            </div>
            {totalUnreadCount > 0 && (
              <span style={mainBadgeStyle}>{totalUnreadCount}</span>
            )}
          </button>
        )}
      </div>

      {/* 2. قائمة التبويبات العائمة المفتوحة (تترحل وتنمو باتجاه اليمين ltr) */}
      <div style={tabsContainerStyle}>
        {activeTabs.map((tab) => (
          <AdminChatTab 
            key={tab.chatId} 
            tab={tab} 
            getUserData={getUserData}
            onClose={() => handleCloseChatTab(tab.chatId)}
          />
        ))}
      </div>
    </div>
  );
}

// ========================== مكون تبويب الشات الفردي ==========================
function AdminChatTab({ tab, getUserData, onClose }) {
  const { userId, chatId, displayName } = tab;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showStats, setShowStats] = useState(false); // التحكم في إظهار البيانات المالية للمستثمر

  const messagesEndRef = useRef(null);
  const user = getUserData(userId);

  // الاستماع لرسائل هذه المحادثة
  useEffect(() => {
    const msgsRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    }, (error) => {
      console.error("Error listening to tab messages:", error);
    });

    return () => unsubscribe();
  }, [userId, chatId]);

  // التمرير التلقائي لأسفل عند وصول رسالة جديدة
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showStats]);

  // إرسال رسالة
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');

    try {
      const msgsRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
      await addDoc(msgsRef, {
        text,
        sender: 'admin',
        senderName: 'الدعم المالي المباشر',
        createdAt: new Date().toISOString()
      });

      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatDocRef, {
        lastMessageText: text,
        lastMessageAt: new Date().toISOString(),
        hasUnreadUser: true,
        hasUnreadSupport: false
      });

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        hasUnreadUser: true,
        lastAdminMessageText: text,
        lastMessageAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error sending admin reply:", error);
    }
  };

  // أرشفة وحل التذكرة
  const handleArchiveTicket = async () => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في أرشفة وحل هذه المحادثة مع المستثمر ${displayName}؟`)) return;

    try {
      const chatDocRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatDocRef, {
        status: 'closed',
        closedAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      console.error("Error archiving ticket:", error);
    }
  };

  // حذف رسالة
  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟")) return;

    try {
      const msgRef = doc(db, 'users', userId, 'chats', chatId, 'messages', msgId);
      await deleteDoc(msgRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // بدء تعديل رسالة
  const startEdit = (msgId, text) => {
    setEditingMsgId(msgId);
    setEditingText(text);
  };

  // حفظ التعديل
  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;

    try {
      const msgRef = doc(db, 'users', userId, 'chats', chatId, 'messages', msgId);
      await updateDoc(msgRef, {
        text: editingText,
        isEdited: true
      });
      setEditingMsgId(null);
    } catch (error) {
      console.error("Error saving message edit:", error);
    }
  };

  // الانتقال إلى السجل المالي والتحكم المالي للمستثمر في نافذة جديدة
  const handleOpenFinancialsPage = () => {
    window.open(`/admin/user-financials/${userId}`, '_blank');
  };

  return (
    <div style={tabWindowStyle()} dir="rtl">
      {/* رأس تبويب الشات - النقر عليه أو على الاسم يعرض البيانات المالية */}
      <div style={tabHeaderStyle}>
        <div 
          onClick={() => setShowStats(!showStats)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, cursor: 'pointer' }}
          title="اضغط لعرض البيانات المالية الفورية للمستثمر"
        >
          <span style={onlineStatusDotStyle(user.isOnline)} />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </span>
          <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 5px', borderRadius: '4px' }}>
            {showStats ? '🔼 إخفاء الحساب' : '💳 الحساب'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={handleArchiveTicket}
            style={archiveButtonStyle}
            title="أرشفة وحل المشكلة"
          >
            🔒 حل
          </button>
          <button 
            onClick={onClose}
            style={closeTabButtonStyle}
          >
            ×
          </button>
        </div>
      </div>

      {/* لوحة تفاصيل البيانات المالية التفصيلية الفورية (قابلة للطي) */}
      {showStats && (
        <div style={financialStatsPanelStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div style={statItemBoxStyle}>
              <span style={statItemLabelStyle}>💰 الرصيد المتاح:</span>
              <strong style={{ color: '#10b981', fontSize: '13px' }}>${Number(user.balance || 0).toFixed(2)}</strong>
            </div>
            <div style={statItemBoxStyle}>
              <span style={statItemLabelStyle}>📥 الإيداعات:</span>
              <strong style={{ color: '#3b82f6', fontSize: '13px' }}>${Number(user.investments || user.totalDeposits || 0).toFixed(2)}</strong>
            </div>
            <div style={statItemBoxStyle}>
              <span style={statItemLabelStyle}>📈 الأرباح:</span>
              <strong style={{ color: '#00cfc2', fontSize: '13px' }}>${Number(user.profits || user.earnings || 0).toFixed(2)}</strong>
            </div>
            <div style={statItemBoxStyle}>
              <span style={statItemLabelStyle}>🎁 بونص إيداع:</span>
              <strong style={{ color: '#fbbf24', fontSize: '13px' }}>${Number(user.depositBonus || 0).toFixed(2)}</strong>
            </div>
          </div>
          
          <button 
            onClick={handleOpenFinancialsPage}
            style={fullFinancialsLinkStyle}
          >
            📋 التحكم المالي وتعديل رصيد المستثمر ⚡
          </button>
        </div>
      )}

      {/* منطقة الرسائل المباشرة */}
      <div style={messagesBodyStyle}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8892b0', fontSize: '11px' }}>
            المحادثة فارغة حالياً.
          </div>
        ) : (
          messages.map(msg => {
            const isAdmin = msg.sender === 'admin';
            const isEditingThis = editingMsgId === msg.id;

            return (
              <div 
                key={msg.id} 
                style={{
                  alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAdmin ? 'flex-end' : 'flex-start',
                  marginBottom: '8px'
                }}
              >
                {isEditingThis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                    <input 
                      type="text" 
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={editInputStyle}
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingMsgId(null)} style={editActionCancelBtn}>إلغاء</button>
                      <button onClick={() => handleSaveEdit(msg.id)} style={editActionSaveBtn}>حفظ</button>
                    </div>
                  </div>
                ) : (
                  <div style={messageBubbleStyle(isAdmin)}>
                    <span>{msg.text}</span>
                    
                    {/* تعديل وحذف */}
                    <div style={msgControlsRowStyle()}>
                      {isAdmin ? (
                        <>
                          <button onClick={() => startEdit(msg.id, msg.text)} style={msgControlBtnStyle}>✏️ تعديل</button>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                          <button onClick={() => handleDeleteMsg(msg.id)} style={msgControlBtnStyleRed}>🗑️ حذف</button>
                        </>
                      ) : (
                        <button onClick={() => handleDeleteMsg(msg.id)} style={msgControlBtnStyleRed}>🗑️ حذف رسالة العميل</button>
                      )}
                    </div>
                  </div>
                )}
                
                <span style={{ fontSize: '9px', color: '#8892b0', marginTop: '2px', padding: '0 4px' }}>
                  {msg.senderName || (isAdmin ? 'الدعم' : 'العميل')} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                  {msg.isEdited && ' (معدلة)'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* كتابة رسالة رد */}
      <div style={tabFooterStyle}>
        <input 
          type="text"
          placeholder="اكتب رسالة الرد المباشر..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={tabInputFieldStyle}
        />
        <button 
          onClick={handleSend}
          style={tabSendBtnStyle}
        >
          🚀
        </button>
      </div>
    </div>
  );
}

// ========================== أنماط التنسيق CSS-in-JS ==========================

const containerStyle = {
  position: 'fixed',
  bottom: '25px',
  left: '25px',
  zIndex: 99999,
  display: 'flex',
  alignItems: 'flex-end',
  gap: '15px',
  pointerEvents: 'none',
  direction: 'ltr' // لترتيب تبويبات الشات بالترحال لليمين والماسنجر في أقصى اليسار
};

const tabsContainerStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '15px',
  pointerEvents: 'auto',
  flexDirection: 'row'
};

const mainFloatingTriggerStyle = (hasUnread) => ({
  background: 'linear-gradient(135deg, #090d16, #121824)',
  border: hasUnread ? '2px solid #ef4444' : '2px solid #00ffcc',
  borderRadius: '50px',
  padding: '12px 20px',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
  pointerEvents: 'auto',
  transition: 'transform 0.2s, box-shadow 0.2s',
  position: 'relative',
  height: '56px',
  whiteSpace: 'nowrap'
});

const mainBadgeStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#ef4444',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
  border: '1.5px solid #0f172a'
};

const messengerPanelStyle = {
  width: '360px',
  height: '520px',
  background: '#0a0c14',
  border: '1px solid #243043',
  borderRadius: '16px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  pointerEvents: 'auto',
  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
};

const messengerHeaderStyle = {
  background: 'linear-gradient(90deg, #11131c, #161824)',
  padding: '14px',
  borderBottom: '1px solid #1e2530',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const avatarIconStyle = {
  width: '36px',
  height: '36px',
  background: 'rgba(0, 255, 204, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px'
};

const closePanelButtonStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  color: '#8892b0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  transition: 'background 0.2s'
};

const searchFieldStyle = {
  width: '100%',
  background: '#151a26',
  border: '1px solid #243043',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#ffffff',
  fontSize: '12.5px',
  outline: 'none',
  textAlign: 'right',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

const filterButtonStyle = (active, color) => ({
  flex: 1,
  background: active ? `${color}15` : 'transparent',
  border: `1px solid ${active ? color : '#243043'}`,
  borderRadius: '6px',
  padding: '6px 4px',
  fontSize: '11px',
  fontWeight: active ? 'bold' : 'normal',
  color: active ? color : '#8892b0',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center',
  whiteSpace: 'nowrap'
});

const chatsListContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 0',
  background: '#07080d',
  display: 'flex',
  flexDirection: 'column'
};

const emptyStateStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#8892b0',
  fontSize: '12.5px',
  padding: '20px',
  textAlign: 'center'
};

const chatItemStyle = (unread) => ({
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  borderBottom: '1px solid #111520',
  background: unread ? 'rgba(0, 255, 204, 0.04)' : 'transparent',
  transition: 'background 0.2s'
});

const chatAvatarStyle = {
  width: '40px',
  height: '40px',
  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#00ffcc',
  border: '1px solid rgba(0, 255, 204, 0.2)'
};

const onlineStatusDotStyle = (isOnline) => ({
  position: 'absolute',
  bottom: '0',
  left: '0',
  width: '10px',
  height: '10px',
  background: isOnline ? '#02c076' : '#4b5563',
  border: '2px solid #07080d',
  borderRadius: '50%',
  boxShadow: isOnline ? '0 0 6px #02c076' : 'none'
});

const userNameStyle = (unread) => ({
  fontSize: '13px',
  fontWeight: unread ? 'bold' : '500',
  color: unread ? '#ffffff' : '#e2e8f0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block'
});

const lastMessageTextStyle = (unread) => ({
  fontSize: '11.5px',
  color: unread ? '#00ffcc' : '#8892b0',
  fontWeight: unread ? '600' : 'normal',
  margin: '4px 0 0 0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

const unreadDotStyle = {
  width: '8px',
  height: '8px',
  background: '#ef4444',
  borderRadius: '50%',
  boxShadow: '0 0 8px #ef4444'
};

// ========================== أنماط تبويب الشات الفردي ==========================

const tabWindowStyle = () => ({
  width: '340px',
  height: '460px',
  background: '#0a0c14',
  border: '1px solid #243043',
  borderRadius: '12px 12px 0 0',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'slideUp 0.25s ease-out',
  pointerEvents: 'auto'
});

const tabHeaderStyle = {
  background: '#11131c',
  padding: '10px 12px',
  borderBottom: '1px solid #1e2530',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const archiveButtonStyle = {
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: '10.5px',
  color: '#ef4444',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.2s'
};

const closeTabButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#8892b0',
  fontSize: '18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px'
};

const messagesBodyStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px',
  background: '#07080d',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const messageBubbleStyle = (isAdmin) => ({
  background: isAdmin ? '#1e2638' : '#02c076',
  color: '#ffffff',
  padding: '8px 12px',
  borderRadius: isAdmin ? '12px 12px 12px 0px' : '12px 12px 0px 12px',
  fontSize: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  wordBreak: 'break-word',
  position: 'relative'
});

const msgControlsRowStyle = () => ({
  display: 'flex', 
  gap: '6px', 
  marginTop: '6px', 
  borderTop: '1px solid rgba(255,255,255,0.08)', 
  paddingTop: '4px', 
  justifyContent: 'flex-start'
});

const msgControlBtnStyle = {
  background: 'none', 
  border: 'none', 
  color: '#a9b5c8', 
  fontSize: '9px', 
  cursor: 'pointer', 
  padding: '0'
};

const msgControlBtnStyleRed = {
  background: 'none', 
  border: 'none', 
  color: '#f87171', 
  fontSize: '9px', 
  cursor: 'pointer', 
  padding: '0'
};

const editInputStyle = {
  width: '100%',
  background: '#151a26',
  border: '1px solid #38bdf8',
  borderRadius: '4px',
  padding: '6px 8px',
  color: '#ffffff',
  fontSize: '11px',
  outline: 'none'
};

const editActionCancelBtn = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  color: '#8892b0',
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '3px',
  cursor: 'pointer'
};

const editActionSaveBtn = {
  background: '#38bdf8',
  border: 'none',
  color: '#000',
  fontWeight: 'bold',
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '3px',
  cursor: 'pointer'
};

const tabFooterStyle = {
  padding: '8px 10px',
  background: '#11131c',
  borderTop: '1px solid #1e2530',
  display: 'flex',
  gap: '6px'
};

const tabInputFieldStyle = {
  flex: 1,
  background: '#151a26',
  border: '1px solid #243043',
  borderRadius: '6px',
  padding: '6px 10px',
  color: '#ffffff',
  fontSize: '12px',
  outline: 'none',
  textAlign: 'right'
};

const tabSendBtnStyle = {
  background: '#02c076',
  border: 'none',
  borderRadius: '6px',
  padding: '0 12px',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// أنماط اللوحة المالية السريعة المدمجة بالتبويب
const financialStatsPanelStyle = {
  background: '#11131c',
  borderBottom: '1px solid #243043',
  padding: '10px',
  animation: 'slideDown 0.2s ease-out'
};

const statItemBoxStyle = {
  background: '#07080d',
  border: '1px solid #1e2530',
  borderRadius: '6px',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px'
};

const statItemLabelStyle = {
  fontSize: '10px',
  color: '#8892b0'
};

const fullFinancialsLinkStyle = {
  width: '100%',
  background: 'rgba(56, 189, 248, 0.08)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  borderRadius: '6px',
  padding: '8px',
  fontSize: '11px',
  color: '#38bdf8',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'background 0.2s',
  display: 'block'
};
