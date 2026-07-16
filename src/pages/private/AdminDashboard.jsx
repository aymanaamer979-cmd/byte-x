import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc, query, where, getDocs, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentUser, userDataLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(null);

  // حالات الـ Modal والتفاصيل
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userHistory, setUserHistory] = useState({
    deposits: [],
    withdrawals: [],
    loading: false
  });

  // البيانات المالية مدمجة مباشرة في مستند المستخدم الرئيسي
  const usersWithFinancials = useMemo(() => {
    return users.map(user => ({
      ...user,
      balance: user.balance ?? 35,
      totalDeposits: user.investments ?? 0,
      earnings: user.profits ?? 0,
      depositBonus: user.depositBonus ?? 0,
      depositBonusDate: user.depositBonusDate ?? ''
    }));
  }, [users]);

  // تحديد المستخدم المختار ديناميكياً من قائمة المستخدمين الحية
  const selectedUser = useMemo(() => {
    return usersWithFinancials.find(u => u.id === selectedUserId) || null;
  }, [usersWithFinancials, selectedUserId]);

  // 1. فحص صلاحية الأدمن عبر الـ Custom Claims
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('❌ خطأ أثناء التحقق من توكن الإدارة:', error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
    };

    verifyAdminStatus();
  }, [currentUser]);

  // 2. جلب قائمة المستخدمين
  useEffect(() => {
    if (isAuthorized !== true) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (querySnapshot) => {
        const userList = [];
        querySnapshot.forEach((snapshot) => {
          userList.push({ id: snapshot.id, ...snapshot.data() });
        });

        userList.sort((a, b) => {
          const nameA = (a.displayName || a.name || '').toLowerCase();
          const nameB = (b.displayName || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // البيانات المالية تُقرأ الآن مباشرة من مستند المستخدم الرئيسي - لا حاجة لـ collectionGroup

  // حساب إحصائيات المنصة الكلية مباشرة من بيانات المستخدمين
  const dashboardStats = useMemo(() => {
    let totalBal = 0;
    let totalDep = 0;
    let totalEarn = 0;

    usersWithFinancials.forEach((user) => {
      totalBal += Number(user.balance) || 0;
      totalDep += Number(user.totalDeposits) || 0;
      totalEarn += Number(user.earnings) || 0;
    });

    return {
      totalUsers: usersWithFinancials.length,
      platformBalance: totalBal.toFixed(2),
      platformDeposits: totalDep.toFixed(2),
      platformEarnings: totalEarn.toFixed(2),
    };
  }, [usersWithFinancials]);

  // 3. فتح تفاصيل مستخدم وجلب سجل معاملاته المالية (إيداعات وسحوبات)
  const handleOpenDetails = async (user) => {
    setSelectedUserId(user.id);
    setUserHistory({ deposits: [], withdrawals: [], loading: true });

    try {
      // جلب الإيداعات الخاصة بالمستخدم من كولكشن 'deposits'
      const depositsQuery = query(collection(db, 'deposits'), where('userId', '==', user.id));
      const depositsSnap = await getDocs(depositsQuery);
      const depositList = depositsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // جلب السحوبات الخاصة بالمستخدم من كولكشن 'withdrawals'
      const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', user.id));
      const withdrawalsSnap = await getDocs(withdrawalsQuery);
      const withdrawalList = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setUserHistory({
        deposits: depositList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        withdrawals: withdrawalList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        loading: false
      });
    } catch (error) {
      console.error("❌ فشل في جلب سجل العمليات للمستخدم:", error);
      setUserHistory(prev => ({ ...prev, loading: false }));
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

      // تحويل اسم الحقل في الواجهة إلى اسمه الحقيقي في قاعدة البيانات
      let dbField = field;
      if (field === 'totalDeposits') dbField = 'investments';
      if (field === 'earnings') dbField = 'profits';

      await updateDoc(userDocRef, {
        [dbField]: parsedVal,
        updatedAt: new Date().toISOString()
      });
      alert(`تم تحديث ${label} بنجاح!`);
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
    } catch (error) {
      console.error(error);
      alert("فشل تحديث مكافأة الإيداع.");
    }
  };

  // =================== دوال العمليات اليدوية الجديدة ===================

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

      // 1. تحديث الرصيد والإيداعات في المستند الرئيسي
      await updateDoc(userDocRef, {
        balance: newBalance,
        investments: newInvestments,
        updatedAt: new Date().toISOString()
      });

      // 2. تسجيل العملية في سجل المعاملات الفرعي للمستخدم
      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'deposit',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      // 3. تسجيل الإيداع في كولكشن deposits العام
      await addDoc(collection(db, 'deposits'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        amount,
        method: 'يدوي - إدارة المنصة',
        txId: `MANUAL-${Date.now()}`,
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      alert(`✅ تم إضافة إيداع $${amount} وشحن رصيد المستثمر بنجاح!`);
      handleOpenDetails(usersWithFinancials.find(u => u.id === selectedUser.id) || selectedUser);
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

      // 1. زيادة الرصيد فقط (المكافأة لا تُحتسب إيداعاً)
      await updateDoc(userDocRef, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      // 2. تسجيل المكافأة في سجل المعاملات الفرعي
      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'reward',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      alert(`🎁 تم إضافة مكافأة $${amount} لحساب المستثمر بنجاح!`);
      handleOpenDetails(usersWithFinancials.find(u => u.id === selectedUser.id) || selectedUser);
    } catch (error) {
      console.error('❌ خطأ في إضافة المكافأة:', error);
      alert('فشل إضافة المكافأة.');
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

      // 1. خصم المبلغ من الرصيد في المستند الرئيسي
      await updateDoc(userDocRef, {
        balance: newBalance,
        updatedAt: new Date().toISOString()
      });

      // 2. تسجيل السحب في سجل المعاملات الفرعي للمستخدم
      await addDoc(collection(db, 'users', selectedUser.id, 'transactions'), {
        amount,
        type: 'withdraw',
        status: 'completed',
        description: descInput,
        createdAt: new Date().toISOString()
      });

      // 3. تسجيل السحب في كولكشن withdrawals العام
      await addDoc(collection(db, 'withdrawals'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        amount,
        method: 'يدوي - إدارة المنصة',
        address: 'يدوي',
        status: 'approved',
        createdAt: new Date().toISOString()
      });

      alert(`💳 تم تسجيل سحب $${amount} وخصمه من رصيد المستثمر بنجاح!`);
      handleOpenDetails(usersWithFinancials.find(u => u.id === selectedUser.id) || selectedUser);
    } catch (error) {
      console.error('❌ خطأ في إضافة السحب اليدوي:', error);
      alert('فشل السحب اليدوي.');
    }
  };

  // دالة لتعديل حالة طلب الإيداع (من معلق لـ تحت المراجعة أو مقبول أو مرفوض) وتحديث رصيد العميل تلقائياً عند القبول
  const handleUpdateDepositStatus = async (depositId, userId, currentStatus, amount, txId) => {
    const statusChoices = {
      'pending': 'معلق',
      'reviewing': 'تحت المراجعة',
      'approved': 'مقبول',
      'failed': 'مرفوض'
    };

    const newStatus = prompt(
      `تعديل حالة الإيداع (الحالة الحالية: ${statusChoices[currentStatus] || currentStatus}):\n` +
      `أدخل 1 لـ (تحت المراجعة)\n` +
      `أدخل 2 لـ (مقبول - يضيف الرصيد تلقائياً)\n` +
      `أدخل 3 لـ (مرفوض)\n` +
      `أدخل 4 لـ (معلق)`
    );

    if (newStatus === null) return;

    let mappedStatus = '';
    if (newStatus === '1') mappedStatus = 'reviewing';
    else if (newStatus === '2') mappedStatus = 'approved';
    else if (newStatus === '3') mappedStatus = 'failed';
    else if (newStatus === '4') mappedStatus = 'pending';
    else {
      alert('اختيار غير صحيح.');
      return;
    }

    try {
      // 1. تحديث حالة الإيداع في كولكشن 'deposits' العام
      const depositRef = doc(db, 'deposits', depositId);
      await updateDoc(depositRef, { status: mappedStatus });

      // 2. تحديث حالة الحركة في كولكشن 'users/{userId}/transactions' الفرعي
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

      // 3. إذا أصبحت الحالة "مقبول" (approved)، نزيد الرصيد والإيداعات في المستند الرئيسي مباشرة
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
      } else {
        alert('تم تحديث حالة المعاملة بنجاح!');
      }

      // تحديث بيانات المستخدم المفتوح حالياً بالمودال
      const userObj = usersWithFinancials.find(u => u.id === userId);
      if (userObj) handleOpenDetails(userObj);
    } catch (error) {
      console.error('❌ خطأ أثناء تحديث حالة الإيداع:', error);
      alert('فشل التحديث بالداتابيز.');
    }
  };

  // دالة لتعديل حالة طلب السحب ورد المبلغ للمستثمر تلقائياً في حال الرفض
  const handleUpdateWithdrawalStatus = async (withdrawalId, userId, currentStatus, amount, address) => {
    const statusChoices = {
      'pending': 'معلق',
      'approved': 'مقبول / مكتمل',
      'failed': 'مرفوض'
    };

    const newStatus = prompt(
      `تعديل حالة السحب (الحالة الحالية: ${statusChoices[currentStatus] || currentStatus}):\n` +
      `أدخل 1 لـ (مقبول / مكتمل)\n` +
      `أدخل 2 لـ (مرفوض - يعيد الرصيد تلقائياً)\n` +
      `أدخل 3 لـ (معلق)`
    );

    if (newStatus === null) return;

    let mappedStatus = '';
    if (newStatus === '1') mappedStatus = 'approved';
    else if (newStatus === '2') mappedStatus = 'failed';
    else if (newStatus === '3') mappedStatus = 'pending';
    else {
      alert('اختيار غير صحيح.');
      return;
    }

    try {
      // 1. تحديث الحالة في كولكشن 'withdrawals' العام
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, { status: mappedStatus });

      // 2. تحديث الحالة في كولكشن 'users/{userId}/transactions' الفرعي
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

      // 3. إذا تم رفض السحب ولم يكن مرفوضاً من قبل، نُرجع المبلغ للمستند الرئيسي مباشرة
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
      } else {
        alert('تم تحديث حالة السحب بنجاح!');
      }

      const userObj = usersWithFinancials.find(u => u.id === userId);
      if (userObj) handleOpenDetails(userObj);
    } catch (error) {
      console.error('❌ خطأ أثناء تحديث حالة السحب:', error);
      alert('فشل التحديث.');
    }
  };

  if (userDataLoading || isAuthorized === null) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-loading">جاري التحقق من صلاحيات لوحة التحكم...</div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-loading" style={{ color: 'red' }}>
          عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-card">
        <div className="admin-header-row">
          <div>
            <p className="admin-eyebrow">بوابة الرقابة المالية</p>
            <h1>لوحة تحكم المستثمرين</h1>
          </div>
          <span className="admin-role-badge">Admin Mode</span>
        </div>

        {/* كروت الإحصائيات الأربعة */}
        <div className="admin-stats-grid stats-four-cols">
          <div className="admin-stat-box">
            <span>إجمالي المستثمرين</span>
            <strong>{dashboardStats.totalUsers}</strong>
          </div>
          <div className="admin-stat-box">
            <span>الأرصدة المتاحة للحب</span>
            <strong style={{ color: '#0ea5e9' }}>${dashboardStats.platformBalance}</strong>
          </div>
          <div className="admin-stat-box">
            <span>إجمالي الإيداعات</span>
            <strong style={{ color: '#10b981' }}>${dashboardStats.platformDeposits}</strong>
          </div>
          <div className="admin-stat-box">
            <span>أرباح المستثمرين الكلية</span>
            <strong style={{ color: '#f59e0b' }}>${dashboardStats.platformEarnings}</strong>
          </div>
        </div>

        {/* الجدول الرئيسي للمستخدمين */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">جاري تحميل المستثمرين...</div>
          ) : (
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الرصيد المتاح</th>
                  <th>إجمالي الإيداع</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {usersWithFinancials.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '600', color: '#00ffcc' }}>{user.displayName || user.name || 'غير محدد'}</td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className="finance-badge balance-color">
                        ${typeof user.balance === 'number' ? user.balance.toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td>
                      <span className="finance-badge deposit-color">
                        ${typeof user.totalDeposits === 'number' ? user.totalDeposits.toFixed(2) : '0.00'}
                      </span>
                    </td>
                    <td>
                      {/* زر التفاصيل الجديد والوحيد بالجدول */}
                      <button
                        type="button"
                        className="details-trigger-btn"
                        onClick={() => handleOpenDetails(user)}
                      >
                        🔎 التفاصيل المالية
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==================== الـ MODAL المنبثق للتفاصيل المباشرة ==================== */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUserId(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>كارت الملف المالي الموحد</h2>
              <button className="close-modal-btn" onClick={() => setSelectedUserId(null)}>×</button>
            </div>

            <div className="modal-body-scroll">
              
              {/* قسم 1: معلومات التسجيل الأساسية */}
              <div className="modal-section-box">
                <h3>📌 المعلومات الأساسية للمستثمر</h3>
                <div className="info-inline-grid">
                  <p><strong>الاسم الحقيقي:</strong> {selectedUser.displayName || selectedUser.name || 'غير محدد'}</p>
                  <p><strong>الهاتف:</strong> {selectedUser.phone || 'غير مسجل'}</p>
                  <p><strong>تاريخ التسجيل:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}</p>
                  <p><strong>مكافأة الإيداع الحالية:</strong> ${selectedUser.depositBonus || 0}</p>
                  <p><strong>تاريخ آخر مكافأة:</strong> {selectedUser.depositBonusDate || 'بلا تاريخ مكافأة'}</p>
                </div>
                <button className="modal-action-link" onClick={handleUpdateBonus}>
                  🎁 تعديل مكافأة الإيداع وتاريخها
                </button>
              </div>

              {/* قسم 2: لوحة التحكم بالقيم وتعديلها */}
              <div className="modal-section-box">
                <h3>⚙️ التحكم المالي السريع</h3>
                <p style={{ fontSize: '12px', color: '#a9b5c8', marginBottom: '12px' }}>تعديل مباشر للقيم الحالية في حساب المستثمر:</p>
                <div className="modal-control-buttons">
                  <button onClick={() => handleUpdateField('balance', selectedUser.balance, 'الرصيد المتاح')}>
                    💸 تعديل الرصيد المتاح (${selectedUser.balance || 0})
                  </button>
                  <button onClick={() => handleUpdateField('totalDeposits', selectedUser.totalDeposits, 'إجمالي الإيداع')}>
                    📥 تعديل إجمالي الإيداع (${selectedUser.totalDeposits || 0})
                  </button>
                  <button onClick={() => handleUpdateField('earnings', selectedUser.earnings, 'الأرباح الكلية')}>
                    📈 تعديل الأرباح المتراكمة (${selectedUser.earnings || 0})
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: '#a9b5c8', margin: '16px 0 10px' }}>إضافة عمليات جديدة موثقة في سجل المستثمر:</p>
                <div className="modal-control-buttons manual-ops-row">
                  <button className="btn-manual-deposit" onClick={handleAddManualDeposit}>
                    ➕ إضافة إيداع
                  </button>
                  <button className="btn-manual-reward" onClick={handleAddManualReward}>
                    🎁 إضافة مكافأة
                  </button>
                  <button className="btn-manual-withdraw" onClick={handleAddManualWithdrawal}>
                    ➖ إضافة سحب
                  </button>
                </div>
              </div>

              {/* قسم 3: هستوري الطلبات والعمليات للمستثمر */}
              <div className="modal-section-box">
                <h3>📑 السجل المالي والطلبات</h3>
                {userHistory.loading ? (
                  <p className="admin-loading">جاري سحب الهستوري والطلبات المعاملاتية...</p>
                ) : (
                  <div className="history-tab-split">
                    
                    {/* عمود عمليات الإيداع */}
                    <div className="history-column">
                      <h4>📥 طلبات وعمليات الإيداع ({userHistory.deposits.length})</h4>
                      {userHistory.deposits.length === 0 ? (
                        <p className="no-data-text">لا يوجد أي عمليات إيداع مسجلة لهذا الحساب.</p>
                      ) : (
                        <ul className="history-list">
                          {userHistory.deposits.map(dep => (
                            <li key={dep.id} className={`history-item status-${dep.status || 'pending'}`}>
                              <div className="history-info-row">
                                <span className="history-amount">${dep.amount}</span>
                                <span className="history-date">
                                  {dep.createdAt ? new Date(dep.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : 'مؤخراً'}
                                </span>
                              </div>
                              <div className="history-action-row">
                                <span className={`history-status status-text-${dep.status || 'pending'}`}>
                                  {dep.status === 'approved' && 'مقبول ✓'}
                                  {dep.status === 'reviewing' && 'تحت المراجعة 🔍'}
                                  {dep.status === 'pending' && 'معلق ⏳'}
                                  {dep.status === 'failed' && 'مرفوض ❌'}
                                </span>
                                <button 
                                  className="change-status-btn"
                                  onClick={() => handleUpdateDepositStatus(dep.id, selectedUser.id, dep.status || 'pending', dep.amount, dep.txId)}
                                >
                                  ⚙️ تعديل الحالة
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* عمود عمليات السحب */}
                    <div className="history-column">
                      <h4>📤 طلبات وعمليات السحب ({userHistory.withdrawals.length})</h4>
                      {userHistory.withdrawals.length === 0 ? (
                        <p className="no-data-text">لا يوجد أي عمليات سحب مسجلة لهذا الحساب.</p>
                      ) : (
                        <ul className="history-list">
                          {userHistory.withdrawals.map(wit => (
                            <li key={wit.id} className={`history-item status-${wit.status || 'pending'}`}>
                              <div className="history-info-row">
                                <span className="history-amount">${wit.amount}</span>
                                <span className="history-date">
                                  {wit.createdAt ? new Date(wit.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : 'مؤخراً'}
                                </span>
                              </div>
                              <div className="history-action-row">
                                <span className={`history-status status-text-${wit.status || 'pending'}`}>
                                  {wit.status === 'approved' && 'مكتمل ✓'}
                                  {wit.status === 'pending' && 'معلق ⏳'}
                                  {wit.status === 'failed' && 'مرفوض ❌'}
                                </span>
                                <button 
                                  className="change-status-btn"
                                  onClick={() => handleUpdateWithdrawalStatus(wit.id, selectedUser.id, wit.status || 'pending', wit.amount, wit.address)}
                                >
                                  ⚙️ تعديل الحالة
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;