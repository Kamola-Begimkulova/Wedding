import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


// Bu formani Admin uchun to'yxona qo'shish/tahrirlash bilan umumlashtirish mumkin
const VenueForm = ({ initialData = {}, onSubmit, isSubmitting, formTitle, submitButtonText }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        district_id: initialData.district_id || '', // Backenddan tumanlar ro'yxati kelishi kerak
        address: initialData.address || '',
        capacity: initialData.capacity || '',
        price: initialData.price || '', // 1 o'rindiq uchun
        phone_number: initialData.phone_number || '',
        additional_info: initialData.additional_info || '',
        main_image_url: initialData.main_image_url || '', // Surat yuklash alohida bo'lishi mumkin
        // latitude, longitude...
    });
    const [districts, setDistricts] = useState([]); // Namuna, backenddan olinadi

    useEffect(() => {
        // TODO: Backenddan tumanlar ro'yxatini (/api/districts) yuklash
        // setDistricts([{id: 1, district_name: 'Mirzo Ulugbek'}, ...]);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">{formTitle}</h2>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">To'yxona Nomi</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
            {/* Boshqa maydonlar: district_id (select), address, capacity, price, phone_number, additional_info ... */}
             <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Manzil</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
             <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Sig'imi (o'rindiqlar soni)</label>
                <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
             <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Narx (1 o'rindiq uchun, so'mda)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required
                    className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
             {/* Surat yuklash uchun alohida komponent/logika kerak bo'ladi */}


            <button type="submit" disabled={isSubmitting}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50">
                {isSubmitting ? 'Yuborilmoqda...' : submitButtonText}
            </button>
        </form>
    );
}


const VenueOwnerRegisterVenuePage = () => {  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // owner_user_id ni avtomatik olish uchun

  const handleSubmitVenue = async (venueData) => {
    setIsSubmitting(true);
    try {
      // createVenue API owner_user_id ni tokendan oladi [cite: 390]
      // Agar Admin qo'shsa, statusni o'zi belgilashi mumkin.
      // Agar To'yxona Egasi qo'shsa, status "Kutilmoqda" bo'ladi
      const payload = { ...venueData };
      // owner_user_id ni backend tokendan oladi. Frontendda yuborish shart emas.
      // Agar Admin o'z nomidan emas, boshqa To'yxona Egasi uchun yaratsa, owner_user_id yuborishi kerak bo'lishi mumkin.
      // Hozirgi `createVenue` buni qo'llab-quvvatlamaydi, `adminVenueController.updateVenueDetailsByAdmin` da owner o'zgartiriladi [cite: 185]
      // yoki `assignOwnerToVenue` ishlatiladi.

      if (user?.role_name === 'Admin' && !venueData.status_name) {
         // Admin qo'shganda va statusni aniq ko'rsatmaganda 'Tasdiqlangan' bo'lishi mumkin
         // payload.status_name = 'Tasdiqlangan'; // yoki formadan status tanlash imkoni
      }


      const response = await api.post('/venues', payload);
      if (response.data.success) {
        alert("To'yxona muvaffaqiyatli ro'yxatdan o'tkazildi va tasdiqlash uchun yuborildi!");
        // Foydalanuvchi rolini tekshirib mos dashboardga yo'naltirish
        if (user?.role_name === 'Admin') navigate('/admin/venues');
        else navigate('/owner/dashboard'); // Yoki /owner/my-venues
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
    // Bu sahifa ham MainLayout yoki VenueOwnerLayout ichida bo'lishi kerak
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