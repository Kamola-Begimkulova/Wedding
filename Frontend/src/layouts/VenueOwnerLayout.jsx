import React, { useEffect, useState } from 'react';
import { Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // AuthContext dan user ma'lumotlarini olish
import Navbar from '../components/common/Navbar'; // Umumiy Navbar
import api from '../services/api'; // API so'rovlari uchun

// Icons for sidebar (optional, you can use a library like react-icons)
const DashboardIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const VenuesIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
const AddVenueIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const BookingsIcon = () => <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;


const VenueOwnerLayout = () => {
  const { user, loading: authLoading} = useAuth();
  const location = useLocation();
  const [activeVenueId, setActiveVenueId] = useState(null); // Agar bitta aktiv to'yxona bo'lsa

  useEffect(() => {
    // Agar to'yxona egasining faqat bitta to'yxonasi bo'lsa yoki
    // birinchi to'yxonasini avtomatik tanlash logikasi
    const fetchOwnerVenues = async () => {
      if (user && user.role_name == 'Tuyxona_Egasi') {
        try {
          const response = await api.get('/venues/my-venues/list');
          const venues = response.data.data;
          if (venues && venues.length > 0) {
            // Masalan, birinchi tasdiqlangan to'yxonani tanlash
            const firstConfirmedVenue = venues.find(v => v.venue_status === 'Tasdiqlangan');
            if (firstConfirmedVenue) {
              setActiveVenueId(firstConfirmedVenue.venue_id);
            } else if (venues.length > 0) {
              setActiveVenueId(venues[0].venue_id); // Yoki shunchaki birinchisini
            }
          }
        } catch (error) {
          console.error("To'yxona egasining to'yxonalarini yuklashda xatolik:", error);
        }
      }
    };
    if (user && user.role_name === 'Tuyxona_Egasi') {
        fetchOwnerVenues();
    }
  }, [user]);


if (authLoading) {
  return <div className="flex justify-center items-center min-h-screen">Yuklanmoqda...</div>;
}

if (!user) {
  return <Navigate to="/login" replace />;
}

if (user.role_name !== 'Tuyxona_Egasi') {
  return <Navigate to="/" replace />;
}


  const navLinkClass = "flex items-center py-2.5 px-4 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition duration-150 ease-in-out";
  const activeNavLinkClass = "flex items-center py-2.5 px-4 bg-indigo-500 text-white rounded-md shadow-md";


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 lg:w-72 pr-0 md:pr-6 lg:pr-8 mb-6 md:mb-0 flex-shrink-0">
          <nav className="bg-white shadow-xl rounded-lg p-5 sticky top-24"> {/* Sticky sidebar */}
            <h3 className="text-xl font-semibold text-indigo-700 mb-5 border-b pb-3">
              To'yxona Boshqaruvi
            </h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/owner/dashboard" className={({ isActive }) => isActive ? activeNavLinkClass : navLinkClass}>
                  <DashboardIcon />
                  Boshqaruv Paneli
                </NavLink>
              </li>
              <li>
                <NavLink to="/owner/my-venues" className={({ isActive }) => isActive ? activeNavLinkClass : navLinkClass}>
                  <VenuesIcon />
                  Mening To'yxonalarim
                </NavLink>
              </li>
              <li>
                <NavLink to="/owner/register-venue" className={({ isActive }) => isActive ? activeNavLinkClass : navLinkClass}>
                  <AddVenueIcon />
                  Yangi To'yxona Qo'shish
                </NavLink>
              </li>
              {activeVenueId && ( // Agar aktiv to'yxona tanlangan bo'lsa, uning bronlarini ko'rsatish
                <li>
                  <NavLink 
                    to={`/owner/venue-bookings/${activeVenueId}`} 
                    className={({ isActive }) => 
                        location.pathname.includes(`/owner/venue-bookings/${activeVenueId}`) ? activeNavLinkClass : navLinkClass
                    }
                  >
                    <BookingsIcon />
                    Joriy To'yxona Bronlari
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
        </aside>
        <main className="w-full bg-white shadow-xl rounded-lg p-6 md:p-8">
          <Outlet /> {/* Bu yerda nested route komponentlari render bo'ladi */}
        </main>
      </div>
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        &copy; {new Date().getFullYear()} To'yxonaBron - To'yxona Egasi Paneli
      </footer>
    </div>
  );
};

// NavLink react-router-dom dan import qilinishi kerak
import { NavLink } from 'react-router-dom';

export default VenueOwnerLayout;