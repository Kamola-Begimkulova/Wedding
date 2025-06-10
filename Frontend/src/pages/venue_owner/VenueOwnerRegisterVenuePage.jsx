import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VenueForm = ({ initialData = {}, onSubmit, isSubmitting, formTitle, submitButtonText }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        district_id: initialData.district_id || '',
        address: initialData.address || '',
        capacity: initialData.capacity || '',
        price: initialData.price || '',
        phone_number: initialData.phone_number || '',
        additional_info: initialData.additional_info || '',
        main_image_url: initialData.main_image_url || '',
    });

    const districts = [
        { id: 1, name: 'Bektemir' },
        { id: 2, name: 'Chilonzor' },
        { id: 3, name: 'Mirobod' },
        { id: 4, name: "Mirzo Ulug'bek" },
        { id: 5, name: 'Olmazor' },
        { id: 6, name: 'Sergeli' },
        { id: 7, name: 'Shayxontohur' },
        { id: 8, name: 'Uchtepa' },
        { id: 9, name: 'Yakkasaroy' },
        { id: 10, name: 'Yashnobod' },
        { id: 11, name: 'Yunusobod' },
        { id: 12, name: 'Yangihayot' },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const { name, district_id, address, capacity, price } = formData;
        if (!name || !district_id || !address || !capacity || !price) {
            alert("Iltimos, barcha majburiy maydonlarni to'ldiring (nom, tuman, manzil, sig'im, narx).");
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">{formTitle}</h2>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">To'yxona Nomi *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <div>
                <label htmlFor="district_id" className="block text-sm font-medium text-gray-700">Tuman *</label>
                <select name="district_id" id="district_id" value={formData.district_id} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                    <option value="">Tuman tanlang</option>
                    {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Manzil *</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Sig'imi (o‘rindiqlar soni) *</label>
                <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Narx (1 o‘rindiq uchun, so‘mda) *</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Telefon raqam</label>
                <input type="text" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange}
                    placeholder="+998 90 123 45 67"
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <div>
                <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">Qo‘shimcha ma’lumot</label>
                <textarea name="additional_info" id="additional_info" value={formData.additional_info} onChange={handleChange}
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" rows={3}></textarea>
            </div>

            <div>
                <label htmlFor="main_image_url" className="block text-sm font-medium text-gray-700">Surat URL manzili</label>
                <input type="text" name="main_image_url" id="main_image_url" value={formData.main_image_url} onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
            </div>

            <button type="submit" disabled={isSubmitting}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50">
                {isSubmitting ? 'Yuborilmoqda...' : submitButtonText}
            </button>
        </form>
    );
};

const VenueOwnerRegisterVenuePage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmitVenue = async (venueData) => {
        setIsSubmitting(true);
        try {
            const payload = { ...venueData };

            const response = await api.post('/venues', payload);

            if (response.data.success) {
                alert("To'yxona muvaffaqiyatli ro'yxatdan o'tkazildi va tasdiqlash uchun yuborildi!");
                if (user?.role_name === 'Admin') navigate('/admin/venues');
                else navigate('/owner/dashboard');
            } else {
                alert(response.data.message || "To'yxonani ro'yxatdan o'tkazishda xatolik.");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Server xatoligi.");
            console.error("Venue registration error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-xl">
                <VenueForm
                    onSubmit={handleSubmitVenue}
                    isSubmitting={isSubmitting}
                    formTitle="Yangi To'yxonani Ro'yxatdan O'tkazish"
                    submitButtonText="Ro'yxatdan O'tkazish"
                />
            </div>
        </div>
    );
};

export default VenueOwnerRegisterVenuePage;
