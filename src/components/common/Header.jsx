import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function Header({ platformName, setIsPlansOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('خطأ أثناء تسجيل الخروج:', error);
    }
  };

  return (
    <header style={{ position: 'relative' }}>
      {/* اللوجو يعود للصفحة الرئيسية */}
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        <img src="/images/Morex.png" alt="More Logo" className="logo-img" />
        <span>{platformName}</span>
      </Link>
      
      <ul className="nav-links">
        {currentUser ? (
          /* 🟢 في حالة تسجيل الدخول: يظهر خيار ابدأ الاستثمار فقط */
          <li className="nav-item">
            <button onClick={() => setIsPlansOpen(true)} className="nav-btn-link">ابدأ استثمار الآن</button>
          </li> 
        ) : (
          /* 🔴 في حالة عدم تسجيل الدخول: تظهر الروابط العادية */
          <>
            <li className="nav-item hide-on-mobile">
              {location.pathname === '/' ? (
                <a href="#about" className="nav-link-with-icon">
                  <img src="/images/about.png" alt="About Icon" className="nav-btn-icon" />
                  <span>معلومات عنا</span>
                </a>
              ) : (
                <Link to="/#about" className="nav-link-with-icon">
                  <img src="/images/about.png" alt="About Icon" className="nav-btn-icon" />
                  <span>معلومات عنا</span>
                </Link>
              )}
            </li>
            <li className="nav-item">
              <button onClick={() => setIsPlansOpen(true)} className="nav-btn-link plans-btn">
                <img src="/images/plans.png" alt="Plans Icon" className="nav-btn-icon" />
                <span>خطط الاستثمار</span>
              </button>
            </li> 
          </>
        )}
      </ul>

      {currentUser ? (
        /* 🟢 لو مسجل دخول: تظهر أيقونة الحساب الشخصي الجديدة مع القائمة المنسدلة */
        <div className="profile-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            className="account-profile-link" 
            title="حسابي الشخصي"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="user-avatar-icon" style={{ display: 'flex', alignItems: 'center' }}>
              {/* إذا كان للمستخدم صورة على جوجل يعرضها، وإلا يعرض أيقونة accountmore.png الافتراضية */}
              <img 
                src={currentUser.photoURL || "/images/accountmore.png"} 
                alt="Account Icon" 
                className="user-avatar-img"
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--primary-color, #00ffcc)' // بوردر متناسق مع هوية الموقع الفوسفورية
                }} 
              />
            </div>
          </button>

          {/* القائمة المنسدلة عند الضغط على الأيقونة */}
          {showDropdown && (
            <div 
              className="header-dropdown" 
              style={{
                position: 'absolute',
                top: '50px',
                left: '0', // لفتحها متناسقة جهة اليسار (أو اليمين حسب رغبتك)
                background: '#111111',
                border: '1px solid #222222',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '160px',
                zIndex: 1000,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
              }}
            >
              <Link 
                to="/account" 
                onClick={() => setShowDropdown(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  color: '#ffffff', 
                  padding: '10px 16px', 
                  textDecoration: 'none',
                  fontSize: '14px' 
                }}
              >
                <i className="fa-solid fa-user-gear" style={{ color: '#00ffcc' }}></i>
                <span>حسابي الشخصي</span>
              </Link>

              {userData?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#ffffff',
                    padding: '10px 16px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa-solid fa-shield-halved" style={{ color: '#ffd166' }}></i>
                  <span>لوحة الإدارة</span>
                </Link>
              )}
              
              <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '4px 0' }} />
              
              <button 
                onClick={handleLogout}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  width: '100%', 
                  color: '#ff4d4d', 
                  background: 'none', 
                  border: 'none', 
                  padding: '10px 16px', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'right'
                }}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 🔴 لو مش مسجل دخول: يظهر زر تسجيل الدخول الذكي */
        location.pathname === '/login' ? (
          <Link to="/" className="btn-connect back-home-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-arrow-left-long btn-connect-icon-arrow" style={{ marginLeft: '8px' }}></i>
            <span>الرئيسية</span>
          </Link>
        ) : (
          <Link to="/login" className="btn-connect" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/images/login.svg" alt="Login Icon" className="btn-connect-icon" />
            <span>تسجيل الدخول</span>
          </Link>
        )
      )}
    </header>
  );
}

export default Header;