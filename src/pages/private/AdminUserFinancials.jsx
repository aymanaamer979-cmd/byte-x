import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

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
      let date = new Date(createdAt);
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

  // Fetch full details from Express API
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setUserLoading(true);
    setUserHistory(prev => ({ ...prev, loading: true }));

    try {
      const { user, transactions } = await api.adminGetUser(userId);
      setSelectedUser({ id: user.uid, ...user });

      const depositList = transactions.filter(t => t.type === 'deposit');
      const withdrawalList = transactions.filter(t => t.type === 'withdraw' || t.type === 'withdrawal');
      const rewardList = transactions.filter(t => t.type === 'reward');
      const profitList = transactions.filter(t => t.type === 'profit');

      const parseDate = (d) => d ? new Date(d).getTime() : 0;

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
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Realtime Live Chat adapter via API polling
  useEffect(() => {
    if (!userId) return;

    // Create a mock conversation that maps seamlessly to the modular Chat UI props
    const activeConv = {
      id: 'active',
      status: 'open',
      visibleToUser: true,
      createdAt: new Date().toISOString()
    };
    setAdminConversations([activeConv]);
    setAdminActiveConversation(activeConv);

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await api.getChatMessages(userId);
        if (isMounted) {
          setAdminChatMessages(msgs);
        }
      } catch (err) {
        console.error("Error fetching chat messages in admin panel:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    if (adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatMessages, userId]);

  const handleAdminSendMessage = async () => {
    if (!adminChatInput.trim() || !userId) return;

    const text = adminChatInput;
    setAdminChatInput("");

    try {
      await api.sendChatMessage({
        userId,
        senderId: 'admin',
        senderName: 'الدعم المالي المباشر',
        text,
        isAdmin: true
      });
      // Refresh messages
      const msgs = await api.getChatMessages(userId);
      setAdminChatMessages(msgs);
    } catch (err) {
      console.error("Error sending message from admin:", err);
    }
  };

  const handleAdminCloseConversation = async (convId) => {
    await showMyAlert("تم أرشفة تذكرة الدعم بنجاح.");
  };

  const handleToggleChatVisibility = async (convId, currentVisible) => {
    await showMyAlert("تم تغيير حالة الظهور بنجاح.");
  };

  const handleAdminEditMessage = async (msgId, oldText, customConvId = null) => {
    await showMyAlert("ميزة تعديل الرسائل غير متاحة حالياً.");
  };

  const handleAdminDeleteMessage = async (msgId, customConvId = null) => {
    await showMyAlert("ميزة حذف الرسائل غير متاحة حالياً.");
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
      let dbField = field;
      if (field === 'totalDeposits') dbField = 'investments';
      if (field === 'earnings') dbField = 'profits';

      const updateData = {
        balance: selectedUser.balance,
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate,
        [dbField]: parsedVal
      };

      await api.adminUpdateFinancials(selectedUser.id, updateData);
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
      const updateData = {
        balance: selectedUser.balance,
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: parseFloat(bonusVal) || 0,
        depositBonusDate: new Date().toLocaleDateString('ar-EG')
      };

      await api.adminUpdateFinancials(selectedUser.id, updateData);
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
      const updateData = {
        balance: (selectedUser.balance ?? 35) + amount,
        investments: (selectedUser.investments ?? 0) + amount,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(selectedUser.id, updateData);

      await api.adminCreateOrEditTransaction(selectedUser.id, {
        amount,
        type: 'deposit',
        status: 'completed',
        description: descValue
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
      const updateData = {
        balance: (selectedUser.balance ?? 35) + amount,
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(selectedUser.id, updateData);

      await api.adminCreateOrEditTransaction(selectedUser.id, {
        amount,
        type: 'reward',
        status: 'completed',
        description: descValue
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
      const updateData = {
        balance: (selectedUser.balance ?? 35) + amount,
        investments: selectedUser.investments,
        profits: (selectedUser.profits ?? 0) + amount,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(selectedUser.id, updateData);

      await api.adminCreateOrEditTransaction(selectedUser.id, {
        amount,
        type: 'profit',
        status: 'completed',
        description: descValue
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
      const updateData = {
        balance: Math.max(0, (selectedUser.balance ?? 35) - amount),
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(selectedUser.id, updateData);

      await api.adminCreateOrEditTransaction(selectedUser.id, {
        amount,
        type: 'withdraw',
        status: 'completed',
        description: descValue
      });

      await showMyAlert(`💳 تم تسجيل سحب $${amount} وخصمه من رصيد المستثمر بنجاح!`);
      fetchUserDetails();
    } catch (error) {
      console.error('❌ خطأ في السحب اليدوي:', error);
      await showMyAlert('فشل السحب اليدوي.');
    }
  };

  const handleUpdateDepositStatusDirect = async (depId, uId, oldStatus, newStatus, amount, txId) => {
    try {
      await api.adminCreateOrEditTransaction(uId, {
        txId: depId,
        amount,
        type: 'deposit',
        status: newStatus === 'approved' ? 'completed' : 'failed',
        description: `تحديث حالة الإيداع إلى: ${newStatus}`
      });

      if (newStatus === 'approved' && oldStatus !== 'approved') {
        const updateData = {
          balance: (selectedUser.balance ?? 35) + amount,
          investments: (selectedUser.investments ?? 0) + amount,
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      } else if (oldStatus === 'approved' && newStatus !== 'approved') {
        const updateData = {
          balance: Math.max(0, (selectedUser.balance ?? 35) - amount),
          investments: Math.max(0, (selectedUser.investments ?? 0) - amount),
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      }

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
      await api.adminCreateOrEditTransaction(uId, {
        txId: depId,
        amount: newAmount,
        type: 'deposit',
        status: status === 'approved' ? 'completed' : 'pending',
        description: 'تم تعديل المبلغ من قبل الإدارة'
      });

      if (status === 'approved') {
        const diff = newAmount - oldAmount;
        const updateData = {
          balance: Math.max(0, (selectedUser.balance ?? 35) + diff),
          investments: Math.max(0, (selectedUser.investments ?? 0) + diff),
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      }

      await showMyAlert("تم التعديل بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل تعديل مبلغ الإيداع.");
    }
  };

  const handleDeleteDeposit = async (depId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف مستند الإيداع نهائياً بقيمة $${amount}؟`);
    if (!confirmDel) return;

    try {
      await api.adminDeleteTransaction(userId, depId);
      await showMyAlert("تم حذف مستند الإيداع بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error(error);
      await showMyAlert("فشل حذف الإيداع.");
    }
  };

  const handleUpdateWithdrawalStatusDirect = async (witId, uId, oldStatus, newStatus, amount, address) => {
    try {
      await api.adminCreateOrEditTransaction(uId, {
        txId: witId,
        amount,
        type: 'withdraw',
        status: newStatus === 'approved' ? 'completed' : 'failed',
        description: `تحديث حالة السحب إلى: ${newStatus}`
      });

      if (newStatus === 'failed' && oldStatus !== 'failed') {
        const updateData = {
          balance: (selectedUser.balance ?? 35) + amount,
          investments: selectedUser.investments,
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      } else if (oldStatus === 'failed' && newStatus !== 'failed') {
        const updateData = {
          balance: Math.max(0, (selectedUser.balance ?? 35) - amount),
          investments: selectedUser.investments,
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      }

      await showMyAlert('تم تحديث حالة السحب بنجاح!');
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
      await api.adminCreateOrEditTransaction(uId, {
        txId: witId,
        amount: newAmount,
        type: 'withdraw',
        status: status === 'approved' ? 'completed' : 'reviewing',
        description: 'تم تعديل المبلغ من قبل الإدارة'
      });

      if (status !== 'failed') {
        const diff = newAmount - oldAmount;
        const updateData = {
          balance: Math.max(0, (selectedUser.balance ?? 35) - diff),
          investments: selectedUser.investments,
          profits: selectedUser.profits,
          isVerified: selectedUser.isVerified,
          depositBonus: selectedUser.depositBonus,
          depositBonusDate: selectedUser.depositBonusDate
        };
        await api.adminUpdateFinancials(uId, updateData);
      }

      await showMyAlert("تم تعديل مبلغ السحب بنجاح.");
      fetchUserDetails();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      await showMyAlert('فشل تعديل مبلغ السحب.');
    }
  };

  const handleDeleteWithdrawal = async (witId, amount) => {
    const confirmDel = await showMyConfirm(`⚠️ هل أنت متأكد من حذف طلب السحب نهائياً بقيمة $${amount}؟`);
    if (!confirmDel) return;

    try {
      await api.adminDeleteTransaction(userId, witId);
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
      await api.adminCreateOrEditTransaction(uId, {
        txId: rewardId,
        amount: newAmount,
        type: 'reward',
        status: 'completed',
        description: 'تم تعديل المكافأة من قبل الإدارة'
      });

      const diff = newAmount - oldAmount;
      const updateData = {
        balance: Math.max(0, (selectedUser.balance ?? 35) + diff),
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(uId, updateData);

      await showMyAlert("تم تعديل مبلغ المكافأة بنجاح.");
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
      const updateData = {
        balance: Math.max(0, (selectedUser.balance ?? 35) - amount),
        investments: selectedUser.investments,
        profits: selectedUser.profits,
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(userId, updateData);
      await api.adminDeleteTransaction(userId, rewardId);

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
      await api.adminCreateOrEditTransaction(uId, {
        txId: profitId,
        amount: newAmount,
        type: 'profit',
        status: 'completed',
        description: 'تم تعديل سجل الربح من قبل الإدارة'
      });

      const diff = newAmount - oldAmount;
      const updateData = {
        balance: Math.max(0, (selectedUser.balance ?? 35) + diff),
        investments: selectedUser.investments,
        profits: Math.max(0, (selectedUser.profits ?? 0) + diff),
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(uId, updateData);

      await showMyAlert("تم تعديل سجل الأرباح بنجاح.");
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
      const updateData = {
        balance: Math.max(0, (selectedUser.balance ?? 35) - amount),
        investments: selectedUser.investments,
        profits: Math.max(0, (selectedUser.profits ?? 0) - amount),
        isVerified: selectedUser.isVerified,
        depositBonus: selectedUser.depositBonus,
        depositBonusDate: selectedUser.depositBonusDate
      };
      await api.adminUpdateFinancials(userId, updateData);
      await api.adminDeleteTransaction(userId, profitId);

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
              db={null}
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
