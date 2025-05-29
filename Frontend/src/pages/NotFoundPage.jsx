import React from 'react'; // React ni import qilish
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="page-container not-found-page">
        <h2>404 - Sahifa Topilmadi</h2>
        <p>Kechirasiz, siz qidirayotgan sahifa mavjud emas.</p>
        <RouterLink to="/" className="action-link">Asosiy sahifaga qaytish</RouterLink>
    </div>
);
export default NotFoundPage;