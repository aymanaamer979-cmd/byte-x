import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import PhoneVerification from './pages/public/PhoneVerification';
import Account from './pages/private/Account';
import AdminDashboard from './pages/private/AdminDashboard';
import Deposit from './pages/private/Deposit';
import Withdraw from './pages/private/Withdraw';
import Settings from './pages/private/Settings';
import AdminUserFinancials from './pages/private/AdminUserFinancials';

// استيراد حارس الأدمن الخاص بك من مجلد المكونات
import AdminRoute from './components/AdminRoute'; 
import { useAuth } from './context/AuthContext.jsx';

// ==========================================
// 1. مكوّن حماية المسارات العامة (PublicRoute)
// ==========================================
const PublicRoute = ({ children }) => {
  const { currentUser, userData, userDataLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkClaims = async () => {
      if (currentUser) {
        if (userData?.role === 'admin') {
          setIsAdmin(true);
          setCheckingAdmin(false);
          return;
        }
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Error checking claims:", error);
          setIsAdmin(false);
        }
      }
      setCheckingAdmin(false);
    };

    checkClaims();
  }, [currentUser, userData]);

  if (currentUser && (userDataLoading || checkingAdmin)) return null;

  if (currentUser) {
    if (isAdmin || userData?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    if (!userData?.phone) {
      return <Navigate to="/phone-verification" replace />;
    }

    return <Navigate to="/account" replace />;
  }

  return children;
};

// ==========================================
// 2. مكوّن حماية مسارات المستخدمين المسجلين (RequireAuth)
// ==========================================
const RequireAuth = ({ children }) => {
  const { currentUser, userData, userDataLoading } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userDataLoading) return null;

  if (userData?.role === 'admin') {
    return children;
  }

  if (!userData?.phone) {
    return <Navigate to="/phone-verification" replace />;
  }

  return children;
};

// ==========================================
// 3. مكوّن حماية صفحة التحقق من الهاتف
// ==========================================
const RequirePhoneNotVerified = ({ children }) => {
  const { userData, userDataLoading } = useAuth();

  if (userDataLoading) return null;

  if (userData?.phone) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

// ==========================================
// 3.5 مكوّن للتأكد من تسجيل الدخول فقط (يتجنب الفحص الدائري للهاتف)
// ==========================================
const RequireLoginOnly = ({ children }) => {
  const { currentUser, userDataLoading } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userDataLoading) return null;

  return children;
};

// ==========================================
// 4. المكوّن الرئيسي للتطبيق (App)
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />

          <Route
            path="login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="phone-verification"
            element={
              <RequireLoginOnly>
                <RequirePhoneNotVerified>
                  <PhoneVerification />
                </RequirePhoneNotVerified>
              </RequireLoginOnly>
            }
          />

          <Route
            path="account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />

          <Route
            path="deposit"
            element={
              <RequireAuth>
                <Deposit />
              </RequireAuth>
            }
          />

          <Route
            path="withdraw"
            element={
              <RequireAuth>
                <Withdraw />
              </RequireAuth>
            }
          />

          <Route
            path="settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />

          {/* مسار لوحة التحكم محمي بمكوّن الـ AdminRoute الذي أنشأته أنت */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="dashboard" element={<Navigate to="/account" replace />} />
        </Route>

        {/* مسار الملف المالي الموحد المستقل تماماً عن الـ Layout العام */}
        <Route
          path="admin/user-financials/:userId"
          element={
            <AdminRoute>
              <AdminUserFinancials />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;