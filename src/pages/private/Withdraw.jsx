import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import './Withdraw.css';

function Withdraw() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Vodafone Cash');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // جلب الرصيد المتاح من المستند الرئيسي للمستخدم مباشرة
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().balance ?? 35);
      }
      setLoadingBalance(false);
    }, (error) => {
      console.error('خطأ في جلب الرصيد الحقيقي للسحب:', error);
      setLoadingBalance(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 5) {
      alert('الحد الأدنى للسحب هو 5 دولار.');
      return;
    }

    if (withdrawAmount > balance) {
      alert(`عذراً، رصيدك المتاح حالياً هو $${balance}. لا يمكنك طلب سحب مبلغ أكبر من رصيدك.`);
      return;
    }

    if (!address.trim()) {
      alert('يرجى إدخال تفاصيل وعنوان استلام الأرباح.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);

      // 1. خصم المبلغ مؤقتاً من رصيد المستخدم المتاح في مستنده الرئيسي ويشير لوجود سحب معلق
      await updateDoc(userDocRef, {
        balance: balance - withdrawAmount,
        hasPendingWithdrawal: true,
        updatedAt: new Date().toISOString()
      });

      // 2. تسجيل الطلب في الكولكشن الفرعي للسحوبات تحت حساب العميل ليقوم الأدمن بمراجعته
      await addDoc(collection(db, 'users', currentUser.uid, 'withdrawals'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        amount: withdrawAmount,
        method: method,
        address: address.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // 3. إضافة المعاملة في جدول المعاملات الفرعي للمستخدم مع تحديد الحالة "معلقة"
      await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        amount: withdrawAmount,
        type: 'withdraw',
        status: 'pending',
        description: `طلب سحب عبر ${method} إلى (${address})`,
        createdAt: new Date().toISOString()
      });

      alert('تم إرسال طلب السحب بنجاح وخصم المبلغ من محفظتك المتاحة! سيقوم القسم المالي بمراجعة طلبك وإتمام التحويل خلال ساعات عمل المنصة.');
      navigate('/account');
    } catch (error) {
      console.error('خطأ أثناء تقديم طلب السحب:', error);
      alert('فشل تقديم طلب السحب، يرجى التواصل مع الدعم الفني.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-page-container">
      <div className="withdraw-card">
        <button className="back-btn" onClick={() => navigate('/account')}>
          ➡️ العودة للحساب
        </button>

        <div className="withdraw-header">
          <h2>💳 سحب الأرباح والرصيد</h2>
          <p>سحب سريع وآمن لأرباحك المحققة إلى محفظتك</p>
        </div>

        {/* عرض الرصيد المتاح حالياً */}
        <div className="balance-info-card">
          <span className="balance-label">الرصيد المتاح للسحب</span>
          {loadingBalance ? (
            <span className="balance-value">جاري التحميل...</span>
          ) : (
            <span className="balance-value">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="withdraw-form">
          <div className="form-group">
            <label>المبلغ المراد سحبه (بالدولار $)</label>
            <input
              type="number"
              className="form-control"
              placeholder="أدخل قيمة السحب بالدولار"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="5"
              max={balance}
              required
            />
            <span className="input-tip">الحد الأدنى للسحب: 5 دولار</span>
          </div>

          <div className="form-group">
            <label>وسيلة تلقي الأموال</label>
            <select
              className="form-control"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Vodafone Cash">فودافون كاش (Vodafone Cash)</option>
              <option value="USDT TRC20">USDT (TRC-20)</option>
              <option value="Bank Account">حساب بنكي محلي</option>
            </select>
          </div>

          <div className="form-group">
            {method === 'Vodafone Cash' && <label>رقم محفظة فودافون كاش المستلمة</label>}
            {method === 'USDT TRC20' && <label>عنوان محفظة USDT (شبكة TRC-20)</label>}
            {method === 'Bank Account' && <label>تفاصيل الحساب البنكي (الاسم، اسم البنك، رقم الحساب، الآيبان)</label>}
            
            <textarea
              className="form-control textarea-field"
              placeholder={
                method === 'Vodafone Cash' 
                  ? 'أدخل رقم الهاتف المربوط بالمحفظة (مثال: 01012345678)' 
                  : method === 'USDT TRC20' 
                    ? 'أدخل عنوان المحفظة بدقة (يبدأ بـ T)' 
                    : 'أدخل تفاصيل الحساب البنكي كاملة لتلقي الحوالة'
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows="3"
              required
            ></textarea>
            <span className="input-tip alert-tip">⚠️ تأكد من صحة البيانات تماماً؛ لن نتحمل مسؤولية أي تحويل لبيانات خاطئة.</span>
          </div>

          <button type="submit" className="btn-submit btn-withdraw" disabled={loading || loadingBalance}>
            {loading ? 'جاري معالجة الطلب...' : 'تقديم طلب السحب الآمن 💳'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Withdraw;
