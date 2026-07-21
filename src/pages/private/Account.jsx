import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import './Account.css';

function Account() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // حالات جلب البيانات الحية من API (الملف الشخصي، والعمليات)
  const [liveProfileData, setLiveProfileData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // دالة لتنسيق التاريخ والوقت باللغة العربية (سنة، شهر، يوم، ساعة، دقيقة)
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

  // الاستماع وتحديث البيانات المالية من الـ API بشكل دوري
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        const [profile, txs] = await Promise.all([
          api.getUserProfile(currentUser.uid),
          api.getUserTransactions(currentUser.uid)
        ]);

        if (isMounted) {
          setLiveProfileData(profile);
          setTransactions(txs.slice(0, 5));
          setLoadingData(false);
        }
      } catch (error) {
        console.error("❌ خطأ في جلب البيانات من MongoDB API:", error);
        if (isMounted && loadingData) {
          setLoadingData(false);
        }
      }
    };

    // جلب البيانات فوراً عند فتح المكون
    fetchData();

    // تحديث دوري كل 5 ثوانٍ لضمان حيوية الأرقام
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
                <div className="transaction-row" key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          {formatDateTime(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="tx-status-side" style={{ alignItems: 'flex-end' }}>
                      <span className="tx-amount">
                        {tx.type === 'withdraw' ? '-' : '+'}${tx.amount}
                      </span>
                      <span className={`tx-status ${tx.status}`}>
                        {tx.status === 'completed' && 'مكتملة'}
                        {tx.status === 'pending' && 'معلقة'}
                        {tx.status === 'failed' && 'مرفوضة'}
                        {tx.status === 'reviewing' && 'تحت المراجعة'}
                        {tx.status === 'suspended' && 'معلقة'}
                      </span>
                    </div>
                  </div>
                  {tx.description && (
                    <div className="tx-desc" style={{
                      color: '#8892b0',
                      fontSize: '11px',
                      marginTop: '2px',
                      borderRight: '2px solid #555c7d',
                      paddingRight: '8px',
                      textAlign: 'right',
                      wordBreak: 'break-word'
                    }}>
                      {tx.description}
                    </div>
                  )}
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