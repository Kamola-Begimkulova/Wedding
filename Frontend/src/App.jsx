import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// CSS fayllarini import qilish
import './css/AdminDashboard.css'; // .css kengaytmasini qo'shing
import './css/ClientDashboard.css'
import './css/HomePage.css'
import './css/Navbar.css'
import './css/OwnerDashboard.css'
import './css/VenueCard.css'
import './css/VenueDetail.css'


// Komponentlar va sahifalarni import qilish
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard'; // Bu sahifa yangilanadi
import OwnerDashboard from './pages/OwnerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import VenueDetailPage from './pages/VenueDetailPage';
import NotFoundPage from './pages/NotFoundPage';

const API_BASE_URL = 'http://localhost:5001/api'; // Backend API manzilingizni moslang
export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("localStorage dan foydalanuvchi ma'lumotini o'qishda xatolik:", e);
        localStorage.removeItem('user');
      }
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  if (loadingAuth) {
    return <div className="loading-app">Ilova yuklanmoqda...</div>;
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, API_BASE_URL }}>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
              <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
              <Route path="/venue/:venueId" element={<VenueDetailPage />} />
              <Route 
                path="/dashboard/client" 
                element={
                  <ProtectedRoute allowedRoles={['Klient', 'Admin']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/owner" 
                element={
                  <ProtectedRoute allowedRoles={['To_yxona_Egasi', 'Admin']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
export default App;