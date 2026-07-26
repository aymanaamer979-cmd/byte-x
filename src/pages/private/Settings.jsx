import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import './Settings.css';

function Settings() {
  const { currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // جلب البيانات الحالية للمستخدم
  useEffect(() => {
    if (!currentUser) return;

    const fetchProfile = async () => {
      try {
        const data = await api.getUserProfile(currentUser.uid);
        setDisplayName(data.displayName || '');
        setPhone(data.phone || '');
        setIsVerified(data.isVerified || false);
      } catch (error) {
        console.error('خطأ في جلب بيانات الإعدادات:', error);
      } finally {
        setFetchingData(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('يرجى إدخال اسم مستخدم صحيح.');
      return;
    }

    setLoading(true);
    try {
      // تحديث البيانات في الداتابيز
      await api.updateProfile(currentUser.uid, {
        displayName: displayName.trim(),
        phone: phone.trim()
      });

      // تنشيط البيانات في الـ Auth Context
      await refreshUserData();

      alert('تم تحديث إعدادات ملفك الشخصي بنجاح!');
      navigate('/account');
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      alert('فشل حفظ التعديلات، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="settings-page-container">
        <div className="settings-loading">جاري تحميل إعدادات الحساب...</div>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <div className="settings-card">
        <button className="back-btn" onClick={() => navigate('/account')}>
          ➡️ العودة للحساب
        </button>

        <div className="settings-header">
          <h2>⚙️ إعدادات الحساب</h2>
          <p>تعديل بيانات ملفك الشخصي وإدارة الأمان</p>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          
          {/* حالة التوثيق KYC */}
          <div className="kyc-status-container">
            <span className="kyc-label">حالة التوثيق (KYC)</span>
            {isVerified ? (
              <span className="kyc-status-badge verified">✓ حساب موثق ونشط</span>
            ) : (
              <span className="kyc-status-badge unverified">⏳ قيد المراجعة / غير موثق</span>
            )}
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني (غير قابل للتعديل)</label>
            <input
              type="email"
              className="form-control disabled-input"
              value={currentUser.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label>الاسم بالكامل (أو اسم الشهرة)</label>
            <input
              type="text"
              className="form-control"
              placeholder="مثال: أحمد محمد"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>رقم الهاتف المعتمد</label>
            <input
              type="tel"
              className="form-control"
              placeholder="مثال: +2010XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-submit btn-save" disabled={loading}>
            {loading ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات الحالية 💾'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
