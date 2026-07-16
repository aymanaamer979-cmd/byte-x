import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import './Account.css';

function Account() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // حالات جلب البيانات الحية من Firestore (الملف الشخصي، والعمليات)
  const [liveProfileData, setLiveProfileData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 1. الاستماع الحي لبيانات الملف الشخصي والمالي المدمج في المستند الرئيسي
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveProfileData(docSnap.data());
      }
      setLoadingData(false);
    }, (error) => {
      console.error("❌ خطأ في جلب بيانات الملف الشخصي والمالي الحية:", error);
      setLoadingData(false);
    });

    return () => unsubscribeProfile();
  }, [currentUser]);

  // تم إلغاء المستمع الفرعي لـ financials لقراءة كل شيء من المستند الرئيسي مباشرة

  // 3. الاستماع الحي للعمليات الخاصة باليوزر من الـ Subcollection الفرعي (transactions) وترتيبها
  useEffect(() => {
    if (!currentUser) return;

    const txSubcollectionRef = collection(db, 'users', currentUser.uid, 'transactions');

    const unsubscribeTx = onSnapshot(txSubcollectionRef, (querySnapshot) => {
      const txList = [];
      querySnapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() });
      });

      // ترتيب العمليات برمجياً من الأحدث إلى الأقدم
      txList.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return dateB - dateA; 
      });

      setTransactions(txList.slice(0, 5));
    }, (error) => {
      console.error("❌ خطأ في جلب سجل العمليات الفرعي الحية:", error);
    });

    return () => unsubscribeTx();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('خطأ أثناء تسجيل الخروج:', error);
    }
  };

  if (!currentUser || loadingData) {
    return (
      <div className="account-loading-container">
        <div className="spinner"></div>
        <p>جاري تحميل بيانات حسابك الاستثماري وتأمين المحفظة...</p>
      </div>
    );
  }

  const totalBalance = liveProfileData?.balance ?? 35;
  const investments = liveProfileData?.investments ?? 0;
  const profits = liveProfileData?.profits ?? 0;

  // جلب الاسم المسجل بالكولكشن أو الإيميل كحالة احتياطية
  const userName = liveProfileData?.displayName || currentUser.displayName || currentUser.email.split('@')[0];

  return (
    <div className="account-page-container">
      <div className="account-card">
        
        {/* زر الترس (⚙️) في الزاوية اليسرى العلوية للحاوية */}
        <button 
          className="account-settings-gear-btn" 
          onClick={() => navigate('/settings')} // يمكنك توجيهه لصفحة الإعدادات أو فتح Modal
          title="الإعدادات"
        >
          ⚙️
        </button>
        
        {/* قسم معلومات المستخدم العلوي */}
        <div className="account-header-info">
          <div className="account-avatar-wrapper">
            <img 
              src={currentUser.photoURL || "/images/accountmore.png"} 
              alt="User Avatar" 
              className="account-large-avatar"
            />
            {liveProfileData?.isVerified && (
              <span className="kyc-badge verified">✓ موثق</span>
            )}
          </div>
          <h2>أهلاً بك، {userName} 👋</h2>
          <p className="user-email-badge">{currentUser.email}</p>
        </div>

        {/* كرت المحفظة المالي */}
        <div className="portfolio-mini-card">
          <div className="portfolio-row-main">
            <div className="portfolio-item-total">
              <span className="portfolio-label">الرصيد الإجمالي المتاح</span>
              <span className="portfolio-value total-balance">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="portfolio-row-grid">
            <div className="portfolio-sub-item">
              <span className="portfolio-label">الاستثمارات (الإيداع)</span>
              <span className="portfolio-value">
                ${investments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="portfolio-sub-item">
              <span className="portfolio-label">الأرباح التراكمية</span>
              <span className="portfolio-value profit-color">
                +${profits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* أزرار الإيداع والسحب المختصرة */}
          <div className="wallet-quick-actions">
            <button onClick={() => navigate('/deposit')} className="btn-action deposit-btn">
              💵 إيداع
            </button>
            <button onClick={() => navigate('/withdraw')} className="btn-action withdraw-btn">
              💳 سحب
            </button>
          </div>
        </div>

        <hr className="divider" />

        {/* قسم السجل المقروء مباشرة من subcollection العمليات */}
        <div className="transactions-section">
          <h3>آخر العمليات</h3>
          {transactions.length === 0 ? (
            <p className="no-tx-text">لا توجد عمليات مسجلة حالياً في محفظتك الفرعية.</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div className="transaction-row" key={tx.id}>
                  <div className="tx-info-side">
                    <span className={`tx-icon-badge ${tx.type}`}>
                      {tx.type === 'deposit' && '📥'}
                      {tx.type === 'withdraw' && '📤'}
                      {tx.type === 'reward' && '🎁'}
                    </span>
                    <div className="tx-meta">
                      <span className="tx-type-text">
                        {tx.type === 'deposit' && 'إيداع رصيد'}
                        {tx.type === 'withdraw' && 'سحب أرباح'}
                        {tx.type === 'reward' && 'بونص ترحيبي'} 
                      </span>
                      <span className="tx-date">
                        {tx.createdAt?.seconds 
                          ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) 
                          : typeof tx.createdAt === 'string' && tx.createdAt.includes('T')
                            ? new Date(tx.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                            : tx.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className="tx-status-side">
                    <span className="tx-amount">
                      {tx.type === 'withdraw' ? '-' : '+'}${tx.amount}
                    </span>
                    <span className={`tx-status ${tx.status}`}>
                      {tx.status === 'completed' && 'مكتملة'}
                      {tx.status === 'pending' && 'معلقة'}
                      {tx.status === 'failed' && 'مرفوضة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* زر تسجيل الخروج من الحساب */}
        <button type="button" onClick={handleLogout} className="btn-logout-danger-custom">
          تسجيل الخروج من الحساب
        </button>

      </div>
    </div>
  );
}

export default Account;