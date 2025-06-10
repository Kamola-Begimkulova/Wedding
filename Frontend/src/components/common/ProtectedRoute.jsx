import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Yuklanmoqda...</div>; // Yoki biror spinner komponenti
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // `user` obyekti `role_name` ni o'z ichiga olishi kerak. [cite: 248]
  if (allowedRoles && user && !allowedRoles.includes(user.role_name)) {
    // Agar ruxsat etilgan rollar ko'rsatilgan bo'lsa va foydalanuvchi roli mos kelmasa
    // Foydalanuvchini ruxsat yo'q sahifasiga yoki bosh sahifaga yo'naltirish mumkin
    return <Navigate to="/" replace />; // Yoki boshqa sahifa
  }

  return children;
};

export default ProtectedRoute;