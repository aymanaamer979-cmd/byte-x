import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, updateDoc, query, where, getDocs, addDoc, getDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './AdminDashboard.css'; // إعادة استخدام التنسيقات الجميلة للوحة التحكم

function AdminUserFinancials() {
  const { userId } = useParams();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userHistory, setUserHistory] = useState({
    deposits: [],
    withdrawals: [],
    rewards: [],
    profits: [],
    loading: true
  });

  // حالات ونظام دعم التذاكر والدردشة المباشرة
  const [adminConversations, setAdminConversations] = useState([]);
  const [adminActiveConversation, setAdminActiveConversation] = useState(null);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminPastMessages, setAdminPastMessages] = useState([]);
  const [adminViewingPastConv, setAdminViewingPastConv] = useState(null);
  const [adminChatInput, setAdminChatInput] = useState("");
  const adminChatEndRef = useRef(null);
  const adminPastChatEndRef = useRef(null);

  // دالة لتنسيق التاريخ والوقت باللغة العربية
  const formatDateTime = (createdAt) => {
    if (!createdAt) return 'مؤخراً';
    try {
      let date;
      if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else if (typeof createdAt === 'string' || createdAt instanceof Date) {
        date = new Date(createdAt);
      } else if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
        date = createdAt.toDate();
      } else {
        return String(createdAt);
      }
      
      if (isNaN(date.getTime())) return String(createdAt);

      return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(createdAt);
    }
  };

  // جلب بيانات العميل المحدّد وسجلاته المعاملاتية بالكامل
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setUserLoading(true);
    setUserHistory(prev => ({ ...prev, loading: true }));

    try {
      // 1. جلب المستند الرئيسي للمستثمر
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        setSelectedUser({ id: userSnap.id, ...userSnap.data() });
      } else {
        alert("⚠️ عذراً، لم يتم العثور على هذا المستخدم في قاعدة البيانات.");
        setUserLoading(false);
        return;
      }

      // 2. جلب الإيداعات الفرعية
      const depositsQuery = query(collection(db, 'users', userId, 'deposits'));
      const depositsSnap = await getDocs(depositsQuery);
      const depositList = depositsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. جلب السحوبات الفرعية
      const withdrawalsQuery = query(collection(db, 'users', userId, 'withdrawals'));
      const withdrawalsSnap = await getDocs(withdrawalsQuery);
      const withdrawalList = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 4. جلب المكافآت الفرعية
      const rewardsQuery = query(collection(db, 'users', userId, 'rewards'));
      const rewardsSnap = await getDocs(rewardsQuery);
      const rewardList = rewardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 5. جلب الأرباح الفرعية
      const profitsQuery = query(collection(db, 'users', userId, 'profits'));
      const profitsSnap = await getDocs(profitsQuery);
      const profitList = profitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const parseDate = (d) => {
        if (!d) return 0;
        if (typeof d === 'object' && d.seconds) return d.seconds * 1000;
        if (d.toDate) return d.toDate().getTime();
        return new Date(d).getTime();
      };

      setUserHistory({
        deposits: depositList.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt)),
        withdrawals: withdrawalList.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt)),
        rewards: rewardList.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt)),
        profits: profitList.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt)),
        loading: false
      });

      setUserLoading(false);
    } catch (error) {
      console.error("❌ فشل جلب تفاصيل المستثمر:", error);
      setUserLoading(false);
      setUserHistory(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // جلب البيانات عند التحميل
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserDetails]);

  // ==================== نظام الاستماع للدردشة المباشرة مع العميل المختار ====================

  // 1. الاستماع لجميع محادثات العميل المختار في الوقت الفعلي
  useEffect(() => {
    if (!userId) {
      const timer = setTimeout(() => {
        setAdminConversations([]);
        setAdminActiveConversation(null);
        setAdminViewingPastConv(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminConversations(convs);

      const active = convs.find(c => c.status === 'open');
      setAdminActiveConversation(active || null);

      // بمجرد فتح الإدارة لتفاصيل العميل، نقوم بتصفير تنبيه الرسائل غير المقروءة من قبل العميل
      try {
        const userDocRef = doc(db, 'users', userId);
        updateDoc(userDocRef, {
          hasUnreadSupport: false
        });
      } catch (err) {
        console.error("Error resetting hasUnreadSupport from Admin:", err);
      }
    }, (error) => {
      console.error("Error listening to user conversations from admin page:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. الاستماع لرسائل المحادثة النشطة (المفتوحة) للعميل
  useEffect(() => {
    if (!userId || !adminActiveConversation) {
      const timer = setTimeout(() => {
        setAdminChatMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const messagesRef = collection(db, 'users', userId, 'chats', adminActiveConversation.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminChatMessages(msgs);
    }, (error) => {
      console.error("Error listening to active chat messages:", error);
    });

    return () => unsubscribe();
  }, [userId, adminActiveConversation]);

  // 3. الاستماع لرسائل محادثة مؤرشفة سابقة يراجعها المشرف حالياً
  useEffect(() => {
    if (!userId || !adminViewingPastConv) {
      const timer = setTimeout(() => {
        setAdminPastMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const messagesRef = collection(db, 'users', userId, 'chats', adminViewingPastConv.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminPastMessages(msgs);
    }, (error) => {
      console.error("Error listening to past messages:", error);
    });

    return () => unsubscribe();
  }, [userId, adminViewingPastConv]);

  // 4. التمرير التلقائي لأسفل في شات الأدمن
  useEffect(() => {
    if (adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatMessages, userId]);

  useEffect(() => {
    if (adminPastChatEndRef.current) {
      adminPastChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminPastMessages]);

  // إرسال رسالة من الأدمن في المحادثة النشطة
  const handleAdminSendMessage = async () => {
    if (!adminChatInput.trim() || !userId || !adminActiveConversation) return;

    const text = adminChatInput;
    setAdminChatInput("");

    try {
      const msgsRef = collection(db, 'users', userId, 'chats', adminActiveConversation.id, 'messages');
      await addDoc(msgsRef, {
        text: text,
        sender: 'admin',
        senderName: 'الدعم المالي المباشر',
        createdAt: new Date().toISOString()
      });

      // تحديث رأس المحادثة الفرعية
      const convDocRef = doc(db, 'users', userId, 'chats', adminActiveConversation.id);
      await updateDoc(convDocRef, {
        lastMessageText: text,
        lastMessageAt: new Date().toISOString(),
        hasUnreadUser: true,
        hasUnreadSupport: false
      });

      // تنبيه العميل بأن لديه رسالة جديدة غير مقروءة من الدعم وحفظ نص الرسالة للبوب اب
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        hasUnreadUser: true,
        lastAdminMessageText: text,
        lastMessageAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending admin chat message:", error);
      alert("فشل إرسال الرسالة.");
    }
  };

  // إغلاق المحادثة النشطة من الإدارة
  const handleAdminCloseConversation = async (convId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في إغلاق وحل هذه المحادثة؟ سيُطلب من المستثمر تقييم جودة الخدمة.")) return;

    try {
      const convDocRef = doc(db, 'users', userId, 'chats', convId);
      await updateDoc(convDocRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        visibleToUser: false
      });
      alert("تم إغلاق المحادثة وحلها بنجاح!");
    } catch (error) {
      console.error("Error closing conversation from Admin:", error);
      alert("فشل إغلاق المحادثة.");
    }
  };

  // تبديل ظهور المحادثة المغلقة للمستثمر لمراجعتها
  const handleToggleChatVisibility = async (convId, currentVisible) => {
    try {
      const convDocRef = doc(db, 'users', userId, 'chats', convId);
      await updateDoc(convDocRef, {
        visibleToUser: !currentVisible
      });
      alert(!currentVisible ? "تم إظهار المحادثة للمستثمر بنجاح للمراجعة!" : "تم إخفاء المحادثة عن المستثمر بنجاح!");
    } catch (error) {
      console.error("Error toggling chat visibility from Admin:", error);
      alert("فشل تعديل حالة ظهور المحادثة.");
    }
  };

  // تعديل رسالة شات من الأدمن
  const handleAdminEditMessage = async (msgId, oldText, customConvId = null) => {
    const convId = customConvId || adminActiveConversation?.id;
    if (!convId) return;
    const newText = prompt("تعديل نص الرسالة المحددة:", oldText);
    if (newText === null || newText.trim() === "" || newText === oldText) return;

    try {
      const msgDocRef = doc(db, 'users', userId, 'chats', convId, 'messages', msgId);
      await updateDoc(msgDocRef, {
        text: newText,
        isEdited: true,
        editedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error editing chat message:", error);
      alert("فشل تعديل الرسالة.");
    }
  };

  // حذف رسالة شات نهائياً من الأدمن
  const handleAdminDeleteMessage = async (msgId, customConvId = null) => {
    const convId = customConvId || adminActiveConversation?.id;
    if (!convId) return;
    if (!window.confirm("⚠️ هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟ لا يمكن استرجاعها.")) return;

    try {
      const msgDocRef = doc(db, 'users', userId, 'chats', convId, 'messages', msgId);
      await deleteDoc(msgDocRef);
    } catch (error) {
      console.error("Error deleting chat message:", error);
      alert("فشل حذف الرسالة.");
    }
  };


  // دالة تصحيح وإصلاح أعلام الطلبات المعلقة في مستند المستخدم
  const refreshPendingFlagsForUser = async (uId) => {
    if (!uId) return;
    try {
      const depositsQuery = query(collection(db, 'users', uId, 'deposits'), where('status', '==', 'pending'));
      const depSnap = await getDocs(depositsQuery);
      const hasPendingDep = depSnap.docs.length > 0;

      const withdrawalsQuery = query(collection(db, 'users', uId, 'withdrawals'), where('status', '==', 'pending'));
      const witSnap = await getDocs(withdrawalsQuery);
      const hasPendingWit = witSnap.docs.length > 0;

      const userDocRef = doc(db, 'users', uId);
      await updateDoc(userDocRef, {
        hasPendingDeposit: hasPendingDep,
        hasPendingWithdrawal: hasPendingWit
      });
    } catch (err) {
      console.warn("Error refreshing pending flags for user:", err);
    }
  };

  // دالة لتحديث أي حقل مالي مباشرة في مستند المستخدم الرئيسي
  const handleUpdateField = async (field, currentVal, label) => {
    const newValInput = prompt(`تعديل ${label} الحالي (${currentVal || 0}):`, currentVal || 0);
    if (newValInput === null || newValInput.trim() === "") return;

    const parsedVal = parseFloat(newValInput);
    if (isNaN(parsedVal)) {
      alert("الرجاء إدخال رقم صحيح.");
      return;
    }

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      let dbField = field;
      if (field === 'totalDeposits') dbField = 'investments';
      if (field === 'earnings') dbField = 'profits';

      await updateDoc(userDocRef, {
        [dbField]: parsedVal,
        updatedAt: new Date().toISOString()
      });
      alert(`تم تحديث ${label} بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${label}:`, error);
      alert('فشل التحديث بالداتابيز.');
    }
  };

  // دالة تحديث مكافأة الإيداع في المستند الرئيسي للمستثمر
  const handleUpdateBonus = async () => {
    const bonusVal = prompt("أدخل قيمة مكافأة الإيداع الجديدة:", selectedUser.depositBonus || 0);
    if (bonusVal === null) return;

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        depositBonus: parseFloat(bonusVal) || 0,
        depositBonusDate: new Date().toLocaleDateString('ar-EG'),
        updatedAt: new Date().toISOString()
      });
      alert("تم تحديث مكافأة الإيداع وتاريخها!");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      alert("فشل تحديث مكافأة الإيداع.");
    }
  };

  // إضافة إيداع يدوي ورصيده في حساب المستثمر مباشرة
  const handleAddManualDeposit = async () => {
    const amountInput = prompt('أدخل مبلغ الإيداع اليدوي ($):');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح.'); return; }

    const descInput = prompt('أدخل وصف العملية (اختياري):', 'إيداع يدوي من الإدارة') || 'إيداع يدوي من الإدارة';

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userDocRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newBalance = (currentData.balance ?? 35) + amount;
      const newInvestments = (currentData.investments ?? 0) + amount;

      await updateDoc(userDocRef, {
        balance: newBalance,
        investments: newInvestments,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'deposit',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'deposits'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        amount,
        method: 'يدوي - إدارة المنصة',
        txId: `MANUAL-${Date.now()}`,
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      alert(`✅ تم إضافة إيداع $${amount} وشحن رصيد المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة الإيداع اليدوي:', error);
      alert('فشل الإيداع اليدوي.');
    }
  };

  // إضافة مكافأة يدوية لحساب المستثمر
  const handleAddManualReward = async () => {
    const amountInput = prompt('أدخل قيمة المكافأة ($):');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح.'); return; }

    const descInput = prompt('أدخل وصف المكافأة (اختياري):', 'مكافأة من الإدارة') || 'مكافأة من الإدارة';

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userDocRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newBalance = (currentData.balance ?? 35) + amount;

      await updateDoc(userDocRef, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'rewards'), {
        amount,
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'reward',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      alert('🎁 تم إضافة مكافأة $' + amount + ' لحساب المستثمر بنجاح!');
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة المكافأة:', error);
      alert('فشل إضافة المكافأة.');
    }
  };

  // إضافة أرباح يدوية لحساب المستثمر
  const handleAddManualProfit = async () => {
    const amountInput = prompt('أدخل قيمة الأرباح ($):');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح.'); return; }

    const descInput = prompt('أدخل وصف الأرباح (اختياري):', 'أرباح من التداول الاستثماري') || 'أرباح من التداول الاستثماري';

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userDocRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newBalance = (currentData.balance ?? 35) + amount;
      const newProfits = (currentData.profits ?? 0) + amount;

      await updateDoc(userDocRef, {
        balance: newBalance,
        profits: newProfits,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'profits'), {
        amount,
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'profit',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      alert(`📈 تم إضافة أرباح بقيمة $${amount} لحساب المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة الأرباح يدوياً:', error);
      alert('فشل إضافة الأرباح.');
    }
  };

  // إضافة سحب يدوي من حساب المستثمر
  const handleAddManualWithdrawal = async () => {
    const amountInput = prompt(`أدخل مبلغ السحب ($) - الرصيد المتاح: $${selectedUser.balance || 0}:`);
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح.'); return; }

    if (amount > (selectedUser.balance || 0)) {
      alert(`❌ المبلغ المطلوب ($${amount}) أكبر من الرصيد المتاح ($${selectedUser.balance || 0}).`);
      return;
    }

    const descInput = prompt('أدخل وصف السحب (اختياري):', 'سحب يدوي من الإدارة') || 'سحب يدوي من الإدارة';

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userDocRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newBalance = (currentData.balance ?? 35) - amount;

      await updateDoc(userDocRef, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'withdraw',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'withdrawals'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        amount,
        method: 'يدوي - إدارة المنصة',
        address: 'يدوي',
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      alert(`💳 تم تسجيل سحب $${amount} وخصمه من رصيد المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة السحب اليدوي:', error);
      alert('فشل السحب اليدوي.');
    }
  };

  // تعديل قيمة الإيداع
  const handleEditDepositAmount = async (depositId, userId, currentStatus, oldAmount, txId) => {
    const newAmountInput = prompt(`تعديل قيمة الإيداع (القيمة الحالية: $${oldAmount}):`, oldAmount);
    if (newAmountInput === null) return;
    const newAmount = parseFloat(newAmountInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }
    if (newAmount === oldAmount) return;

    try {
      const depositRef = doc(db, 'users', userId, 'deposits', depositId);
      await updateDoc(depositRef, { amount: newAmount });

      const txQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'deposit'),
        where('amount', '==', oldAmount)
      );
      const txSnap = await getDocs(txQuery);
      for (const docSnap of txSnap.docs) {
        const txData = docSnap.data();
        if (txData.description?.includes(txId) || txSnap.docs.length === 1) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            amount: newAmount
          });
          break;
        }
      }

      if (currentStatus === 'approved') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const diff = newAmount - oldAmount;
          const newBalance = (currentData.balance ?? 35) + diff;
          const newInvestments = (currentData.investments ?? 0) + diff;

          await updateDoc(userDocRef, {
            balance: newBalance,
            investments: newInvestments,
            updatedAt: new Date().toISOString()
          });
          alert(`تم تعديل مبلغ الإيداع إلى $${newAmount} وتعديل رصيد العميل بالفرق ($${diff}).`);
        }
      } else {
        alert(`تم تعديل مبلغ الإيداع إلى $${newAmount} بنجاح.`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating deposit amount:', error);
      alert('فشل تعديل مبلغ الإيداع.');
    }
  };

  // حذف عملية إيداع كاملة من قاعدة البيانات
  const handleDeleteDeposit = async (depositId, amount) => {
    if (!window.confirm(`⚠️ تحذير شديد: هل أنت متأكد من حذف مستند الإيداع هذا نهائياً بقيمة $${amount}؟ لا يمكن التراجع عن ذلك.`)) return;

    try {
      const depositRef = doc(db, 'users', userId, 'deposits', depositId);
      await deleteDoc(depositRef);

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'deposit'),
          where('amount', '==', parseFloat(amount))
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id));
        }
      } catch (err) {
        console.warn("Sub-transaction not found or could not be deleted:", err);
      }

      alert("تم حذف مستند الإيداع بنجاح.");
      await refreshPendingFlagsForUser(userId);
      fetchUserDetails();
    } catch (error) {
      console.error("Error deleting deposit document:", error);
      alert("فشل حذف الإيداع.");
    }
  };

  // تحديث حالة الإيداع مباشرة بالداتابيز
  const handleUpdateDepositStatusDirect = async (depositId, userId, currentStatus, mappedStatus, amount, txId) => {
    if (mappedStatus === currentStatus) return;

    try {
      const depositRef = doc(db, 'users', userId, 'deposits', depositId);
      await updateDoc(depositRef, { status: mappedStatus });

      const txQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'deposit'),
        where('amount', '==', amount)
      );
      const txSnap = await getDocs(txQuery);
      
      for (const docSnap of txSnap.docs) {
        const txData = docSnap.data();
        if (txData.description?.includes(txId) || txSnap.docs.length === 1) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            status: mappedStatus
          });
          break;
        }
      }

      if (mappedStatus === 'approved' && currentStatus !== 'approved') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        const currentData = userSnap.exists() ? userSnap.data() : {};

        const newBalance = (currentData.balance ?? 35) + amount;
        const newInvestments = (currentData.investments ?? 0) + amount;

        await updateDoc(userDocRef, {
          balance: newBalance,
          investments: newInvestments,
          updatedAt: new Date().toISOString()
        });

        alert(`تم قبول الإيداع بنجاح، وإضافة $${amount} لرصيد المستثمر!`);
      } else if (currentStatus === 'approved' && mappedStatus !== 'approved') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        const currentData = userSnap.exists() ? userSnap.data() : {};

        const newBalance = Math.max(0, (currentData.balance ?? 35) - amount);
        const newInvestments = Math.max(0, (currentData.investments ?? 0) - amount);

        await updateDoc(userDocRef, {
          balance: newBalance,
          investments: newInvestments,
          updatedAt: new Date().toISOString()
        });
        alert(`تم تعديل الحالة من مقبول إلى ${mappedStatus} وخصم $${amount} من الرصيد.`);
      } else {
        alert('تم تحديث حالة المعاملة بنجاح!');
      }

      await refreshPendingFlagsForUser(userId);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ أثناء تحديث حالة الإيداع:', error);
      alert('فشل التحديث بالداتابيز.');
    }
  };

  // تعديل قيمة السحب
  const handleEditWithdrawalAmount = async (withdrawalId, userId, currentStatus, oldAmount, address) => {
    const newAmountInput = prompt(`تعديل قيمة السحب (القيمة الحالية: $${oldAmount}):`, oldAmount);
    if (newAmountInput === null) return;
    const newAmount = parseFloat(newAmountInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }
    if (newAmount === oldAmount) return;

    try {
      const withdrawalRef = doc(db, 'users', userId, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, { amount: newAmount });

      const txQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'withdraw'),
        where('amount', '==', oldAmount)
      );
      const txSnap = await getDocs(txQuery);
      for (const docSnap of txSnap.docs) {
        const txData = docSnap.data();
        if (txData.description?.includes(address) || txSnap.docs.length === 1) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            amount: newAmount
          });
          break;
        }
      }

      if (currentStatus !== 'failed') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const diff = oldAmount - newAmount;
          const newBalance = Math.max(0, (currentData.balance ?? 35) + diff);

          await updateDoc(userDocRef, {
            balance: newBalance,
            updatedAt: new Date().toISOString()
          });
          alert(`تم تعديل مبلغ السحب إلى $${newAmount} وتعديل رصيد العميل بفرق السحب ($${diff}).`);
        }
      } else {
        alert(`تم تعديل مبلغ السحب إلى $${newAmount} بنجاح.`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating withdrawal amount:', error);
      alert('فشل تعديل مبلغ السحب.');
    }
  };

  // حذف عملية السحب بالكامل
  const handleDeleteWithdrawal = async (withdrawalId, amount) => {
    if (!window.confirm(`⚠️ هل أنت متأكد من حذف طلب السحب هذا نهائياً بقيمة $${amount}؟`)) return;

    try {
      const withdrawalRef = doc(db, 'users', userId, 'withdrawals', withdrawalId);
      await deleteDoc(withdrawalRef);

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'withdraw'),
          where('amount', '==', parseFloat(amount))
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id));
        }
      } catch (err) {
        console.warn("Sub-transaction not found or could not be deleted:", err);
      }

      alert("تم حذف مستند السحب بنجاح.");
      await refreshPendingFlagsForUser(userId);
      fetchUserDetails();
    } catch (error) {
      console.error("Error deleting withdrawal document:", error);
      alert("فشل حذف طلب السحب.");
    }
  };

  // تحديث حالة السحب مباشرة
  const handleUpdateWithdrawalStatusDirect = async (withdrawalId, userId, currentStatus, mappedStatus, amount, address) => {
    if (mappedStatus === currentStatus) return;

    try {
      const withdrawalRef = doc(db, 'users', userId, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, { status: mappedStatus });

      const txQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'withdraw'),
        where('amount', '==', amount)
      );
      const txSnap = await getDocs(txQuery);
      
      for (const docSnap of txSnap.docs) {
        const txData = docSnap.data();
        if (txData.description?.includes(address) || txSnap.docs.length === 1) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            status: mappedStatus
          });
          break;
        }
      }

      if (mappedStatus === 'failed' && currentStatus !== 'failed') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          await updateDoc(userDocRef, {
            balance: (currentData.balance ?? 35) + amount,
            updatedAt: new Date().toISOString()
          });
          alert(`تم رفض السحب وإرجاع مبلغ $${amount} إلى رصيد المستخدم!`);
        }
      } else if (currentStatus === 'failed' && mappedStatus !== 'failed') {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          await updateDoc(userDocRef, {
            balance: Math.max(0, (currentData.balance ?? 35) - amount),
            updatedAt: new Date().toISOString()
          });
          alert(`تم تغيير حالة السحب من مرفوض إلى ${mappedStatus} وخصم $${amount} من الرصيد.`);
        }
      } else {
        alert('تم تحديث حالة السحب بنجاح!');
      }

      await refreshPendingFlagsForUser(userId);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ أثناء تحديث حالة السحب:', error);
      alert('فشل التحديث.');
    }
  };

  // تعديل قيمة المكافأة
  const handleEditRewardAmount = async (rewardId, userId, oldAmount) => {
    const newAmountInput = prompt(`تعديل قيمة المكافأة (القيمة الحالية: $${oldAmount}):`, oldAmount);
    if (newAmountInput === null) return;
    const newAmount = parseFloat(newAmountInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }
    if (newAmount === oldAmount) return;

    try {
      const rewardRef = doc(db, 'users', userId, 'rewards', rewardId);
      await updateDoc(rewardRef, { amount: newAmount });

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'reward'),
          where('amount', '==', oldAmount)
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            amount: newAmount
          });
        }
      } catch (err) {
        console.warn("Unified transaction reward update skipped:", err);
      }

      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const diff = newAmount - oldAmount;
        const newBalance = Math.max(0, (currentData.balance ?? 35) + diff);

        await updateDoc(userDocRef, {
          balance: newBalance,
          updatedAt: new Date().toISOString()
        });
        alert(`تم تعديل مبلغ المكافأة إلى $${newAmount} وتعديل رصيد العميل بالفرق ($${diff}).`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating reward amount:', error);
      alert('فشل تعديل مبلغ المكافأة.');
    }
  };

  // حذف عملية المكافأة
  const handleDeleteReward = async (rewardId, amount) => {
    if (!window.confirm(`⚠️ هل أنت متأكد من حذف هذه المكافأة نهائياً بقيمة $${amount}؟`)) return;

    try {
      const rewardRef = doc(db, 'users', userId, 'rewards', rewardId);
      await deleteDoc(rewardRef);

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'reward'),
          where('amount', '==', parseFloat(amount))
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id));
        }
      } catch (err) {
        console.warn("Sub-transaction not found or could not be deleted:", err);
      }

      alert("تم حذف المكافأة بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error("Error deleting reward document:", error);
      alert("فشل حذف المكافأة.");
    }
  };

  // تعديل قيمة الأرباح
  const handleEditProfitAmount = async (profitId, userId, oldAmount) => {
    const newAmountInput = prompt(`تعديل قيمة الأرباح (القيمة الحالية: $${oldAmount}):`, oldAmount);
    if (newAmountInput === null) return;
    const newAmount = parseFloat(newAmountInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }
    if (newAmount === oldAmount) return;

    try {
      const profitRef = doc(db, 'users', userId, 'profits', profitId);
      await updateDoc(profitRef, { amount: newAmount });

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'profit'),
          where('amount', '==', oldAmount)
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await updateDoc(doc(db, 'users', userId, 'transactions', docSnap.id), {
            amount: newAmount
          });
        }
      } catch (err) {
        console.warn("Unified transaction profit update skipped:", err);
      }

      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const diff = newAmount - oldAmount;
        const newBalance = Math.max(0, (currentData.balance ?? 35) + diff);
        const newProfits = Math.max(0, (currentData.profits ?? 0) + diff);

        await updateDoc(userDocRef, {
          balance: newBalance,
          profits: newProfits,
          updatedAt: new Date().toISOString()
        });
        alert(`تم تعديل مبلغ الأرباح إلى $${newAmount} وتعديل رصيد العميل وأرباحه بالفرق ($${diff}).`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating profit amount:', error);
      alert('فشل تعديل مبلغ الأرباح.');
    }
  };

  // حذف عملية الأرباح
  const handleDeleteProfit = async (profitId, amount) => {
    if (!window.confirm(`⚠️ هل أنت متأكد من حذف هذا الربح نهائياً بقيمة $${amount}؟`)) return;

    try {
      const profitRef = doc(db, 'users', userId, 'profits', profitId);
      await deleteDoc(profitRef);

      try {
        const txQuery = query(
          collection(db, 'users', userId, 'transactions'),
          where('type', '==', 'profit'),
          where('amount', '==', parseFloat(amount))
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id));
        }
      } catch (err) {
        console.warn("Sub-transaction not found or could not be deleted:", err);
      }

      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const dedAmount = parseFloat(amount);
        await updateDoc(userDocRef, {
          balance: Math.max(0, (currentData.balance ?? 35) - dedAmount),
          profits: Math.max(0, (currentData.profits ?? 0) - dedAmount),
          updatedAt: new Date().toISOString()
        });
      }

      alert("تم حذف سجل الربح وخصمه من رصيد العميل بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error("Error deleting profit document:", error);
      alert("فشل حذف الأرباح.");
    }
  };

  if (userLoading) {
    return (
      <div style={{ background: '#0b0c10', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', direction: 'rtl', padding: '24px' }}>
        <p style={{ fontSize: '18px', color: '#00ffcc', fontWeight: 'bold' }}>⏳ جاري تحميل البيانات والملف المالي الكامل للمستثمر...</p>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div style={{ background: '#0b0c10', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', direction: 'rtl', padding: '24px' }}>
        <p style={{ fontSize: '18px', color: '#ef4444' }}>⚠️ عذراً، لم يتم العثور على هذا المستخدم في النظام.</p>
        <button onClick={() => window.close()} style={{ background: '#243043', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '16px' }}>
          ❌ إغلاق النافذة
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', padding: '24px', color: '#fff', direction: 'rtl' }}>
      
      {/* هيدر الصفحة والتحكم بالإغلاق */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2e3040', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#00ffcc', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>بوابة الرقابة الإدارية والمالية المستقلة</span>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>الملف المالي الموحد للمستثمر: {selectedUser.displayName || selectedUser.name || 'غير محدد'}</h1>
        </div>
        <button 
          onClick={() => window.close()} 
          style={{ 
            background: '#ef4444', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontWeight: '600', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 0.9}
          onMouseLeave={(e) => e.target.style.opacity = 1}
        >
          ❌ إغلاق صفحة التفاصيل والعودة
        </button>
      </div>

      <div style={{ maxWidth: '1800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* تصميم 2 أعمدة على الشاشات الكبيرة */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-3">
          
          {/* العمود الأيمن (2/3): الإحصائيات والتحكم والسجلات المالية */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="lg:col-span-2">
            
            {/* صف الكروت السريعة للمعلومات المالية الحالية */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#161a23', border: '1px solid #243043', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <span style={{ color: '#a9b5c8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>الرصيد الحالي المتاح</span>
                <strong style={{ fontSize: '24px', color: '#10b981' }}>${selectedUser.balance?.toFixed(2) || '0.00'}</strong>
              </div>
              <div style={{ background: '#161a23', border: '1px solid #243043', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <span style={{ color: '#a9b5c8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>إجمالي الإيداعات</span>
                <strong style={{ fontSize: '24px', color: '#3b82f6' }}>${(selectedUser.investments || selectedUser.totalDeposits || 0).toFixed(2)}</strong>
              </div>
              <div style={{ background: '#161a23', border: '1px solid #243043', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <span style={{ color: '#a9b5c8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>الأرباح المتراكمة</span>
                <strong style={{ fontSize: '24px', color: '#00cfc2' }}>${(selectedUser.profits || selectedUser.earnings || 0).toFixed(2)}</strong>
              </div>
              <div style={{ background: '#161a23', border: '1px solid #243043', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <span style={{ color: '#a9b5c8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>بونص الإيداع الحالي</span>
                <strong style={{ fontSize: '24px', color: '#fbbf24' }}>${selectedUser.depositBonus || 0}</strong>
              </div>
            </div>

            {/* معلومات العميل ولوحة التعديل */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-3">
              {/* معلومات المستخدم */}
              <div style={{ background: '#11131c', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px' }} className="md:col-span-1">
                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #2e3040', paddingBottom: '10px', marginBottom: '14px', color: '#00ffcc' }}>📌 معلومات المستثمر</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <p><strong>البريد الإلكتروني:</strong> {selectedUser.email || '—'}</p>
                  <p><strong>الهاتف المحقق:</strong> {selectedUser.phone || 'غير مسجل'}</p>
                  <p><strong>تاريخ التسجيل بالمنصة:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}</p>
                  <p><strong>بونص الإيداع الحالي:</strong> ${selectedUser.depositBonus || 0}</p>
                  <p><strong>تاريخ منح البونص:</strong> {selectedUser.depositBonusDate || 'بلا تاريخ مكافأة'}</p>
                </div>
                <button 
                  onClick={handleUpdateBonus}
                  style={{ width: '100%', marginTop: '16px', padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  🎁 تعديل مكافأة الإيداع وتاريخها
                </button>
              </div>

              {/* لوحة التحكم بالقيم مباشرة */}
              <div style={{ background: '#11131c', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px' }} className="md:col-span-2">
                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #2e3040', paddingBottom: '10px', marginBottom: '14px', color: '#00ffcc' }}>⚙️ لوحة التعديل والتحكم المالي الفوري</h3>
                
                <p style={{ fontSize: '12px', color: '#a9b5c8', marginBottom: '12px' }}>تعديل مباشر للقيم التراكمية المسجلة حالياً برصيد المستثمر:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => handleUpdateField('balance', selectedUser.balance, 'الرصيد المتاح')}
                    style={{ padding: '10px', background: '#1e2030', border: '1px solid #2e3040', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', textAlign: 'right' }}
                  >
                    💸 تعديل الرصيد المتاح (${selectedUser.balance || 0})
                  </button>
                  <button 
                    onClick={() => handleUpdateField('totalDeposits', selectedUser.investments || selectedUser.totalDeposits, 'إجمالي الإيداع')}
                    style={{ padding: '10px', background: '#1e2030', border: '1px solid #2e3040', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', textAlign: 'right' }}
                  >
                    📥 تعديل إجمالي الإيداع (${selectedUser.investments || selectedUser.totalDeposits || 0})
                  </button>
                  <button 
                    onClick={() => handleUpdateField('earnings', selectedUser.profits || selectedUser.earnings, 'الأرباح الكلية')}
                    style={{ padding: '10px', background: '#1e2030', border: '1px solid #2e3040', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', textAlign: 'right' }}
                  >
                    📈 تعديل الأرباح المتراكمة (${selectedUser.profits || selectedUser.earnings || 0})
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: '#a9b5c8', marginBottom: '10px' }}>تسجيل عمليات يدوية مباشرة مع توثيقها بالكامل في هستوري وهستوري معاملات المستثمر:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <button onClick={handleAddManualDeposit} style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#10b981', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ➕ إضافة إيداع
                  </button>
                  <button onClick={handleAddManualReward} style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px', color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎁 إضافة مكافأة
                  </button>
                  <button onClick={handleAddManualProfit} style={{ padding: '10px', background: 'rgba(0, 207, 194, 0.1)', border: '1px solid rgba(0, 207, 194, 0.2)', borderRadius: '8px', color: '#00cfc2', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📈 إضافة أرباح
                  </button>
                  <button onClick={handleAddManualWithdrawal} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ➖ إضافة سحب
                  </button>
                </div>
              </div>
            </div>

            {/* السجلات المعاملاتية الفرعية الأربعة */}
            <div style={{ background: '#11131c', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', borderBottom: '1px solid #2e3040', paddingBottom: '10px', marginBottom: '16px', color: '#00ffcc' }}>📑 سجل العمليات والمعاملات المالية بالكامل</h3>
              
              {userHistory.loading ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#a9b5c8' }}>جاري تحميل كافة السجلات وتاريخ العمليات...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  {/* عمود عمليات الإيداع */}
                  <div style={{ background: '#0f111a', border: '1px solid #1e2030', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', borderBottom: '1px solid #2e3040', paddingBottom: '8px', color: '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📥 عمليات الإيداع</span>
                      <span>({userHistory.deposits.length})</span>
                    </h4>
                    {userHistory.deposits.length === 0 ? (
                      <p style={{ color: '#8892b0', fontSize: '12px', textAlign: 'center', padding: '16px' }}>لا يوجد سجلات إيداع.</p>
                    ) : (
                      <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {userHistory.deposits.map(dep => (
                          <div key={dep.id} style={{ padding: '12px', background: '#161824', border: '1px solid #232534', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>${dep.amount}</span>
                              <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(dep.createdAt)}</span>
                            </div>
                            {dep.description && (
                              <p style={{ fontSize: '12px', color: '#a9b5c8', margin: 0, borderRight: '2px solid #10b981', paddingRight: '6px' }}>الوصف: {dep.description}</p>
                            )}
                            {dep.txId && (
                              <p style={{ fontSize: '10px', color: '#687590', margin: 0 }}>TxID: {dep.txId}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e2030', paddingTop: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '500', color: dep.status === 'approved' ? '#10b981' : dep.status === 'pending' ? '#fbbf24' : '#ef4444' }}>
                                {dep.status === 'approved' && 'مقبول ✓'}
                                {dep.status === 'reviewing' && 'تحت المراجعة 🔍'}
                                {dep.status === 'pending' && 'معلق ⏳'}
                                {dep.status === 'failed' && 'مرفوض ❌'}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <select 
                                  value={dep.status || 'pending'}
                                  onChange={(e) => handleUpdateDepositStatusDirect(dep.id, selectedUser.id, dep.status || 'pending', e.target.value, dep.amount, dep.txId)}
                                  style={{ background: '#10121a', color: '#fff', border: '1px solid #2e3040', borderRadius: '4px', fontSize: '11px', padding: '2px 4px', cursor: 'pointer' }}
                                >
                                  <option value="pending">⏳ معلق</option>
                                  <option value="reviewing">🔍 مراجعة</option>
                                  <option value="approved">✓ مقبول</option>
                                  <option value="failed">❌ مرفوض</option>
                                </select>
                                <button onClick={() => handleEditDepositAmount(dep.id, selectedUser.id, dep.status || 'pending', dep.amount, dep.txId || '')} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  ✏️ تعديل
                                </button>
                                <button onClick={() => handleDeleteDeposit(dep.id, dep.amount)} style={{ background: '#2d1a1e', border: 'none', color: '#f87171', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  🗑️ حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* عمود عمليات السحب */}
                  <div style={{ background: '#0f111a', border: '1px solid #1e2030', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', borderBottom: '1px solid #2e3040', paddingBottom: '8px', color: '#f87171', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📤 عمليات السحب</span>
                      <span>({userHistory.withdrawals.length})</span>
                    </h4>
                    {userHistory.withdrawals.length === 0 ? (
                      <p style={{ color: '#8892b0', fontSize: '12px', textAlign: 'center', padding: '16px' }}>لا يوجد سجلات سحب.</p>
                    ) : (
                      <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {userHistory.withdrawals.map(wit => (
                          <div key={wit.id} style={{ padding: '12px', background: '#161824', border: '1px solid #232534', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#ff4d4d', fontSize: '15px' }}>${wit.amount}</span>
                              <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(wit.createdAt)}</span>
                            </div>
                            {wit.description && (
                              <p style={{ fontSize: '12px', color: '#a9b5c8', margin: 0, borderRight: '2px solid #ff4d4d', paddingRight: '6px' }}>الوصف: {wit.description}</p>
                            )}
                            {wit.address && (
                              <p style={{ fontSize: '10px', color: '#687590', margin: 0 }}>العنوان: {wit.address}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e2030', paddingTop: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '500', color: wit.status === 'approved' ? '#10b981' : wit.status === 'pending' ? '#fbbf24' : '#ef4444' }}>
                                {wit.status === 'approved' && 'مكتمل ✓'}
                                {wit.status === 'pending' && 'معلق ⏳'}
                                {wit.status === 'failed' && 'مرفوض ❌'}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <select 
                                  value={wit.status || 'pending'}
                                  onChange={(e) => handleUpdateWithdrawalStatusDirect(wit.id, selectedUser.id, wit.status || 'pending', e.target.value, wit.amount, wit.address)}
                                  style={{ background: '#10121a', color: '#fff', border: '1px solid #2e3040', borderRadius: '4px', fontSize: '11px', padding: '2px 4px', cursor: 'pointer' }}
                                >
                                  <option value="pending">⏳ معلق</option>
                                  <option value="approved">✓ مقبول</option>
                                  <option value="failed">❌ مرفوض</option>
                                </select>
                                <button onClick={() => handleEditWithdrawalAmount(wit.id, selectedUser.id, wit.status || 'pending', wit.amount, wit.address || '')} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  ✏️ تعديل
                                </button>
                                <button onClick={() => handleDeleteWithdrawal(wit.id, wit.amount)} style={{ background: '#2d1a1e', border: 'none', color: '#f87171', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  🗑️ حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* عمود عمليات المكافآت */}
                  <div style={{ background: '#0f111a', border: '1px solid #1e2030', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', borderBottom: '1px solid #2e3040', paddingBottom: '8px', color: '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🎁 سجل المكافآت</span>
                      <span>({userHistory.rewards.length})</span>
                    </h4>
                    {userHistory.rewards.length === 0 ? (
                      <p style={{ color: '#8892b0', fontSize: '12px', textAlign: 'center', padding: '16px' }}>لا يوجد سجلات مكافآت.</p>
                    ) : (
                      <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {userHistory.rewards.map(rew => (
                          <div key={rew.id} style={{ padding: '12px', background: '#161824', border: '1px solid #232534', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '15px' }}>${rew.amount}</span>
                              <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(rew.createdAt)}</span>
                            </div>
                            {rew.description && (
                              <p style={{ fontSize: '12px', color: '#a9b5c8', margin: 0, borderRight: '2px solid #fbbf24', paddingRight: '6px' }}>الوصف: {rew.description}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e2030', paddingTop: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '500', color: '#fbbf24' }}>مكتملة ✓</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleEditRewardAmount(rew.id, selectedUser.id, rew.amount)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  ✏️ تعديل
                                </button>
                                <button onClick={() => handleDeleteReward(rew.id, rew.amount)} style={{ background: '#2d1a1e', border: 'none', color: '#f87171', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  🗑️ حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* عمود عمليات الأرباح */}
                  <div style={{ background: '#0f111a', border: '1px solid #1e2030', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 12px', borderBottom: '1px solid #2e3040', paddingBottom: '8px', color: '#00cfc2', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📈 الأرباح المحققة</span>
                      <span>({userHistory.profits.length})</span>
                    </h4>
                    {userHistory.profits.length === 0 ? (
                      <p style={{ color: '#8892b0', fontSize: '12px', textAlign: 'center', padding: '16px' }}>لا يوجد سجلات أرباح.</p>
                    ) : (
                      <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {userHistory.profits.map(prof => (
                          <div key={prof.id} style={{ padding: '12px', background: '#161824', border: '1px solid #232534', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#00cfc2', fontSize: '15px' }}>${prof.amount}</span>
                              <span style={{ fontSize: '10px', color: '#8892b0' }}>{formatDateTime(prof.createdAt)}</span>
                            </div>
                            {prof.description && (
                              <p style={{ fontSize: '12px', color: '#a9b5c8', margin: 0, borderRight: '2px solid #00cfc2', paddingRight: '6px' }}>الوصف: {prof.description}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e2030', paddingTop: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '500', color: '#00cfc2' }}>مكتملة ✓</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleEditProfitAmount(prof.id, selectedUser.id, prof.amount)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  ✏️ تعديل
                                </button>
                                <button onClick={() => handleDeleteProfit(prof.id, prof.amount)} style={{ background: '#2d1a1e', border: 'none', color: '#f87171', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                  🗑️ حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* العمود الأيسر (1/3): نظام التذاكر والدعم الفني المباشر */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="lg:col-span-1">
            
            {/* المحادثة النشطة */}
            <div style={{ background: '#11131c', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', fontSize: '16px', borderBottom: '1px solid #2e3040', paddingBottom: '10px', marginBottom: '14px', color: '#00ffcc' }}>
                <span>💬 الدعم الفني المباشر</span>
                <span style={{ fontSize: '12px', background: '#243043', padding: '4px 10px', borderRadius: '12px', color: '#02c076' }}>
                  إجمالي التذاكر: {adminConversations.length}
                </span>
              </h3>

              <div style={{ background: '#111422', border: '1px solid #2e3040', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2e3040', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: adminActiveConversation ? '#02c076' : '#9ca3af', borderRadius: '50%', display: 'inline-block' }}></span>
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                      {adminActiveConversation ? 'التذكرة المفتوحة حالياً' : 'لا توجد تذكرة مفتوحة'}
                    </strong>
                  </div>
                  {adminActiveConversation && (
                    <button
                      onClick={() => handleAdminCloseConversation(adminActiveConversation.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🔒 إغلاق التذكرة
                    </button>
                  )}
                </div>

                {adminActiveConversation ? (
                  <>
                    <div className="admin-chat-messages-container" style={{
                      height: '350px',
                      background: '#0b0e14',
                      border: '1px solid #243043',
                      borderRadius: '8px',
                      padding: '12px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginBottom: '12px'
                    }}>
                      {adminChatMessages.length === 0 ? (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#8892b0', fontSize: '12px' }}>
                          المحادثة فارغة. اكتب رسالة للبدء!
                        </div>
                      ) : (
                        adminChatMessages.map((msg) => {
                          const isAdmin = msg.sender === 'admin';
                          return (
                            <div key={msg.id || msg.createdAt} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                              maxWidth: '85%',
                              textAlign: 'right'
                            }}>
                              <div style={{
                                background: isAdmin ? '#1e2638' : '#02c076',
                                color: '#ffffff',
                                padding: '8px 12px',
                                borderRadius: isAdmin ? '12px 12px 12px 0px' : '12px 12px 0px 12px',
                                fontSize: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                wordBreak: 'break-word',
                                position: 'relative'
                              }}>
                                {msg.text}
                                
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', justifyContent: 'flex-start' }}>
                                  {isAdmin ? (
                                    <>
                                      <button 
                                        onClick={() => handleAdminEditMessage(msg.id, msg.text)}
                                        style={{ background: 'none', border: 'none', color: '#a9b5c8', fontSize: '10px', cursor: 'pointer', padding: '0' }}
                                      >
                                        ✏️ تعديل
                                      </button>
                                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>|</span>
                                      <button 
                                        onClick={() => handleAdminDeleteMessage(msg.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', padding: '0' }}
                                      >
                                        🗑️ حذف
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleAdminDeleteMessage(msg.id)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', padding: '0' }}
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

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="اكتب رسالتك للمستثمر..."
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminSendMessage()}
                        style={{
                          flex: 1,
                          background: '#151a26',
                          border: '1px solid #243043',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#ffffff',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleAdminSendMessage}
                        style={{
                          background: '#02c076',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        إرسال 🚀
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    <p style={{ fontSize: '12px', color: '#8892b0', marginBottom: '12px' }}>
                      لا توجد تذكرة دردشة مفتوحة حالياً. يمكنك فتح تذكرة جديدة لبدء محادثة.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const chatsRef = collection(db, 'users', userId, 'chats');
                          const newDoc = await addDoc(chatsRef, {
                            status: 'open',
                            createdAt: new Date().toISOString(),
                            lastMessageText: 'تم بدء تذكرة دعم مالي جديدة من قبل المشرف المالي.',
                            lastMessageAt: new Date().toISOString(),
                            hasUnreadUser: true,
                            hasUnreadSupport: false
                          });
                          
                          const msgsRef = collection(db, 'users', userId, 'chats', newDoc.id, 'messages');
                          await addDoc(msgsRef, {
                            text: "أهلاً بك عزيزي المستثمر، معك الدعم الفني والمالي المباشر. كيف يمكننا مساعدتك وتوجيهك اليوم؟",
                            sender: 'admin',
                            senderName: 'الدعم المالي المباشر',
                            createdAt: new Date().toISOString()
                          });

                          const userDocRef = doc(db, 'users', userId);
                          await updateDoc(userDocRef, {
                            hasUnreadUser: true,
                            lastAdminMessageText: "أهلاً بك عزيزي المستثمر، معك الدعم المالي المباشر. كيف يمكننا مساعدتك وتوجيهك اليوم؟",
                            lastMessageAt: new Date().toISOString()
                          });

                          alert("تم فتح تذكرة دعم جديدة بنجاح!");
                        } catch (err) {
                          console.error("Error opening ticket:", err);
                          alert("فشل فتح التذكرة.");
                        }
                      }}
                      style={{
                        background: '#02c076',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ فتح تذكرة جديدة
                    </button>
                  </div>
                )}
              </div>

              {/* أرشيف المحادثات السابقة */}
              <div style={{ background: '#141829', border: '1px solid #232a3f', borderRadius: '10px', padding: '15px' }}>
                <h4 style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px', borderBottom: '1px solid #232a3f', paddingBottom: '8px' }}>
                  📜 أرشيف المحادثات والتقييمات ({adminConversations.filter(c => c.status === 'closed').length})
                </h4>

                {adminConversations.filter(c => c.status === 'closed').length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#8892b0', textAlign: 'center', margin: '10px 0' }}>
                    لا يوجد أي محادثات مغلقة أو مؤرشفة.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {adminConversations.filter(c => c.status === 'closed').map((conv) => (
                      <div key={conv.id} style={{ background: '#1c223a', border: '1px solid #293254', borderRadius: '6px', padding: '10px' }}>
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
                          <div style={{ background: '#0e1220', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', color: '#a9b5c8', marginBottom: '6px', borderRight: '2px solid #fbbf24' }}>
                            ملاحظة العميل: {conv.ratingComment}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <button
                            onClick={() => {
                              if (adminViewingPastConv?.id === conv.id) {
                                setAdminViewingPastConv(null);
                              } else {
                                setAdminViewingPastConv(conv);
                              }
                            }}
                            style={{ background: '#243043', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            {adminViewingPastConv?.id === conv.id ? '❌ إغلاق الأرشيف' : '🔎 مراجعة الرسائل'}
                          </button>

                          <button
                            onClick={() => handleToggleChatVisibility(conv.id, conv.visibleToUser)}
                            style={{
                              background: conv.visibleToUser ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.1)',
                              border: 'none',
                              color: conv.visibleToUser ? '#10b981' : '#9ca3af',
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {conv.visibleToUser ? '👁️ مرئي للمستثمر' : '👁️‍🗨️ مخفي'}
                          </button>
                        </div>

                        {/* مراجعة رسائل الأرشيف داخلياً */}
                        {adminViewingPastConv?.id === conv.id && (
                          <div style={{ marginTop: '10px', background: '#0b0e14', borderRadius: '6px', padding: '10px', border: '1px solid #2e3040' }}>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {adminPastMessages.map(m => {
                                const isMAdmin = m.sender === 'admin';
                                return (
                                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMAdmin ? 'flex-start' : 'flex-end', maxWidth: '90%' }}>
                                    <div style={{ background: isMAdmin ? '#243043' : '#0e1220', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                                      {m.text}
                                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '2px' }}>
                                        {isMAdmin ? (
                                          <>
                                            <button onClick={() => handleAdminEditMessage(m.id, m.text, conv.id)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '9px', cursor: 'pointer' }}>✏️</button>
                                            <button onClick={() => handleAdminDeleteMessage(m.id, conv.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '9px', cursor: 'pointer' }}>🗑️</button>
                                          </>
                                        ) : (
                                          <button onClick={() => handleAdminDeleteMessage(m.id, conv.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '9px', cursor: 'pointer' }}>🗑️ حذف</button>
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

          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminUserFinancials;
