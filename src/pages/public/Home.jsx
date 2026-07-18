import React, { useEffect } from 'react'; // 🎯 أضفنا useEffect
import { useOutletContext, useLocation } from 'react-router-dom'; // 🎯 أضفنا useLocation
import Hero from '../../components/Hero';
import Stats from '../../components/Stats';
import About from '../../components/About';
import Regulations from '../../components/Regulations';
import Awards from '../../components/Awards';
import Support from '../../components/Support';

const Home = () => {
  const { setIsPlansOpen, setIsLicenseOpen, setIsProtectionOpen } = useOutletContext();
  const location = useLocation(); // 🎯 لقراءة الـ hash (#about) القادم من الصفحات الأخرى

  // 🎯 تأثير الـ Scroll السلس عند الانتقال من صفحة أخرى مثل اللوجن
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <Hero setIsPlansOpen={setIsPlansOpen} />
      <Stats />
      
      {/* 🎯 التعديل هنا: قمنا بتغليف المكون بـ div يحمل id="about" ليرتبط برابط الهيدر */}
      <div id="about">
        <About 
          setIsLicenseOpen={setIsLicenseOpen}
          setIsProtectionOpen={setIsProtectionOpen}
          setIsPlansOpen={setIsPlansOpen}
        />
      </div>

      <Regulations />
      <Awards />
      <Support />
    </>
  );
};

export default Home;