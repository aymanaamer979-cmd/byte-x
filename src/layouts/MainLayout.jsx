import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header'; // اضبط المسار حسب مكان ملفك الجديد
import Footer from '../components/common/Footer';
import ChatWidget from '../components/common/ChatWidget';
import AdminChatWidget from '../components/admin/AdminChatWidget';
import LicenseModal from '../components/LicenseModal';
import ProtectionModal from '../components/ProtectionModal';
import PlansModal from '../components/PlansModal';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { userData } = useAuth();
  const platformName = 'More';

  // الحالات الثابتة للكروت
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isProtectionOpen, setIsProtectionOpen] = useState(false);

  const isLoggedIn = !!userData;

  return (
    <div dir="rtl" className="app-container">
      <Header 
        platformName={platformName} 
        isLoggedIn={isLoggedIn} 
        setIsPlansOpen={setIsPlansOpen} 
      />

      {/* 🎯 هنا السحر كله: الـ Outlet هيمرر الصفحات المتغيرة (Home, Login, Register) */}
      {/* وبنمرر معاها الـ States عشان الكروت تشتغل من أي صفحة */}
      <main>
        <Outlet context={{ setIsPlansOpen, setIsLicenseOpen, setIsProtectionOpen }} />
      </main>

      <Footer 
        platformName={platformName}
        setIsLicenseOpen={setIsLicenseOpen}
        setIsProtectionOpen={setIsProtectionOpen}
        setIsPlansOpen={setIsPlansOpen}
      />

      <PlansModal isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)} />
      <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />
      <ProtectionModal isOpen={isProtectionOpen} onClose={() => setIsProtectionOpen(false)} />
      
      {userData?.role === 'admin' ? <AdminChatWidget /> : <ChatWidget />}
    </div>
  );
};

export default MainLayout;