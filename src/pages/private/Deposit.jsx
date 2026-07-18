import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import './Deposit.css';

function Deposit() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Vodafone Cash');
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 10) {
      alert('الحد الأدنى للإيداع هو 10 دولار.');
      return;
    }
    if (!txId.trim()) {
      alert('يرجى إدخال معرف المعاملة أو رقم التحويل للتحقق.');
      return;
    }

    setLoading(true);
    try {
      // 1. إضافة المعاملة في الكولكشن الفرعي للإيداعات تحت حساب العميل ليراها الأدمن والمستخدم بنظام منظم
      await addDoc(collection(db, 'users', currentUser.uid, 'deposits'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        amount: Number(amount),
        method: method,
        txId: txId.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // 2. إضافة سجل حركة مالية فرعي في محفظة المستخدم
      await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        amount: Number(amount),
        type: 'deposit',
        status: 'pending',
        description: `طلب إيداع عبر ${method} (معرف: ${txId})`,
        createdAt: new Date().toISOString()
      });

      // 3. تحديث مستند المستخدم الرئيسي بوجود طلب إيداع معلق
      await updateDoc(doc(db, 'users', currentUser.uid), {
        hasPendingDeposit: true,
        updatedAt: new Date().toISOString()
      });

      alert('تم تقديم طلب الإيداع بنجاح! سيقوم الدعم الفني بمراجعته وتفعيل الرصيد خلال دقائق.');
      navigate('/account');
    } catch (error) {
      console.error('خطأ أثناء إرسال طلب الإيداع:', error);
      alert('فشل تقديم الطلب. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-page-container">
      <div className="deposit-card">
        <button className="back-btn" onClick={() => navigate('/account')}>
          ➡️ العودة للحساب
        </button>

        <div className="deposit-header">
          <h2>💵 إيداع رصيد جديد</h2>
          <p>شحن محفظتك الاستثمارية للبدء في جني الأرباح</p>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="form-group">
            <label>قيمة الإيداع (بالدولار الأمريكي $)</label>
            <input
              type="number"
              className="form-control"
              placeholder="مثال: 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              required
            />
            <span className="input-tip">الحد الأدنى للإيداع: 10 دولار</span>
          </div>

          <div className="form-group">
            <label>طريقة الدفع</label>
            <select
              className="form-control"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Vodafone Cash">فودافون كاش (Vodafone Cash)</option>
              <option value="USDT TRC20">USDT (TRC-20)</option>
              <option value="Bank Transfer">تحويل بنكي مباشر</option>
            </select>
          </div>

          {/* معلومات الدفع بناءً على الطريقة المختارة */}
          <div className="payment-instructions-box">
            {method === 'Vodafone Cash' && (
              <>
                <p>📍 يرجى تحويل قيمة الإيداع إلى محفظة فودافون كاش التالية:</p>
                <div className="wallet-address-copy">
                  <strong>01023456789</strong>
                </div>
                <p className="warning-text">⚠️ تأكد من إرسال نفس القيمة المحددة بالدولار (سعر الصرف الحالي يظهر في التحويل).</p>
              </>
            )}

            {method === 'USDT TRC20' && (
              <>
                <p>📍 يرجى تحويل قيمة الإيداع (USDT) إلى عنوان شبكة TRC-20 التالي:</p>
                <div className="wallet-address-copy">
                  <code>TYc69fS7h5VqEpyZ96JpW9NdfG3sR4x7Tz</code>
                </div>
                <p className="warning-text">⚠️ يرجى التأكد من اختيار شبكة <strong>TRC20</strong> لتفادي ضياع الأموال.</p>
              </>
            )}

            {method === 'Bank Transfer' && (
              <>
                <p>📍 تفاصيل الحساب البنكي للتحويل المباشر:</p>
                <div className="bank-details-box">
                  <p><strong>اسم البنك:</strong> بنك مصر</p>
                  <p><strong>اسم المستفيد:</strong> شركة MoreX للاستثمار</p>
                  <p><strong>رقم الحساب:</strong> 1234567890123456</p>
                  <p><strong>الآيبان (IBAN):</strong> EG123456789012345678901234567</p>
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label>رقم المحول منه / معرف المعاملة (TxID)</label>
            <input
              type="text"
              className="form-control"
              placeholder="أدخل رقمك أو معرف العملية هنا"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              required
            />
            <span className="input-tip">نحتاج هذا للتحقق من وصول دفعتك واعتماد الرصيد</span>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'جاري إرسال الطلب...' : 'تأكيد عملية الإيداع 🔒'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Deposit;
