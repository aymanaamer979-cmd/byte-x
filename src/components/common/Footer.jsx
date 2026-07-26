import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // استيراد useLocation والـ Link للتنقل الذكي
import './Footer.css';

function Footer({ platformName, setIsLicenseOpen, setIsProtectionOpen, setIsPlansOpen }) {
  const location = useLocation();

  return (
    <footer>
      <div className="footer-header">
        
        {/* اللوجو يدمج النص والصورة معاً بالترتيب الصحيح بصرياً */}
<Link to="/" className="logo-footer" style={{ textDecoration: 'none' }}>
  {/* وضعنا الصورة أولاً في الكود لتظهر على اليسار بصرياً في وضع الـ RTL وتكمل الكلمة More X */}
  <img src="/images/Morex.png" alt="More Logo" className="logo-footer-img" />
  <span style={{ color: '#fff' }}>More</span>
</Link>
        
        {/* القائمة بنفس توزيعتها وتنسيقها المستقر عندك */}
        <ul className="nav-links">
          <li>
            {/* التنقل الذكي لسكشن معلومات عنا */}
            {location.pathname === '/' ? (
              <a href="#about">معلومات عنا</a>
            ) : (
              <Link to="/#about">معلومات عنا</Link>
            )}
          </li>
          <li>
            <button onClick={() => setIsLicenseOpen(true)} className="nav-btn-link" style={{ color: '#f3ba2f', fontWeight: 'bold' }}>
              التراخيص
            </button>
          </li>
          <li>
            <button onClick={() => setIsProtectionOpen(true)} className="nav-btn-link" style={{ color: '#02c076', fontWeight: 'bold' }}>
              حماية أموال العميل
            </button>
          </li>
          <li>
            <button onClick={() => setIsPlansOpen(true)} className="nav-btn-link">
              الخطط الاستثمارية
            </button>
          </li>
        </ul>
        
        {/* حقوق النشر باسم المنصة المتغير */}
        <div className="copyright">
          &copy; {new Date().getFullYear()} <strong>{platformName}X</strong>. جميع الحقوق محفوظة.
        </div>

      </div>
    </footer>
  );
}

export default Footer;