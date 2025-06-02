import React, { useEffect, useState, useCallback } from 'react'; // useEffect, useState, useCallback qo'shildi
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, NavLink, useLocation } from 'react-router-dom'; // NavLink, useLocation qo'shildi
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import api from './services/api'; // api importi VenueOwnerLayout uchun

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import VenueOwnerLayout from './layouts/VenueOwnerLayout';

// Common Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import VenueDetailsPage from './pages/VenueDetailsPage';
import UserMyBookingsPage from './pages/UserMyBookingsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminVenuesPage from './pages/admin/AdminVenuesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

// Venue Owner Pages
import VenueOwnerDashboardPage from './pages/venue_owner/VenueOwnerDashboardPage';
import VenueOwnerRegisterVenuePage from './pages/venue_owner/VenueOwnerRegisterVenuePage';
import VenueOwnerMyVenuesPage from './pages/venue_owner/VenueOwnerMyVenuesPage';
import VenueOwnerBookingsPage from './pages/venue_owner/VenueOwnerBookingsPage';
import VenueOwnerEditVenuePage from './pages/venue_owner/VenueOwnerEditVenuePage';

// Navbar
import Navbar from './components/common/Navbar';

// --- Ikonlar (VenueOwnerLayout uchun) ---
const DashboardIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const VenuesIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
const AddVenueIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const BookingsIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;




function App() {
  return (
    <AuthProvider>
      
        <Routes>
          {/* Public Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/venues/:id" element={<VenueDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute allowedRoles={['Klient']}>
                  <UserMyBookingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Admin Routes with AdminLayout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="venues" element={<AdminVenuesPage />} />
            <Route path="venues/:venueId/edit" element={<VenueOwnerEditVenuePage />} /> {/* Admin ham VenueOwnerEditVenuePage ni ishlatishi mumkin, unda rol tekshiriladi */}
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Venue Owner Routes with VenueOwnerLayout */}
          <Route 
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['Tuyxona_Egasi']}>
                <VenueOwnerLayout /> {/* Batafsil VenueOwnerLayout shu yerda ishlatiladi */}
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<VenueOwnerDashboardPage />} />
            <Route path="register-venue" element={<VenueOwnerRegisterVenuePage />} />
            <Route path="my-venues" element={<VenueOwnerMyVenuesPage />} />
            <Route path="edit-venue/:venueId" element={<VenueOwnerEditVenuePage />} />
            <Route path="venue-bookings/:venueId" element={<VenueOwnerBookingsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Not Found and Unauthorized */}
          <Route 
            path="/unauthorized" 
            element={
              <MainLayout>
                <div className="text-center py-10">
                  <h1 className="text-3xl font-bold text-red-600 mb-4">Ruxsat Yo'q!</h1>
                  <p className="text-lg text-gray-700">Sizda bu sahifaga kirish uchun ruxsat mavjud emas.</p>
                  <Link to="/" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                    Bosh Sahifaga Qaytish
                  </Link>
                </div>
              </MainLayout>
            } 
          />
           <Route 
            path="*" 
            element={
              <MainLayout>
                <div className="text-center py-10">
                  <h1 className="text-3xl font-bold text-orange-500 mb-4">Sahifa Topilmadi (404)</h1>
                  <p className="text-lg text-gray-700">Kechirasiz, siz izlayotgan sahifa mavjud emas.</p>
                  <Link to="/" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                    Bosh Sahifaga Qaytish
                  </Link>
                </div>
              </MainLayout>
            } 
          />
        </Routes>
      
    </AuthProvider>
  );
}

export default App;