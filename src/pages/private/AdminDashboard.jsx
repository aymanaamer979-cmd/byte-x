import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentUser, userData, userDataLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(null);

  // فحص صلاحية الأدمن
  useEffect(() => {
    if (userDataLoading) return;
    if (currentUser && userData?.role === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [currentUser, userData, userDataLoading]);

  // جلب قائمة المستخدمين من الـ API
  useEffect(() => {
    if (isAuthorized !== true) return;

    let isMounted = true;

    const fetchUsersList = async () => {
      try {
        const userList = await api.adminGetUsers();
        if (isMounted) {
          // تهيئة id من _id لدعم التوافق
          const formatted = userList.map(u => ({
            id: u.uid,
            ...u
          }));
          setUsers(formatted);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        if (isMounted) setLoading(false);
      }
    };

    fetchUsersList();
    const interval = setInterval(fetchUsersList, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthorized]);

  // البيانات المالية مدمجة وترتيب ذكي للمستثمرين
  const usersWithFinancials = useMemo(() => {
    const list = users.map(user => {
      return {
        ...user,
        balance: user.balance ?? 35,
        totalDeposits: user.investments ?? 0,
        earnings: user.profits ?? 0,
        depositBonus: user.depositBonus ?? 0,
        depositBonusDate: user.depositBonusDate ?? '',
        hasPendingDeposit: user.hasPendingDeposit ?? false,
        hasPendingWithdrawal: user.hasPendingWithdrawal ?? false,
        hasPendingRequest: (user.hasPendingDeposit ?? false) || (user.hasPendingWithdrawal ?? false)
      };
    });

    return [...list].sort((a, b) => {
      const scoreA = (a.hasUnreadSupport ? 4 : 0) + (a.hasPendingRequest ? 2 : 0);
      const scoreB = (b.hasUnreadSupport ? 4 : 0) + (b.hasPendingRequest ? 2 : 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const now = new Date();
      const onlineA = a.isOnline && (now.getTime() - new Date(a.lastSeen).getTime() < 60000) ? 1 : 0;
      const onlineB = b.isOnline && (now.getTime() - new Date(b.lastSeen).getTime() < 60000) ? 1 : 0;
      if (onlineA !== onlineB) {
        return onlineB - onlineA;
      }

      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);

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
                          onClick={() => navigate(`/admin/user-financials/${user.id}`)}
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