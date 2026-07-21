import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, collectionGroup } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentUser, userDataLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(null);

  // حالات الطلبات المعلقة في النظام لتوفير إشعار سريع وترتيب فوري
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);

  // 1. الاستماع للإيداعات المعلقة في المنصة عبر Collection Group Query
  useEffect(() => {
    if (isAuthorized !== true) return;
    const q = query(collectionGroup(db, 'deposits'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingDeposits(list);
    }, (err) => {
      console.error("Error listening to pending deposits:", err);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // 2. الاستماع للسحوبات المعلقة في المنصة عبر Collection Group Query
  useEffect(() => {
    if (isAuthorized !== true) return;
    const q = query(collectionGroup(db, 'withdrawals'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingWithdrawals(list);
    }, (err) => {
      console.error("Error listening to pending withdrawals:", err);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // البيانات المالية مدمجة وترتيب ذكي للمستثمرين (غير المقروء أولاً، ثم الطلبات المعلقة، ثم المتصل، ثم الأبجدي)
  const usersWithFinancials = useMemo(() => {
    const list = users.map(user => {
      const hasPendingDeposit = user.hasPendingDeposit === true || pendingDeposits.some(d => d.userId === user.id);
      const hasPendingWithdrawal = user.hasPendingWithdrawal === true || pendingWithdrawals.some(w => w.userId === user.id);
      return {
        ...user,
        balance: user.balance ?? 35,
        totalDeposits: user.investments ?? 0,
        earnings: user.profits ?? 0,
        depositBonus: user.depositBonus ?? 0,
        depositBonusDate: user.depositBonusDate ?? '',
        hasPendingDeposit,
        hasPendingWithdrawal,
        hasPendingRequest: hasPendingDeposit || hasPendingWithdrawal
      };
    });

    return [...list].sort((a, b) => {
      // أ) الأولوية القصوى للرسائل غير المقروءة أو الطلبات المعلقة
      const scoreA = (a.hasUnreadSupport ? 4 : 0) + (a.hasPendingRequest ? 2 : 0);
      const scoreB = (b.hasUnreadSupport ? 4 : 0) + (b.hasPendingRequest ? 2 : 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // ب) الأولوية الثانية: المتصلون بالإنترنت الآن (خلال آخر 60 ثانية)
      const now = new Date();
      const onlineA = a.isOnline && (now - new Date(a.lastSeen) < 60000) ? 1 : 0;
      const onlineB = b.isOnline && (now - new Date(b.lastSeen) < 60000) ? 1 : 0;
      if (onlineA !== onlineB) {
        return onlineB - onlineA;
      }

      // ج) الترتيب الثالث: الاسم أبجدياً
      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, pendingDeposits, pendingWithdrawals]);

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
                {usersWithFinancials.map((user) => {
                  const now = new Date();
                  const isOnline = user.isOnline && (now - new Date(user.lastSeen) < 60000);
                  return (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '600', color: '#00ffcc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* مؤشر الاتصال بالإنترنت */}
                          <span 
                            style={{
                              width: '10px',
                              height: '10px',
                              background: isOnline ? '#02c076' : '#4b5563',
                              borderRadius: '50%',
                              display: 'inline-block',
                              boxShadow: isOnline ? '0 0 8px #02c076' : 'none',
                              marginLeft: '4px'
                            }} 
                            title={isOnline ? "متصل الآن بالمنصة" : "غير متصل حالياً"} 
                          />
                          <span>{user.displayName || user.name || 'غير محدد'}</span>

                          {/* إشعار رسائل دعم غير مقروءة */}
                          {user.hasUnreadSupport && (
                            <span className="pulse-unread-badge" style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              💬 رسالة جديدة
                            </span>
                          )}

                          {/* إشعار طلب إيداع معلق */}
                          {user.hasPendingDeposit && (
                            <span style={{
                              background: '#fbbf24',
                              color: '#000000',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              📥 طلب إيداع معلق
                            </span>
                          )}

                          {/* إشعار طلب سحب معلق */}
                          {user.hasPendingWithdrawal && (
                            <span style={{
                              background: '#f87171',
                              color: '#ffffff',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              📤 طلب سحب معلق
                            </span>
                          )}
                        </div>
                      </td>
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
                        <button
                          type="button"
                          className="details-trigger-btn"
                          onClick={() => window.open(`/admin/user-financials/${user.id}`, '_blank')}
                        >
                          🔎 التفاصيل المالية
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;