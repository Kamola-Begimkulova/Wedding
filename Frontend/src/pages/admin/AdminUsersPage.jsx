import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal'; // Modal komponentini import qilish

// Yangi UserForm komponenti (Modal ichida ishlatiladi)
const UserForm = ({ initialData = {}, onSubmit, onCancel, isSubmitting, roles }) => {
    const [formData, setFormData] = useState({
        fio: initialData.fio || '',
        username: initialData.username || '',
        password: '', // Parol har doim bo'sh boshlanadi (yangi yoki o'zgartirishda)
        phone_number: initialData.phone_number || '',
        role_name: initialData.role_name || (roles.length > 0 ? roles[0].id : ''), // Default rol
        status: initialData.status || 'Aktiv',
    });

    const isEditMode = !!initialData.user_id;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };
        if (isEditMode && !dataToSubmit.password) { // Tahrirlashda agar parol kiritilmasa, uni yubormaslik
            delete dataToSubmit.password;
        }
        onSubmit(dataToSubmit, initialData.user_id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="fio" className="block text-sm font-medium text-gray-700">F.I.O.</label>
                <input type="text" name="fio" id="fio" value={formData.fio} onChange={handleChange} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Parol {isEditMode && "(O'zgartirish uchun kiriting)"}</label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Telefon raqam</label>
                <input type="text" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
                <label htmlFor="role_name" className="block text-sm font-medium text-gray-700">Rol</label>
                <select name="role_name" id="role_name" value={formData.role_name} onChange={handleChange} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                    <option value="Aktiv">Aktiv</option>
                    <option value="Bloklangan">Bloklangan</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Bekor qilish</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">
                    {isSubmitting ? 'Saqlanmoqda...' : (isEditMode ? "O'zgarishlarni Saqlash" : "Foydalanuvchi Qo'shish")}
                </button>
            </div>
        </form>
    );
};


const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role_name: '',
    status: '',
    search: ''
  });
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Tahrirlash uchun foydalanuvchi
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Rollarni backenddan /api/roles orqali olish mumkin yoki statik
  const roles = [
    { id: 'Klient', name: 'Klient' }, 
    { id: 'To_yxona_Egasi', name: "To'yxona Egasi" }, 
    { id: 'Admin', name: 'Admin' }
  ];
  const userStatuses = [{id: 'Aktiv', name: 'Aktiv'}, {id: 'Bloklangan', name: 'Bloklangan'}];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users', { params: filters }); //
      setUsers(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleOpenUserModal = (user = null) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleUserSubmit = async (userData, userIdToUpdate) => {
    setIsSubmittingUser(true);
    try {
        let response;
        if (userIdToUpdate) { // Tahrirlash rejimi
            response = await api.put(`/admin/users/${userIdToUpdate}`, userData); // API: PUT /api/admin/users/:id
        } else { // Qo'shish rejimi
            response = await api.post('/admin/users', userData); // API: POST /api/admin/users
        }

        if (response.data.success) {
            alert(userIdToUpdate ? "Foydalanuvchi muvaffaqiyatli yangilandi!" : "Foydalanuvchi muvaffaqiyatli qo'shildi!");
            handleCloseUserModal();
            fetchUsers(); // Ro'yxatni yangilash
        } else {
            alert(response.data.message || "Amalni bajarishda xatolik.");
        }
    } catch (err) {
        alert(err.response?.data?.message || "Server xatoligi.");
    } finally {
        setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
        try {
            // Backend API: DELETE /api/admin/users/:id
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data.success) {
                alert("Foydalanuvchi muvaffaqiyatli o'chirildi!");
                fetchUsers(); // Ro'yxatni yangilash
            } else {
                alert(response.data.message || "Foydalanuvchini o'chirishda xatolik.");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Server xatoligi.");
        }
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Foydalanuvchilarni Boshqarish</h1>
        <button 
            onClick={() => handleOpenUserModal()}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition"
        >
            + Yangi Foydalanuvchi Qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Qidiruv (FIO, username, tel)</label>
          <input type="text" name="search" id="search" value={filters.search} onChange={handleFilterChange}
                 className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="role_name" className="block text-sm font-medium text-gray-700">Rol</label>
          <select name="role_name" id="role_name" value={filters.role_name} onChange={handleFilterChange}
                  className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
            <option value="">Barcha rollar</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={filters.status} onChange={handleFilterChange}
                  className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
            <option value="">Barcha statuslar</option>
            {userStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="text-center py-4">Yuklanmoqda...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">F.I.O.</th>
                <th className="py-3 px-4 text-left">Username</th>
                <th className="py-3 px-4 text-left">Telefon</th>
                <th className="py-3 px-4 text-left">Rol</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Amallar</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {users.length > 0 ? users.map(user => (
                <tr key={user.user_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{user.user_id}</td>
                  <td className="py-3 px-4">{user.fio}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">{user.phone_number}</td>
                  <td className="py-3 px-4">{user.role_name}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${user.status === 'Aktiv' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                     </span>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                        onClick={() => handleOpenUserModal(user)} 
                        className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                    >Tahrirlash</button>
                    <button 
                        onClick={() => handleDeleteUser(user.user_id)} 
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >O'chirish</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="text-center py-10 text-gray-500">Foydalanuvchilar topilmadi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={editingUser ? "Foydalanuvchini Tahrirlash" : "Yangi Foydalanuvchi Qo'shish"}>
        <UserForm 
            initialData={editingUser || {}} 
            onSubmit={handleUserSubmit} 
            onCancel={handleCloseUserModal}
            isSubmitting={isSubmittingUser}
            roles={roles}
        />
      </Modal>
    </div>
  );
};

export default AdminUsersPage;