import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, updateDoc, query, where, getDocs, addDoc, getDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Import our beautiful modular components
import CustomAlertModal from '../../components/admin/CustomAlertModal';
import InvestorInfo from '../../components/admin/InvestorInfo';
import FinancialQuickStats from '../../components/admin/FinancialQuickStats';
import ManualFinancialActions from '../../components/admin/ManualFinancialActions';
import TransactionHistoryLists from '../../components/admin/TransactionHistoryLists';
import DirectSupportChat from '../../components/admin/DirectSupportChat';

import './AdminDashboard.css'; // Re-use styling variables

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

  // State managers for custom Promise-based styled Modals
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: 'More X',
    message: '',
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    placeholder: '',
    defaultValue: '',
    resolvePromise: null
  });

  // Support Chat states
  const [adminConversations, setAdminConversations] = useState([]);
  const [adminActiveConversation, setAdminActiveConversation] = useState(null);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminPastMessages, setAdminPastMessages] = useState([]);
  const [adminViewingPastConv, setAdminViewingPastConv] = useState(null);
  const [adminChatInput, setAdminChatInput] = useState("");
  const adminChatEndRef = useRef(null);
  const adminPastChatEndRef = useRef(null);

  // Promise-based Dialog Invokers to replace standard dialogs
  const showMyAlert = (message, title = 'More X') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'alert',
        placeholder: '',
        defaultValue: '',
        resolvePromise: resolve
      });
    });
  };

  const showMyConfirm = (message, title = 'More X') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        placeholder: '',
        defaultValue: '',
        resolvePromise: resolve
      });
    });
  };

  const showMyPrompt = (message, defaultValue = '', placeholder = '', title = 'More X') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'prompt',
        placeholder,
        defaultValue,
        resolvePromise: resolve
      });
    });
  };

  const handleDialogConfirm = (val) => {
    if (dialogState.resolvePromise) {
      dialogState.resolvePromise(dialogState.type === 'prompt' ? val : true);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDialogCancel = () => {
    if (dialogState.resolvePromise) {
      dialogState.resolvePromise(dialogState.type === 'prompt' ? null : false);
    }
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  // Date and Time Formatting
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

  // Fetch full details
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    await Promise.resolve();
    setUserLoading(true);
    setUserHistory(prev => ({ ...prev, loading: true }));

    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        setSelectedUser({ id: userSnap.id, ...userSnap.data() });
      } else {
        await showMyAlert("⚠️ عذراً، لم يتم العثور على هذا المستخدم في قاعدة البيانات.");
        setUserLoading(false);
        return;
      }

      const depositsQuery = query(collection(db, 'users', userId, 'deposits'));
      const depositsSnap = await getDocs(depositsQuery);
      const depositList = depositsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const withdrawalsQuery = query(collection(db, 'users', userId, 'withdrawals'));
      const withdrawalsSnap = await getDocs(withdrawalsQuery);
      const withdrawalList = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const rewardsQuery = query(collection(db, 'users', userId, 'rewards'));
      const rewardsSnap = await getDocs(rewardsQuery);
      const rewardList = rewardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserDetails]);

  // Realtime Live Chat listeners
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

      const convDocRef = doc(db, 'users', userId, 'chats', adminActiveConversation.id);
      await updateDoc(convDocRef, {
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
    } catch (err) {
      console.error("Error sending message from admin:", err);
    }
  };

  const handleAdminCloseConversation = async (convId) => {
    if (!userId || !convId) return;
    const confirmClose = await showMyConfirm("⚠️ هل أنت متأكد من إغلاق تذكرة الدعم الحالية وأرشفتها؟");
    if (!confirmClose) return;

    try {
      const convDocRef = doc(db, 'users', userId, 'chats', convId);
      await updateDoc(convDocRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        visibleToUser: true
      });

      const msgsRef = collection(db, 'users', userId, 'chats', convId, 'messages');
      await addDoc(msgsRef, {
        text: "🏁 تم إغلاق تذكرة الدعم الفني هذه من قبل الإدارة المالية. إذا واجهتك أي استفسارات أخرى، لا تتردد في بدء تذكرة جديدة.",
        sender: 'admin',
        senderName: 'الدعم المالي المباشر',
        createdAt: new Date().toISOString()
      });

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        hasUnreadUser: true,
        lastAdminMessageText: "🏁 تم إغلاق تذكرة الدعم الفني وأرشفتها.",
        lastMessageAt: new Date().toISOString()
      });

      await showMyAlert("✅ تم إغلاق تذكرة الدعم بنجاح وإحالتها للأرشيف.");
    } catch (err) {
      console.error("Error closing conversation from Admin:", err);
      await showMyAlert("فشل إغلاق التذكرة.");
    }
  };

  const handleToggleChatVisibility = async (convId, currentVisible) => {
    if (!userId || !convId) return;
    try {
      const convDocRef = doc(db, 'users', userId, 'chats', convId);
      await updateDoc(convDocRef, {
        visibleToUser: !currentVisible
      });
    } catch (error) {
      console.error("Error toggling chat visibility:", error);
      await showMyAlert("فشل تعديل حالة ظهور المحادثة.");
    }
  };

  const handleAdminEditMessage = async (msgId, oldText, customConvId = null) => {
    const convId = customConvId || adminActiveConversation?.id;
    if (!convId) return;
    const newText = await showMyPrompt("تعديل نص الرسالة المحددة:", oldText, "اكتب النص الجديد للرسالة...");
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
      await showMyAlert("فشل تعديل الرسالة.");
    }
  };

  const handleAdminDeleteMessage = async (msgId, customConvId = null) => {
    const convId = customConvId || adminActiveConversation?.id;
    if (!convId) return;
    const isConfirmed = await showMyConfirm("⚠️ هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟ لا يمكن استرجاعها.");
    if (!isConfirmed) return;

    try {
      const msgDocRef = doc(db, 'users', userId, 'chats', convId, 'messages', msgId);
      await deleteDoc(msgDocRef);
    } catch (error) {
      console.error("Error deleting chat message:", error);
      await showMyAlert("فشل حذف الرسالة.");
    }
  };

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

  const handleUpdateField = async (field, currentVal, label) => {
    const newValInput = await showMyPrompt(`تعديل ${label} الحالي (${currentVal || 0}):`, currentVal || 0, `أدخل ${label} الجديد...`);
    if (newValInput === null || newValInput.trim() === "") return;

    const parsedVal = parseFloat(newValInput);
    if (isNaN(parsedVal)) {
      await showMyAlert("الرجاء إدخال رقم صحيح.");
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
      await showMyAlert(`تم تحديث ${label} بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${label}:`, error);
      await showMyAlert('فشل التحديث بالداتابيز.');
    }
  };

  const handleUpdateBonus = async () => {
    const bonusVal = await showMyPrompt("أدخل قيمة مكافأة الإيداع الجديدة:", selectedUser.depositBonus || 0, "أدخل مبلغ المكافأة...");
    if (bonusVal === null) return;

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        depositBonus: parseFloat(bonusVal) || 0,
        depositBonusDate: new Date().toLocaleDateString('ar-EG'),
        updatedAt: new Date().toISOString()
      });
      await showMyAlert("تم تحديث مكافأة الإيداع وتاريخها!");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل تحديث مكافأة الإيداع.");
    }
  };

  const handleAddManualDeposit = async () => {
    const amountInput = await showMyPrompt('أدخل مبلغ الإيداع اليدوي ($):', '', 'أدخل المبلغ هنا...');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { 
      await showMyAlert('مبلغ غير صحيح.'); 
      return; 
    }

    const descInput = await showMyPrompt('أدخل وصف العملية (اختياري):', 'إيداع يدوي من الإدارة', 'اكتب وصف الإيداع اليدوي...');
    const descValue = descInput || 'إيداع يدوي من الإدارة';

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
        description: descValue,
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

      await showMyAlert(`✅ تم إضافة إيداع $${amount} وشحن رصيد المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة الإيداع اليدوي:', error);
      await showMyAlert('فشل الإيداع اليدوي.');
    }
  };

  const handleAddManualReward = async () => {
    const amountInput = await showMyPrompt('أدخل قيمة المكافأة ($):', '', 'أدخل قيمة بونص المكافأة...');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { 
      await showMyAlert('مبلغ غير صحيح.'); 
      return; 
    }

    const descInput = await showMyPrompt('أدخل وصف المكافأة (اختياري):', 'مكافأة من الإدارة', 'اكتب سبب أو وصف المكافأة...');
    const descValue = descInput || 'مكافأة من الإدارة';

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
        description: descValue,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'reward',
        status: 'completed',
        description: descValue,
        createdAt: new Date().toISOString()
      });

      await showMyAlert('🎁 تم إضافة مكافأة $' + amount + ' لحساب المستثمر بنجاح!');
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة المكافأة:', error);
      await showMyAlert('فشل إضافة المكافأة.');
    }
  };

  const handleAddManualProfit = async () => {
    const amountInput = await showMyPrompt('أدخل قيمة الأرباح المضافة ($):', '', 'أدخل مبلغ الربح...');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { 
      await showMyAlert('مبلغ غير صحيح.'); 
      return; 
    }

    const descInput = await showMyPrompt('أدخل وصف العملية (اختياري):', 'أرباح استثمارية مضافة', 'اكتب تفاصيل عملية الأرباح...');
    const descValue = descInput || 'أرباح استثمارية مضافة';

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
        description: descValue,
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'profit',
        status: 'completed',
        description: descValue,
        createdAt: new Date().toISOString()
      });

      await showMyAlert(`📈 تم إضافة أرباح بقيمة $${amount} لحساب المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في إضافة الأرباح:', error);
      await showMyAlert('فشل إضافة الأرباح.');
    }
  };

  const handleAddManualWithdrawal = async () => {
    const amountInput = await showMyPrompt('أدخل قيمة السحب المطلوبة ($):', '', 'أدخل المبلغ المطلوب خصمه...');
    if (amountInput === null) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) { 
      await showMyAlert('مبلغ غير صحيح.'); 
      return; 
    }

    if (amount > (selectedUser.balance || 0)) {
      await showMyAlert(`❌ المبلغ المطلوب ($${amount}) أكبر من الرصيد المتاح ($${selectedUser.balance || 0}).`);
      return;
    }

    const descInput = await showMyPrompt('أدخل وصف العملية (اختياري):', 'سحب يدوي من الإدارة', 'اكتب ملاحظات السحب اليدوي...');
    const descValue = descInput || 'سحب يدوي من الإدارة';

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userDocRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      const newBalance = Math.max(0, (currentData.balance ?? 35) - amount);

      await updateDoc(userDocRef, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'withdrawals'), {
        amount,
        status: 'approved',
        description: descValue,
        address: 'خصم مباشر يدوي من الإدارة الموثوقة',
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'withdrawal',
        status: 'completed',
        description: descValue,
        createdAt: new Date().toISOString()
      });

      await showMyAlert(`💳 تم تسجيل سحب $${amount} وخصمه من رصيد المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في السحب اليدوي:', error);
      await showMyAlert('فشل السحب اليدوي.');
    }
  };

  // Status and value adjusters inside histories
  const handleUpdateDepositStatusDirect = async (depId, uId, oldStatus, newStatus, amount, txId) => {
    try {
      const depDocRef = doc(db, 'users', uId, 'deposits', depId);
      await updateDoc(depDocRef, { status: newStatus });

      if (newStatus === 'approved' && oldStatus !== 'approved') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const curBal = uData.balance ?? 35;
          const curInv = uData.investments ?? 0;
          await updateDoc(userDocRef, {
            balance: curBal + amount,
            investments: curInv + amount,
            updatedAt: new Date().toISOString()
          });
        }
        await addDoc(collection(db, uId, 'transactions'), {
          amount,
          type: 'deposit',
          status: 'completed',
          description: `قبول فوري لعملية الإيداع (ID: ${txId || depId})`,
          createdAt: new Date().toISOString()
        });
      } else if (oldStatus === 'approved' && newStatus !== 'approved') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const curBal = uData.balance ?? 35;
          const curInv = uData.investments ?? 0;
          await updateDoc(userDocRef, {
            balance: Math.max(0, curBal - amount),
            investments: Math.max(0, curInv - amount),
            updatedAt: new Date().toISOString()
          });
        }
      }

      await refreshPendingFlagsForUser(uId);
      await showMyAlert('تم تحديث حالة المعاملة بنجاح!');
      fetchUserDetails();
    } catch (err) {
      console.error(err);
      await showMyAlert('فشل التحديث بالداتابيز.');
    }
  };

  const handleEditDepositAmount = async (depId, uId, status, oldAmount, _txId) => {
    const inputVal = await showMyPrompt(`تعديل مبلغ مستند الإيداع الحالي ($${oldAmount}):`, oldAmount, "أدخل مبلغ الإيداع الجديد...");
    if (inputVal === null || inputVal.trim() === "") return;

    const newAmount = parseFloat(inputVal);
    if (isNaN(newAmount) || newAmount <= 0) {
      await showMyAlert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }

    try {
      const depDocRef = doc(db, 'users', uId, 'deposits', depId);
      await updateDoc(depDocRef, { amount: newAmount });

      if (status === 'approved') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const diff = newAmount - oldAmount;
          const newBalance = Math.max(0, (currentData.balance ?? 35) + diff);
          const newInvestments = Math.max(0, (currentData.investments ?? 0) + diff);

          await updateDoc(userDocRef, {
            balance: newBalance,
            investments: newInvestments,
            updatedAt: new Date().toISOString()
          });
          await showMyAlert(`تم تعديل مبلغ الإيداع إلى $${newAmount} وتعديل رصيد العميل بالفرق ($${diff}).`);
        }
      } else {
        await showMyAlert(`تم تعديل مبلغ الإيداع إلى $${newAmount} بنجاح.`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating deposit:', error);
      await showMyAlert('فشل تعديل مبلغ الإيداع.');
    }
  };

  const handleDeleteDeposit = async (depId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف مستند الإيداع نهائياً بقيمة $${amount}؟ لن يؤثر على رصيد العميل الحالي.`);
    if (!confirmDel) return;

    try {
      const depRef = doc(db, 'users', userId, 'deposits', depId);
      await deleteDoc(depRef);
      await refreshPendingFlagsForUser(userId);
      await showMyAlert("تم حذف مستند الإيداع بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل حذف الإيداع.");
    }
  };

  const handleUpdateWithdrawalStatusDirect = async (witId, uId, oldStatus, newStatus, amount, address) => {
    try {
      const witDocRef = doc(db, 'users', uId, 'withdrawals', witId);
      await updateDoc(witDocRef, { status: newStatus });

      if (newStatus === 'failed' && oldStatus !== 'failed') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const curBal = currentData.balance ?? 35;
          await updateDoc(userDocRef, {
            balance: curBal + amount,
            updatedAt: new Date().toISOString()
          });
        }
        await addDoc(collection(db, uId, 'transactions'), {
          amount,
          type: 'withdrawal_refund',
          status: 'completed',
          description: `إرجاع ورفض السحب (العنوان: ${address || 'غير محدد'})`,
          createdAt: new Date().toISOString()
        });
        await showMyAlert(`تم رفض السحب وإرجاع مبلغ $${amount} إلى رصيد المستخدم!`);
      } else if (oldStatus === 'failed' && newStatus !== 'failed') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const curBal = currentData.balance ?? 35;
          await updateDoc(userDocRef, {
            balance: Math.max(0, curBal - amount),
            updatedAt: new Date().toISOString()
          });
        }
        await showMyAlert(`تم تغيير حالة السحب من مرفوض إلى مقبول وخصم $${amount} من الرصيد.`);
      } else {
        await showMyAlert('تم تحديث حالة السحب بنجاح!');
      }

      await refreshPendingFlagsForUser(uId);
      fetchUserDetails();
    } catch (err) {
      console.error(err);
      await showMyAlert('فشل التحديث.');
    }
  };

  const handleEditWithdrawalAmount = async (witId, uId, status, oldAmount, _address) => {
    const inputVal = await showMyPrompt(`تعديل مبلغ السحب الحالي ($${oldAmount}):`, oldAmount, "أدخل مبلغ السحب الجديد...");
    if (inputVal === null || inputVal.trim() === "") return;

    const newAmount = parseFloat(inputVal);
    if (isNaN(newAmount) || newAmount <= 0) {
      await showMyAlert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }

    try {
      const witDocRef = doc(db, 'users', uId, 'withdrawals', witId);
      await updateDoc(witDocRef, { amount: newAmount });

      if (status !== 'failed') {
        const userDocRef = doc(db, uId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          const diff = newAmount - oldAmount;
          const newBalance = Math.max(0, (currentData.balance ?? 35) - diff);

          await updateDoc(userDocRef, {
            balance: newBalance,
            updatedAt: new Date().toISOString()
          });
          await showMyAlert(`تم تعديل مبلغ السحب إلى $${newAmount} وتعديل رصيد العميل بفرق السحب ($${diff}).`);
        }
      } else {
        await showMyAlert(`تم تعديل مبلغ السحب إلى $${newAmount} بنجاح.`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      await showMyAlert('فشل تعديل مبلغ السحب.');
    }
  };

  const handleDeleteWithdrawal = async (witId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف طلب السحب نهائياً بقيمة $${amount}؟ لن يؤثر على رصيد العميل.`);
    if (!confirmDel) return;

    try {
      const witRef = doc(db, 'users', userId, 'withdrawals', witId);
      await deleteDoc(witRef);
      await refreshPendingFlagsForUser(userId);
      await showMyAlert("تم حذف مستند السحب بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل حذف طلب السحب.");
    }
  };

  const handleEditRewardAmount = async (rewardId, uId, oldAmount) => {
    const inputVal = await showMyPrompt(`تعديل مبلغ المكافأة الحالي ($${oldAmount}):`, oldAmount, "أدخل مبلغ المكافأة الجديد...");
    if (inputVal === null || inputVal.trim() === "") return;

    const newAmount = parseFloat(inputVal);
    if (isNaN(newAmount) || newAmount <= 0) {
      await showMyAlert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }

    try {
      const rewDocRef = doc(db, 'users', uId, 'rewards', rewardId);
      await updateDoc(rewDocRef, { amount: newAmount });

      const userDocRef = doc(db, uId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const diff = newAmount - oldAmount;
        const newBalance = Math.max(0, (currentData.balance ?? 35) + diff);

        await updateDoc(userDocRef, {
          balance: newBalance,
          updatedAt: new Date().toISOString()
        });
        await showMyAlert(`تم تعديل مبلغ المكافأة إلى $${newAmount} وتعديل رصيد العميل بالفرق ($${diff}).`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating reward:', error);
      await showMyAlert('فشل تعديل مبلغ المكافأة.');
    }
  };

  const handleDeleteReward = async (rewardId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف هذه المكافأة نهائياً بقيمة $${amount}؟ سيتم خصمها من رصيد العميل بالكامل.`);
    if (!confirmDel) return;

    try {
      const rewRef = doc(db, 'users', userId, 'rewards', rewardId);
      await deleteDoc(rewRef);

      const userDocRef = doc(db, userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const dedAmount = parseFloat(amount);
        await updateDoc(userDocRef, {
          balance: Math.max(0, (currentData.balance ?? 35) - dedAmount),
          updatedAt: new Date().toISOString()
        });
      }

      await showMyAlert("تم حذف المكافأة بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل حذف المكافأة.");
    }
  };

  const handleEditProfitAmount = async (profitId, uId, oldAmount) => {
    const inputVal = await showMyPrompt(`تعديل مبلغ الأرباح الحالي ($${oldAmount}):`, oldAmount, "أدخل مبلغ الأرباح الجديد...");
    if (inputVal === null || inputVal.trim() === "") return;

    const newAmount = parseFloat(inputVal);
    if (isNaN(newAmount) || newAmount <= 0) {
      await showMyAlert('الرجاء إدخال قيمة صحيحة وموجبة.');
      return;
    }

    try {
      const profitDocRef = doc(db, 'users', uId, 'profits', profitId);
      await updateDoc(profitDocRef, { amount: newAmount });

      try {
        const txQuery = query(
          collection(db, 'users', uId, 'transactions'),
          where('type', '==', 'profit'),
          where('amount', '==', oldAmount)
        );
        const txSnap = await getDocs(txQuery);
        for (const docSnap of txSnap.docs) {
          await updateDoc(doc(db, 'users', uId, 'transactions', docSnap.id), {
            amount: newAmount
          });
        }
      } catch (err) {
        console.warn("Unified transaction profit update skipped:", err);
      }

      const userDocRef = doc(db, uId);
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
        await showMyAlert(`تم تعديل مبلغ الأرباح إلى $${newAmount} وتعديل رصيد العميل وأرباحه بالفرق ($${diff}).`);
      }

      fetchUserDetails();
    } catch (error) {
      console.error('Error updating profit amount:', error);
      await showMyAlert('فشل تعديل مبلغ الأرباح.');
    }
  };

  const handleDeleteProfit = async (profitId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف هذا الربح نهائياً بقيمة $${amount}؟ سيتم خصمها من رصيد وأرباح المستثمر.`);
    if (!confirmDel) return;

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

      const userDocRef = doc(db, userId);
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

      await showMyAlert("تم حذف سجل الربح وخصمه من رصيد العميل بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error("Error deleting profit document:", error);
      await showMyAlert("فشل حذف الأرباح.");
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
      
      {/* Promise-based Custom Modal Container */}
      <CustomAlertModal 
        key={dialogState.isOpen ? dialogState.defaultValue : 'closed'}
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        placeholder={dialogState.placeholder}
        defaultValue={dialogState.defaultValue}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #2e3040', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#00ffcc', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>بوابة الرقابة الإدارية والمالية المستقلة</span>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>الملف المالي الموحد للعميل: {selectedUser.displayName || selectedUser.name || 'غير محدد'}</h1>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-3">
          
          {/* Right column: 2/3 of dashboard - Quick cards, info, editing, lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="lg:col-span-2">
            
            {/* Quick stats cards */}
            <FinancialQuickStats selectedUser={selectedUser} />

            {/* Investor detailed parameters grid & editing panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-3">
              <div className="md:col-span-1">
                <InvestorInfo 
                  selectedUser={selectedUser} 
                  onUpdateBonus={handleUpdateBonus} 
                />
              </div>

              <div className="md:col-span-2">
                <ManualFinancialActions 
                  selectedUser={selectedUser}
                  onUpdateField={handleUpdateField}
                  onAddManualDeposit={handleAddManualDeposit}
                  onAddManualReward={handleAddManualReward}
                  onAddManualProfit={handleAddManualProfit}
                  onAddManualWithdrawal={handleAddManualWithdrawal}
                />
              </div>
            </div>

            {/* Financial transaction history lists */}
            <TransactionHistoryLists 
              userHistory={userHistory}
              selectedUser={selectedUser}
              formatDateTime={formatDateTime}
              onUpdateDepositStatusDirect={handleUpdateDepositStatusDirect}
              onEditDepositAmount={handleEditDepositAmount}
              onDeleteDeposit={handleDeleteDeposit}
              onUpdateWithdrawalStatusDirect={handleUpdateWithdrawalStatusDirect}
              onEditWithdrawalAmount={handleEditWithdrawalAmount}
              onDeleteWithdrawal={handleDeleteWithdrawal}
              onEditRewardAmount={handleEditRewardAmount}
              onDeleteReward={handleDeleteReward}
              onEditProfitAmount={handleEditProfitAmount}
              onDeleteProfit={handleDeleteProfit}
            />

          </div>

          {/* Left Column: Support ticket chat and archive */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="lg:col-span-1">
            <DirectSupportChat 
              db={db}
              userId={userId}
              adminConversations={adminConversations}
              adminActiveConversation={adminActiveConversation}
              adminChatMessages={adminChatMessages}
              adminChatInput={adminChatInput}
              setAdminChatInput={setAdminChatInput}
              onAdminSendMessage={handleAdminSendMessage}
              onAdminCloseConversation={handleAdminCloseConversation}
              adminViewingPastConv={adminViewingPastConv}
              onSetAdminViewingPastConv={setAdminViewingPastConv}
              adminPastMessages={adminPastMessages}
              onAdminEditMessage={handleAdminEditMessage}
              onAdminDeleteMessage={handleAdminDeleteMessage}
              onToggleChatVisibility={handleToggleChatVisibility}
              adminChatEndRef={adminChatEndRef}
              adminPastChatEndRef={adminPastChatEndRef}
              selectedUser={selectedUser}
            />
          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminUserFinancials;
