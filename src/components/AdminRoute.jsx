import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx"; // تأكد أن مسار الـ Context عندك صحيح

const AdminRoute = ({ children }) => {
  const { currentUser, userDataLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // null يعني جاري الفحص

  useEffect(() => {
    const checkAdminClaim = async () => {
      if (currentUser) {
        try {
          // فحص الختم الخفي (Custom Claim) من التوكن
          const idTokenResult = await currentUser.getIdTokenResult();
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Error checking admin claim:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminClaim();
  }, [currentUser]);

  // أثناء التحقق، اعرض مؤشر تحميل بسيط لمنع الوميض
  if (userDataLoading || isAdmin === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
        جاري التحقق من صلاحيات الإدارة...
      </div>
    );
  }

  // لو أدمن هيدخل، لو مش أدمن هيطرد لصفحة تسجيل الدخول
  return currentUser && isAdmin ? children : <Navigate to="/login" replace />;
};

export default AdminRoute;