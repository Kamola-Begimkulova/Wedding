import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// VenueForm komponentini VenueOwnerRegisterVenuePage.jsx dan import qilish yoki
// umumiy components/venues papkasiga chiqarish mumkin. Agar u yerda bo'lsa:
// import VenueForm from '../../components/venues/VenueForm'; 
// Hozircha, uning strukturasini shu yerda tasavvur qilamiz.

// Agar VenueForm alohida faylda bo'lmasa, uning soddalashtirilgan varianti:
const VenueForm = ({ initialData = {}, onSubmit, isSubmitting, formTitle, submitButtonText, districts }) => {
    const [formData, setFormData] = useState({
        name: '',
        district_id: '',
        address: '',
        capacity: '',
        price: '',
        phone_number: '',
        additional_info: '',
        main_image_url: '', // Surat URLini tahrirlash, yuklash alohida bo'lishi mumkin
        // Admin tahrirlayotgan bo'lsa, status_id va owner_user_id ham bo'lishi mumkin
    });

     useEffect(() => {
        setFormData({
            name: initialData.name || '',
            district_id: initialData.district_id || '',
            address: initialData.address || '',
            capacity: initialData.capacity || '',
            price: initialData.price || '',
            phone_number: initialData.phone_number || '',
            additional_info: initialData.additional_info || '',
            main_image_url: initialData.main_image_url || '',
            // Agar Admin tahrirlayotgan bo'lsa:
            status_id: initialData.status_id || '', 
            owner_user_id: initialData.owner_user_id || null,
        });
    }, [initialData]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    return (
        <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">{formTitle}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">To'yxona Nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required 
                           className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="district_id" className="block text-sm font-medium text-gray-700">Tuman</label>
                    <select name="district_id" id="district_id" value={formData.district_id} onChange={handleChange} required
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Tanlang...</option>
                        {districts && districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Manzil</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required 
                       className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Sig'imi (o'rindiqlar soni)</label>
                    <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleChange} required min="1"
                           className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Narx (1 o'rindiq uchun, so'mda)</label>
                    <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0"
                           className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
             <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Telefon Raqam</label>
                <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange}
                       className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">Qo'shimcha Ma'lumot</label>
                <textarea name="additional_info" id="additional_info" value={formData.additional_info} onChange={handleChange} rows="4"
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div>
                <label htmlFor="main_image_url" className="block text-sm font-medium text-gray-700">Asosiy Rasm URL manzili</label>
                <input type="url" name="main_image_url" id="main_image_url" value={formData.main_image_url} onChange={handleChange}
                       placeholder="https://example.com/image.jpg"
                       className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                {/* Haqiqiy surat yuklash uchun <input type="file" /> va alohida logika kerak */}
            </div>

            <div className="pt-5">
                <button type="submit" disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {isSubmitting ? 'Saqlanmoqda...' : submitButtonText}
                </button>
            </div>
        </form>
    );
}


const VenueOwnerEditVenuePage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Rolni tekshirish uchun

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [districts, setDistrictsData] = useState([]); // Tumanlar ro'yxati

  // Tumanlarni yuklash (masalan, /api/districts endpointidan)
   const fetchDistricts = useCallback(async () => {
        try {
            // Agar sizda tumanlar uchun alohida API endpoint bo'lmasa,
            // ularni statik import qilishingiz yoki boshqa yo'l bilan olishingiz kerak
            // Bu yerda namuna uchun:
            // const response = await api.get('/districts');
            // setDistrictsData(response.data.data || []);
            setDistrictsData([
                { district_id: 1, district_name: 'Mirzo Ulugbek' },
                { district_id: 2, district_name: 'Chilonzor' },
                { district_id: 3, district_name: 'Yunusobod' },
                // ... boshqa tumanlar
            ]);
        } catch (err) {
            console.error("Tumanlarni yuklashda xatolik:", err);
            setError("Tumanlarni yuklab bo'lmadi.");
        }
    }, []);


  const fetchVenueData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // To'yxona ma'lumotlarini olish uchun GET /api/venues/:id
      const response = await api.get(`/venues/${venueId}`);
      const venueData = response.data.data;

      // Foydalanuvchi bu to'yxonaning egasi ekanligini tekshirish (yoki Admin)
      if (user?.role_name !== 'Admin' && venueData.owner_user_id !== user?.user_id) {
        setError("Sizda bu to'yxonani tahrirlash uchun ruxsat yo'q.");
        setInitialData(null); // Ruxsat bo'lmasa ma'lumotlarni ko'rsatmaslik
        return;
      }
      setInitialData(venueData);
    } catch (err) {
      setError(err.response?.data?.message || "To'yxona ma'lumotlarini yuklashda xatolik.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [venueId, user]);

  useEffect(() => {
    fetchDistricts();
    fetchVenueData();
  }, [fetchDistricts, fetchVenueData]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    try {
      let response;
      // Agar Admin tahrirlayotgan bo'lsa, maxsus admin endpointiga murojaat qilish mumkin
      if (user?.role_name === 'Admin') {
        response = await api.put(`/admin/venues/${venueId}`, formData);
      } else {
        // To'yxona egasi o'z to'yxonasini tahrirlashi uchun
        response = await api.put(`/venues/${venueId}`, formData);
      }

      if (response.data.success) {
        alert("To'yxona ma'lumotlari muvaffaqiyatli yangilandi!");
        navigate(user?.role_name === 'Admin' ? '/admin/venues' : '/owner/my-venues');
      } else {
        setError(response.data.message || "Ma'lumotlarni yangilashda xatolik.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server xatoligi.");
      console.error("Venue update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <div className="text-center py-10">Ma'lumotlar yuklanmoqda...</div>;
  if (error && !initialData) return <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-md">{error}</div>; // Agar ruxsat bo'lmasa yoki yuklashda xato
  if (!initialData) return <div className="text-center py-10">To'yxona topilmadi yoki tahrirlash uchun ruxsat yo'q.</div>;


  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
       {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <VenueForm
        initialData={initialData}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        formTitle={`"${initialData.name}" To'yxonasini Tahrirlash`}
        submitButtonText="O'zgarishlarni Saqlash"
        districts={districts} // Tumanlar ro'yxatini VenueForm ga uzatish
      />
    </div>
  );
};

export default VenueOwnerEditVenuePage;
