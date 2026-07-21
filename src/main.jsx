import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// 👇 المسار الصحيح والمعدل للملف الجديد
import './assets/styles/Global.css'

// 🎯 أضفنا استدعاء الـ Context الجديد هنا
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* 🎯 التغليف لحماية حالة تسجيل الدخول في التطبيق كله */}
      <App />
    </AuthProvider>
  </StrictMode>,
)