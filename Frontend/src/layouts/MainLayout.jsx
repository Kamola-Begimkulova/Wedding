import React from 'react';
import Navbar from '../components/common/Navbar';
import { Outlet } from 'react-router-dom'; // Nested routes uchun

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-4">
        <Outlet /> {/* Bu yerda nested route komponentlari render bo'ladi */}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4">
        © {new Date().getFullYear()} To'yxonaBron. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
};

export default MainLayout;