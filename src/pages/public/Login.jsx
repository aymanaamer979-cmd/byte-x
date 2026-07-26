import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('خطأ أثناء تسجيل الدخول بـ Google:', error.message);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    console.log('Logging in with Facebook');
  };

  return (
    <div className="login-container">
      <div className="login-page-wrapper">

        <div className="welcome-promo-section">
          <div className="promo-badge">
            <i className="fa-solid fa-gift"></i> مكافأة ترحيبية فورية
          </div>
          <h1 className="promo-title">
            سجل الآن واحصل على <br />
            <span className="highlight-amount">35 دولار</span> <br />
            هدية في حسابك!
          </h1>
          <p className="promo-subtitle">
            انضم إلى MoreX بضغطة زر واحدة وابدأ استثمارك فوراً بدون تعقيد.
          </p>
          <div className="promo-features">
            <div className="feature-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>تفعيل فوري وآمن للمكافأة</span>
            </div>
            <div className="feature-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>لا حاجة لحفظ كلمات مرور معقدة</span>
            </div>
          </div>
        </div>

        <div className="login-card simplified-card">
          <div className="login-header">
            <h2>تسجيل الدخول السريع</h2>
            <p>اختر الطريقة المفضلة لديك للبدء</p>
          </div>

          <div className="social-login-buttons">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn-social-auth google-auth"
              disabled={loading}
            >
              <img
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/logo_googleg_color_24dp.png"
                alt="Google Logo"
                className="social-icon"
              />
              <span>{loading ? 'جاري التحميل...' : 'متابعة باستخدام Google'}</span>
            </button>

            <button type="button" onClick={handleFacebookLogin} className="btn-social-auth facebook-auth">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg"
                alt="Facebook Logo"
                className="social-icon"
              />
              <span>متابعة باستخدام Facebook</span>
            </button>
          </div>

          <div className="login-notice-text">
            بالمتابعة، أنت توافق على <a href="#terms">شروط الخدمة</a> و <a href="#privacy">سياسة الخصوصية</a> الخاصة بـ MoreX.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
