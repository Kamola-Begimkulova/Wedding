import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Placeholder ikonlar
const UploadIcon = () => <svg className="w-5 h-5 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M16.88 9.1A4 4 0 0116 17H5a5 5 0 01-1-9.9V7a3 3 0 014.52-2.59A4.98 4.98 0 0117 8c0 .28-.02.54-.06.78l.06.01zm-3.59-1.13a.75.75 0 00-1.06-1.06L11 7.69V3a.75.75 0 00-1.5 0v4.69L8.77 6.91a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l2.5-2.5z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>;
const StarIcon = ({ isMain }) => <svg className={`w-4 h-4 ${isMain ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>;


const VenueImageManager = ({ venueId, initialMainImageUrl }) => {
  const [images, setImages] = useState([]);
  const [mainImageUrl, setMainImageUrl] = useState(initialMainImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchImages = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError('');
    try {
      // Backend API: GET /api/venues/:venueId/images (yoki /api/venueimage?venueId=...)
      // Marshrutlar faylida /api/venues/:venueId/images getVenueImagesHandler ga ulanadi [cite: 45, 34, 37]
      // va venueImageRoutes.js da router.get('/', getVenueImagesHandler); bor[cite: 34, 37].
      const response = await api.get(`/venues/${venueId}/images`);
      setImages(response.data.data || []);
    } catch (err) {
      setError("Suratlarni yuklashda xatolik: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchImages();
    setMainImageUrl(initialMainImageUrl); // Tashqaridan kelgan asosiy rasmni o'rnatish
  }, [fetchImages, initialMainImageUrl]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImageUpload = async () => {
    if (!file) {
      alert("Iltimos, surat faylini tanlang.");
      return;
    }
    if (!venueId) {
        alert("To'yxona ID si mavjud emas.");
        return;
    }

    const formData = new FormData();
    formData.append('venueImage', file); // Backenddagi 'venueImage' nomi

    setUploading(true);
    setError('');
    try {
      // Backend API: POST /api/venues/:venueId/images
      await api.post(`/venues/${venueId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert("Surat muvaffaqiyatli yuklandi!");
      setFile(null); // Faylni tozalash
      document.getElementById('venueImageUploadInput').value = null; // Inputni tozalash
      fetchImages(); // Suratlar ro'yxatini yangilash
    } catch (err) {
      setError("Surat yuklashda xatolik: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm("Haqiqatan ham bu suratni o'chirmoqchimisiz?")) {
      setError('');
      try {
        // Backend API: DELETE /api/venues/:venueId/images/:imageId
        // yoki /api/venueimage/:imageId
        await api.delete(`/venues/${venueId}/images/${imageId}`);
        alert("Surat muvaffaqiyatli o'chirildi!");
        fetchImages();
      } catch (err) {
        setError("Suratni o'chirishda xatolik: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSetMainImage = async (imageId, imageUrl) => {
     setError('');
    try {
        // Backend API: PUT /api/venues/:venueId/images/:imageId/set-main
        // yoki /api/venueimage/:imageId/set-main
        await api.put(`/venues/${venueId}/images/${imageId}/set-main`);
        alert("Surat asosiy qilib belgilandi!");
        setMainImageUrl(imageUrl); // Frontendda darhol yangilash
        // Agar kerak bo'lsa, to'yxona ma'lumotlarini qayta yuklash (masalan, parent komponentda)
    } catch (err) {
        setError("Suratni asosiy qilishda xatolik: " + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div className="mt-6 p-6 border rounded-lg bg-white shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">To'yxona Suratlari</h3>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {/* Surat yuklash formasi */}
      <div className="mb-6 border-b pb-6">
        <label htmlFor="venueImageUploadInput" className="block text-sm font-medium text-gray-700 mb-1">Yangi surat yuklash:</label>
        <div className="flex items-center space-x-3">
            <input 
                type="file" 
                id="venueImageUploadInput"
                onChange={handleFileChange} 
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button 
                onClick={handleImageUpload} 
                disabled={!file || uploading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center"
            >
                <UploadIcon /> {uploading ? "Yuklanmoqda..." : "Yuklash"}
            </button>
        </div>
         {file && <p className="text-xs text-gray-500 mt-1">Tanlangan fayl: {file.name}</p>}
      </div>
      

      {/* Mavjud suratlar galereyasi */}
      {loading && <p>Suratlar yuklanmoqda...</p>}
      {!loading && images.length === 0 && <p className="text-gray-500">Hozircha suratlar yuklanmagan.</p>}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map(img => ( // image_id, image_url, uploaded_at [cite: 488]
            <div key={img.image_id} className="relative group border rounded-md overflow-hidden shadow-sm">
              <img 
                src={`${API_BASE_URL}${img.image_url}`} 
                alt={`To'yxona surati ${img.image_id}`} 
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 p-1 rounded">
                <button 
                    title="Asosiy qilish"
                    onClick={() => handleSetMainImage(img.image_id, img.image_url)}
                    className="p-1 rounded-full hover:bg-white"
                >
                    <StarIcon isMain={mainImageUrl === img.image_url} />
                </button>
                <button 
                    title="O'chirish"
                    onClick={() => handleDeleteImage(img.image_id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-white rounded-full"
                >
                    <DeleteIcon />
                </button>
              </div>
               {mainImageUrl === img.image_url && (
                <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 text-black text-xs text-center py-0.5 font-semibold">
                    Asosiy Rasm
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">
        Talabda "birdan ortiq suratlar yuklay olish" bonus sifatida ko'rsatilgan[cite: 522].
        Backend `uploadMiddleware.js` da ko'p surat yuklash uchun izohga olingan kod (`uploadMultipleVenueImages`) mavjud.
        Agar bu funksiya aktivlashtirilsa, frontendda bir nechta fayl tanlash va yuborish imkoniyati qo'shilishi kerak.
        Hozirgi implementatsiya bittadan surat yuklashga mo'ljallangan.
      </p>
    </div>
  );
};

export default VenueImageManager;