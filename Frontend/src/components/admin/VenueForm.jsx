// VenueForm.jsx - Debug versiyasi
import React, { useState, useEffect } from 'react';

const VenueForm = ({ initialData = {}, onSubmit, onCancel, isSubmitting, districts }) => {
  console.log('VenueForm render qilindi:', { initialData, districts });

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    address: initialData.address || '',
    district_id: initialData.district_id || (districts && districts.length > 0 ? districts[0].id : ''),
    capacity: initialData.capacity || '',
    price: initialData.price || '',
    phone_number: initialData.phone_number || '',
    additional_info: initialData.additional_info || '',
    main_image_url: initialData.main_image_url || '',
    latitude: initialData.latitude || '',
    longitude: initialData.longitude || '',
    status_name: initialData.status_name || 'Kutilmoqda',
  });

  // initialData o'zgarganda formData ni yangilash
  useEffect(() => {
    console.log('initialData useEffect ishladi:', initialData);
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        district_id: initialData.district_id || (districts && districts.length > 0 ? districts[0].id : ''),
        capacity: initialData.capacity || '',
        price: initialData.price || '',
        phone_number: initialData.phone_number || '',
        additional_info: initialData.additional_info || '',
        main_image_url: initialData.main_image_url || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        status_name: initialData.status_name || 'Kutilmoqda',
      });
    }
  }, [initialData, districts]);

  const isEditMode = !!(initialData && initialData.venue_id);

  const handleChange = (e) => {
    console.log('handleChange:', e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('Yangi formData:', newData);
      return newData;
    });
  };

  const handleSubmit = (e) => {
    console.log('handleSubmit ishladi!');
    e.preventDefault();
    
    console.log('Form submit qilindi, formData:', formData);
    
    // Validation
    if (!formData.name.trim()) {
      alert("To'yxona nomi kiritilishi shart!");
      return;
    }
    
    if (!formData.address.trim()) {
      alert("Manzil kiritilishi shart!");
      return;
    }
    
    if (!formData.district_id) {
      alert("Tuman tanlanishi shart!");
      return;
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      alert("Sig'im to'g'ri kiritilishi shart!");
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      alert("Narx to'g'ri kiritilishi shart!");
      return;
    }

    const dataToSubmit = {
      ...formData,
      district_id: parseInt(formData.district_id, 10),
      capacity: parseInt(formData.capacity || '0', 10),
      price: parseFloat(formData.price || '0'),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };
    
    console.log('Submit uchun tayyor data:', dataToSubmit);
    console.log('onSubmit funksiya mavjudmi?', typeof onSubmit);
    
    if (typeof onSubmit === 'function') {
      onSubmit(dataToSubmit, initialData?.venue_id);
    } else {
      console.error('onSubmit funksiya emas!');
    }
  };

  const inputClass = "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white";

  // Agar districts mavjud bo'lmasa
  if (!districts || districts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Tumanlar yuklanmagan. Iltimos, sahifani yangilang.</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-800">To'yxona nomi *</label>
          <input 
            name="name" 
            type="text" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            className={inputClass}
            placeholder="To'yxona nomini kiriting..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Manzil *</label>
          <input 
            name="address" 
            type="text" 
            value={formData.address} 
            onChange={handleChange} 
            required 
            className={inputClass}
            placeholder="To'liq manzilni kiriting..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Tuman *</label>
          <select 
            name="district_id" 
            value={formData.district_id} 
            onChange={handleChange} 
            required 
            className={inputClass}
          >
            <option value="">-- Tumanni tanlang --</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800">Sig'imi *</label>
            <input 
              name="capacity" 
              type="number" 
              min="1" 
              value={formData.capacity} 
              onChange={handleChange} 
              required 
              className={inputClass}
              placeholder="Kishi soni..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800">Narxi (so'm) *</label>
            <input 
              name="price" 
              type="number" 
              min="0" 
              step="1000" 
              value={formData.price} 
              onChange={handleChange} 
              required 
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Telefon raqam</label>
          <input 
            name="phone_number" 
            type="tel" 
            value={formData.phone_number} 
            onChange={handleChange} 
            className={inputClass}
            placeholder="+998901234567"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Qo'shimcha ma'lumot</label>
          <textarea 
            name="additional_info" 
            rows="3" 
            value={formData.additional_info} 
            onChange={handleChange} 
            className={inputClass}
            placeholder="Qo'shimcha ma'lumotlar..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Asosiy rasm URL</label>
          <input 
            name="main_image_url" 
            type="url" 
            value={formData.main_image_url} 
            onChange={handleChange} 
            className={inputClass}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800">Latitude</label>
            <input 
              name="latitude" 
              type="number" 
              step="any" 
              value={formData.latitude} 
              onChange={handleChange} 
              className={inputClass}
              placeholder="41.2995"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800">Longitude</label>
            <input 
              name="longitude" 
              type="number" 
              step="any" 
              value={formData.longitude} 
              onChange={handleChange} 
              className={inputClass}
              placeholder="69.2401"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">Status</label>
          <select 
            name="status_name" 
            value={formData.status_name} 
            onChange={handleChange} 
            className={inputClass}
          >
            <option value="Kutilmoqda">Kutilmoqda</option>
            <option value="Tasdiqlangan">Tasdiqlangan</option>
            <option value="Tasdiqlanmagan">Tasdiqlanmagan</option>
            <option value="Rad_etilgan">Rad etilgan</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button" 
            onClick={() => {
              console.log('Cancel tugmasi bosildi');
              if (typeof onCancel === 'function') {
                onCancel();
              }
            }}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Bekor qilish
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={() => console.log('Submit tugmasi bosildi')}
          >
            {isSubmitting ? 'Saqlanmoqda...' : isEditMode ? "O'zgarishlarni Saqlash" : "To'yxona Qo'shish"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;

