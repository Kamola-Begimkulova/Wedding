import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../App";
// import './AdminDashboard.css'; // CSS App.jsx da import qilingan

const AdminDashboard = () => {
  const { user, API_BASE_URL } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("users");

  // --- General State ---
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'success' | 'error'

  // --- User Management State ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    fio: "",
    username: "",
    password: "",
    phone_number: "",
    role_name: "Klient",
    status: "Aktiv",
  });
  const [roles, setRoles] = useState([]);
  const [userFilters, setUserFilters] = useState({
    role_name: "",
    status: "",
    search: "",
  });

  // --- Venue Management State ---
  const [allVenues, setAllVenues] = useState([]);
  const [loadingAllVenues, setLoadingAllVenues] = useState(false);
  const [venueFilters, setVenueFilters] = useState({
    district_id: "",
    status_name: "",
    search: "",
  });
  const [districts, setDistricts] = useState([]);
  const [venueStatuses, setVenueStatuses] = useState([]);
  const [showVenueEditModal, setShowVenueEditModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueEditFormData, setVenueEditFormData] = useState({});
  const [venueOwners, setVenueOwners] = useState([]);

  // --- Booking Management State ---
  const [allBookings, setAllBookings] = useState([]);
  const [loadingAllBookings, setLoadingAllBookings] = useState(false);
  const [bookingFilters, setBookingFilters] = useState({
    venue_id: "",
    district_id: "",
    status_id: "",
    client_search: "",
    date_from: "",
    date_to: "",
  });
  const [bookingStatuses, setBookingStatuses] = useState([]);
  const [venuesForBookingFilter, setVenuesForBookingFilter] = useState([]); // Bron filteri uchun to'yxonalar

  // --- Helper Function to display messages ---
  const showMessage = (text, type = "error", duration = 4000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), duration);
  };

  // --- Static Data Fetching ---
  const fetchStaticDataForFilters = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    const token = user.token;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [
        rolesRes,
        districtsRes,
        venueStatusesRes,
        bookingStatusesRes,
        ownersRes,
        venuesForFilterRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/static/roles`, { headers }),
        axios.get(`${API_BASE_URL}/static/districts`, { headers }),
        axios.get(`${API_BASE_URL}/static/venue-statuses`, { headers }),
        axios.get(`${API_BASE_URL}/static/booking-statuses`, { headers }),
        axios.get(
          `${API_BASE_URL}/admin/users?role_name=To_yxona_Egasi&status=Aktiv`,
          { headers }
        ),
        axios.get(`${API_BASE_URL}/venues`, { headers }), // Bron filteri uchun barcha to'yxonalar
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      else console.error("Rollarni yuklash: ", rolesRes.data.message);
      if (districtsRes.data.success) setDistricts(districtsRes.data.data);
      else console.error("Tumanlarni yuklash: ", districtsRes.data.message);
      if (venueStatusesRes.data.success)
        setVenueStatuses(venueStatusesRes.data.data);
      else
        console.error(
          "To'yxona statuslarini yuklash: ",
          venueStatusesRes.data.message
        );
      if (bookingStatusesRes.data.success)
        setBookingStatuses(bookingStatusesRes.data.data);
      else
        console.error(
          "Bron statuslarini yuklash: ",
          bookingStatusesRes.data.message
        );
      if (ownersRes.data.success) setVenueOwners(ownersRes.data.data);
      else
        console.error("To'yxona egalarini yuklash: ", ownersRes.data.message);
      if (venuesForFilterRes.data.success)
        setVenuesForBookingFilter(venuesForFilterRes.data.data);
      else
        console.error(
          "Bron filteri uchun to'yxonalarni yuklash: ",
          venuesForFilterRes.data.message
        );
    } catch (err) {
      console.error("Statik ma'lumotlarni yuklashda API xatoligi:", err);
      showMessage("Statik ma'lumotlarni yuklashda xatolik yuz berdi.", "error");
    }
  }, [API_BASE_URL, user]);

  useEffect(() => {
    fetchStaticDataForFilters();
  }, [fetchStaticDataForFilters]);

  // --- User Management Functions ---
  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    setLoadingUsers(true);
    showMessage("", ""); // Clear previous messages
    try {
      const token = user.token;
      const params = new URLSearchParams();
      if (userFilters.role_name)
        params.append("role_name", userFilters.role_name);
      if (userFilters.status) params.append("status", userFilters.status);
      if (userFilters.search) params.append("search", userFilters.search);
      const response = await axios.get(
        `${API_BASE_URL}/admin/users?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) setUsers(response.data.data);
      else
        showMessage(
          response.data.message || "Foydalanuvchilarni yuklashda xatolik.",
          "error"
        );
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (foydalanuvchilar).",
        "error"
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [API_BASE_URL, user, userFilters]);

  const handleUserFilterChange = (e) =>
    setUserFilters({ ...userFilters, [e.target.name]: e.target.value });
  const handleUserFormChange = (e) =>
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    showMessage("", "");
    if (!userFormData.role_name) {
      showMessage("Iltimos, foydalanuvchi rolini tanlang.", "error");
      return;
    }
    try {
      const token = user.token;
      let response;
      const dataToSend = { ...userFormData };
      if (editingUser && !dataToSend.password) delete dataToSend.password;
      else if (!editingUser && !dataToSend.password) {
        showMessage("Yangi foydalanuvchi uchun parol shart.", "error");
        return;
      }

      if (editingUser) {
        response = await axios.put(
          `${API_BASE_URL}/admin/users/${editingUser.user_id}`,
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(`${API_BASE_URL}/admin/users`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (response.data.success) {
        showMessage(
          `Foydalanuvchi muvaffaqiyatli ${
            editingUser ? "yangilandi" : "yaratildi"
          }!`,
          "success"
        );
        setShowUserForm(false);
        setEditingUser(null);
        setUserFormData({
          fio: "",
          username: "",
          password: "",
          phone_number: "",
          role_name: "Klient",
          status: "Aktiv",
        });
        fetchUsers();
      } else {
        showMessage(
          response.data.message || "Amalni bajarishda xatolik.",
          "error"
        );
      }
    } catch (err) {
      showMessage(err.response?.data?.message || "Server xatoligi.", "error");
    }
  };
  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setUserFormData({
      fio: userToEdit.fio,
      username: userToEdit.username,
      password: "",
      phone_number: userToEdit.phone_number,
      role_name: userToEdit.role_name,
      status: userToEdit.status,
    });
    setShowUserForm(true);
  };
  const handleDeleteUser = async (userIdToDelete) => {
    if (window.confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
      showMessage("", "");
      try {
        const token = user.token;
        const response = await axios.delete(
          `${API_BASE_URL}/admin/users/${userIdToDelete}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          showMessage("Foydalanuvchi muvaffaqiyatli o'chirildi!", "success");
          fetchUsers();
        } else {
          showMessage(response.data.message || "O'chirishda xatolik.", "error");
        }
      } catch (err) {
        showMessage(
          err.response?.data?.message || "Server xatoligi (o'chirish).",
          "error"
        );
      }
    }
  };
  const openCreateUserForm = () => {
    setEditingUser(null);
    setUserFormData({
      fio: "",
      username: "",
      password: "",
      phone_number: "",
      role_name: "Klient",
      status: "Aktiv",
    });
    setShowUserForm(true);
  };

  // --- Venue Management Functions ---
  const fetchAdminVenues = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    setLoadingAllVenues(true);
    showMessage("", "");
    try {
      const token = user.token;
      const params = new URLSearchParams();
      if (venueFilters.district_id)
        params.append("district_id", venueFilters.district_id);
      if (venueFilters.status_name)
        params.append("status_name", venueFilters.status_name);
      if (venueFilters.search) params.append("search", venueFilters.search);
      // TODO: Boshqa filterlarni qo'shish (capacity, price) - backendda /api/admin/venues buni qo'llashi kerak
      const response = await axios.get(
        `${API_BASE_URL}/admin/venues?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) setAllVenues(response.data.data);
      else
        showMessage(
          response.data.message || "To'yxonalarni yuklashda xatolik.",
          "error"
        );
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (to'yxonalar).",
        "error"
      );
    } finally {
      setLoadingAllVenues(false);
    }
  }, [API_BASE_URL, user, venueFilters]);

  const handleVenueFilterChange = (e) =>
    setVenueFilters({ ...venueFilters, [e.target.name]: e.target.value });

  const handleUpdateVenueStatus = async (venueId, newStatusName) => {
    showMessage("", "");
    if (
      !window.confirm(
        `Haqiqatan ham bu to'yxona statusini "${newStatusName}" ga o'zgartirmoqchimisiz?`
      )
    )
      return;
    try {
      const token = user.token;
      const response = await axios.put(
        `${API_BASE_URL}/admin/venues/${venueId}/status`,
        { new_status_name: newStatusName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showMessage("To'yxona statusi muvaffaqiyatli yangilandi!", "success");
        fetchAdminVenues();
      } else {
        showMessage(
          response.data.message || "Statusni yangilashda xatolik.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (status yangilash).",
        "error"
      );
    }
  };

  const openVenueEditModal = (venue) => {
    setEditingVenue(venue);
    const status = venueStatuses.find(
      (s) => s.status_name === venue.status_name
    );
    setVenueEditFormData({
      name: venue.name || "",
      district_id:
        districts.find((d) => d.district_name === venue.district_name)
          ?.district_id || "",
      address: venue.address || "",
      capacity: venue.capacity || "",
      price: venue.price || "",
      phone_number: venue.venue_phone || venue.phone_number || "",
      additional_info: venue.additional_info || "",
      status_id: status ? status.status_id : "",
      main_image_url: venue.main_image_url || "",
      owner_user_id: venue.owner_user_id || "",
    });
    setShowVenueEditModal(true);
  };

  const handleVenueEditFormChange = (e) => {
    setVenueEditFormData({
      ...venueEditFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVenueEditSubmit = async (e) => {
    e.preventDefault();
    showMessage("", "");
    if (!editingVenue) return;
    if (!venueEditFormData.status_id) {
      showMessage("Iltimos, to'yxona statusini tanlang.", "error");
      return;
    }
    if (!venueEditFormData.district_id) {
      showMessage("Iltimos, tumanni tanlang.", "error");
      return;
    }

    try {
      const token = user.token;
      const dataToUpdate = { ...venueEditFormData };
      // Backend /api/admin/venues/:id PUT so'rovi status_id va district_id ni qabul qiladi
      const response = await axios.put(
        `${API_BASE_URL}/admin/venues/${editingVenue.venue_id}`,
        dataToUpdate,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        showMessage(
          "To'yxona ma'lumotlari muvaffaqiyatli yangilandi!",
          "success"
        );
        setShowVenueEditModal(false);
        setEditingVenue(null);
        fetchAdminVenues();
      } else {
        showMessage(
          response.data.message || "To'yxonani yangilashda xatolik.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (to'yxona yangilash).",
        "error"
      );
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (
      window.confirm(
        "Haqiqatan ham bu to'yxonani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!"
      )
    ) {
      showMessage("", "");
      try {
        const token = user.token;
        const response = await axios.delete(
          `${API_BASE_URL}/venues/${venueId}`,
          {
            // venueRoutes dagi DELETE /api/venues/:id
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          showMessage("To'yxona muvaffaqiyatli o'chirildi!", "success");
          fetchAdminVenues();
        } else {
          showMessage(
            response.data.message || "To'yxonani o'chirishda xatolik.",
            "error"
          );
        }
      } catch (err) {
        showMessage(
          err.response?.data?.message ||
            "Server xatoligi (to'yxona o'chirish).",
          "error"
        );
      }
    }
  };

  // --- Booking Management Functions ---
  const fetchAdminBookings = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    setLoadingAllBookings(true);
    showMessage("", "");
    try {
      const token = user.token;
      const params = new URLSearchParams();
      if (bookingFilters.venue_id)
        params.append("venue_id", bookingFilters.venue_id);
      if (bookingFilters.district_id)
        params.append("district_id", bookingFilters.district_id);
      if (bookingFilters.status_id)
        params.append("status_id", bookingFilters.status_id);
      if (bookingFilters.client_search)
        params.append("client_search", bookingFilters.client_search);
      if (bookingFilters.date_from)
        params.append("date_from", bookingFilters.date_from);
      if (bookingFilters.date_to)
        params.append("date_to", bookingFilters.date_to);

      const response = await axios.get(
        `${API_BASE_URL}/bookings/admin/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) setAllBookings(response.data.data);
      else
        showMessage(
          response.data.message || "Bronlarni yuklashda xatolik.",
          "error"
        );
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (bronlar).",
        "error"
      );
    } finally {
      setLoadingAllBookings(false);
    }
  }, [API_BASE_URL, user, bookingFilters]);

  const handleBookingFilterChange = (e) =>
    setBookingFilters({ ...bookingFilters, [e.target.name]: e.target.value });

  const handleUpdateBookingStatus = async (bookingId, newStatusName) => {
    showMessage("", "");
    if (
      !window.confirm(
        `Haqiqatan ham bu bron statusini "${newStatusName}" ga o'zgartirmoqchimisiz?`
      )
    )
      return;
    try {
      const token = user.token;
      const response = await axios.put(
        `${API_BASE_URL}/bookings/admin/${bookingId}/status`,
        { new_status_name: newStatusName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showMessage("Bron statusi muvaffaqiyatli yangilandi!", "success");
        fetchAdminBookings();
      } else {
        showMessage(
          response.data.message || "Bron statusini yangilashda xatolik.",
          "error"
        );
      }
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Server xatoligi (bron statusi).",
        "error"
      );
    }
  };

  // Tab o'zgarganda tegishli ma'lumotlarni yuklash
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "venues") fetchAdminVenues();
    else if (activeTab === "bookings") fetchAdminBookings();
  }, [activeTab, fetchUsers, fetchAdminVenues, fetchAdminBookings]);

  return (
    <div className="dashboard-page admin-dashboard">
      <h2>Admin Boshqaruv Paneli</h2>
      {message.text && (
        <div className={`message-banner ${message.type}`}>{message.text}</div>
      )}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab("users")}
          className={`admin-tab-button ${
            activeTab === "users" ? "active" : ""
          }`}
        >
          Foydalanuvchilar
        </button>
        <button
          onClick={() => setActiveTab("venues")}
          className={`admin-tab-button ${
            activeTab === "venues" ? "active" : ""
          }`}
        >
          To'yxonalar
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`admin-tab-button ${
            activeTab === "bookings" ? "active" : ""
          }`}
        >
          Bronlar
        </button>
      </div>

      <div className="admin-tab-content">
        {/* User Management Tab */}
        {activeTab === "users" && (
          <section id="user-management">
            <h3>Foydalanuvchilarni Boshqarish</h3>
            <button
              onClick={openCreateUserForm}
              className="action-button add-button"
            >
              <i className="fas fa-plus-circle"></i> Yangi Foydalanuvchi
            </button>

            {showUserForm && (
              <form
                onSubmit={handleUserFormSubmit}
                className="admin-form user-form"
              >
                <h4>
                  {editingUser
                    ? "Foydalanuvchini Tahrirlash"
                    : "Yangi Foydalanuvchi"}
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>F.I.O:</label>
                    <input
                      type="text"
                      name="fio"
                      value={userFormData.fio}
                      onChange={handleUserFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      name="username"
                      value={userFormData.username}
                      onChange={handleUserFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Telefon:</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={userFormData.phone_number}
                      onChange={handleUserFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Parol ({editingUser ? "O'zgartirish uchun" : "Majburiy"}):
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={userFormData.password}
                      onChange={handleUserFormChange}
                      placeholder={
                        editingUser
                          ? "Yangi parol (bo'sh qoldiring agar o'zgarmasa)"
                          : ""
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rol:</label>
                    <select
                      name="role_name"
                      value={userFormData.role_name}
                      onChange={handleUserFormChange}
                      required
                    >
                      <option value="">Tanlang...</option>
                      {roles.map((r) => (
                        <option key={r.role_id} value={r.role_name}>
                          {r.role_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status:</label>
                    <select
                      name="status"
                      value={userFormData.status}
                      onChange={handleUserFormChange}
                      required
                    >
                      <option value="Aktiv">Aktiv</option>
                      <option value="Bloklangan">Bloklangan</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {editingUser ? "Saqlash" : "Yaratish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                    }}
                    className="cancel-button"
                  >
                    Bekor
                  </button>
                </div>
              </form>
            )}

            <div className="filters-panel user-filters">
              <input
                type="text"
                name="search"
                placeholder="FIO, username, telefon..."
                value={userFilters.search}
                onChange={handleUserFilterChange}
              />
              <select
                name="role_name"
                value={userFilters.role_name}
                onChange={handleUserFilterChange}
              >
                <option value="">Barcha Rollar</option>
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_name}>
                    {r.role_name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                value={userFilters.status}
                onChange={handleUserFilterChange}
              >
                <option value="">Barcha Statuslar</option>
                <option value="Aktiv">Aktiv</option>
                <option value="Bloklangan">Bloklangan</option>
              </select>
              <button onClick={fetchUsers} className="filter-button">
                <i className="fas fa-filter"></i> Filter
              </button>
            </div>

            {loadingUsers && <p className="loading-text">Yuklanmoqda...</p>}
            {!loadingUsers && (
              <div className="table-responsive">
                <table className="admin-table user-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>F.I.O</th>
                      <th>Username</th>
                      <th>Telefon</th>
                      <th>Rol</th>
                      <th>Status</th>
                      <th>Yaratilgan</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.user_id}>
                          <td>{u.user_id}</td>
                          <td>{u.fio}</td>
                          <td>{u.username}</td>
                          <td>{u.phone_number}</td>
                          <td>
                            <span
                              className={`role-badge role-${u.role_name
                                ?.toLowerCase()
                                .replace(/ /g, "_")
                                .replace(/[^a-z0-9_]/gi, "")}`}
                            >
                              {u.role_name}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${u.status?.toLowerCase()}`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="edit-btn"
                              title="Tahrirlash"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {user && u.user_id !== user.userId && (
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="delete-btn"
                                title="O'chirish"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">Foydalanuvchilar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Venue Management Tab */}
        {activeTab === "venues" && (
          <section id="venue-management">
            <h3>To'yxonalarni Boshqarish</h3>
            <div className="filters-panel venue-filters">
              <input
                type="text"
                name="search"
                placeholder="Nomi, manzili..."
                value={venueFilters.search}
                onChange={handleVenueFilterChange}
              />
              <select
                name="district_id"
                value={venueFilters.district_id}
                onChange={handleVenueFilterChange}
              >
                <option value="">Barcha Tumanlar</option>
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.district_name}
                  </option>
                ))}
              </select>
              <select
                name="status_name"
                value={venueFilters.status_name}
                onChange={handleVenueFilterChange}
              >
                <option value="">Barcha Statuslar</option>
                {venueStatuses.map((s) => (
                  <option key={s.status_id} value={s.status_name}>
                    {s.status_name}
                  </option>
                ))}
              </select>
              <button onClick={fetchAdminVenues} className="filter-button">
                <i className="fas fa-filter"></i> Filter
              </button>
            </div>

            {loadingAllVenues && <p className="loading-text">Yuklanmoqda...</p>}
            {!loadingAllVenues && (
              <div className="table-responsive">
                <table className="admin-table venue-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nomi</th>
                      <th>Tuman</th>
                      <th>Egasi</th>
                      <th>Status</th>
                      <th>Yaratilgan</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVenues.length > 0 ? (
                      allVenues.map((v) => (
                        <tr key={v.venue_id}>
                          <td>{v.venue_id}</td>
                          <td>{v.name}</td>
                          <td>{v.district_name}</td>
                          <td>{v.owner_fio || "Biriktirilmagan"}</td>
                          <td>
                            <span
                              className={`status-badge status-${v.status_name
                                ?.toLowerCase()
                                .replace(/ /g, "_")}`}
                            >
                              {v.status_name}
                            </span>
                          </td>
                          <td>{new Date(v.created_at).toLocaleDateString()}</td>
                          <td className="actions-cell">
                            <button
                              onClick={() => openVenueEditModal(v)}
                              className="edit-btn"
                              title="Tahrirlash"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {v.status_name === "Kutilmoqda" && (
                              <button
                                onClick={() =>
                                  handleUpdateVenueStatus(
                                    v.venue_id,
                                    "Tasdiqlangan"
                                  )
                                }
                                className="action-btn-approve"
                                title="Tasdiqlash"
                              >
                                <i className="fas fa-check-circle"></i>
                              </button>
                            )}
                            {(v.status_name === "Kutilmoqda" ||
                              v.status_name === "Tasdiqlanmagan") && (
                              <button
                                onClick={() =>
                                  handleUpdateVenueStatus(
                                    v.venue_id,
                                    "Rad_etilgan"
                                  )
                                }
                                className="action-btn-reject"
                                title="Rad Etish"
                              >
                                <i className="fas fa-times-circle"></i>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVenue(v.venue_id)}
                              className="delete-btn"
                              title="O'chirish"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">To'yxonalar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {showVenueEditModal && editingVenue && (
              <div
                className="modal-backdrop"
                onClick={
                  () =>
                    setShowVenueEditModal(
                      false
                    ) /* Tashqarisini bosganda yopish */
                }
              >
                <div
                  className="modal-content admin-form venue-edit-form"
                  onClick={
                    (e) =>
                      e.stopPropagation() /* Modal ichini bosganda yopilmasligi uchun */
                  }
                >
                  <h4>To'yxonani Tahrirlash: {editingVenue.name}</h4>
                  <form onSubmit={handleVenueEditSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nomi:</label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={venueEditFormData.name}
                          onChange={handleVenueEditFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Tuman:</label>
                        <select
                          name="district_id"
                          defaultValue={venueEditFormData.district_id}
                          onChange={handleVenueEditFormChange}
                          required
                        >
                          <option value="">Tanlang...</option>
                          {districts.map((d) => (
                            <option key={d.district_id} value={d.district_id}>
                              {d.district_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Manzil:</label>
                      <input
                        type="text"
                        name="address"
                        defaultValue={venueEditFormData.address}
                        onChange={handleVenueEditFormChange}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Sig'im:</label>
                        <input
                          type="number"
                          name="capacity"
                          defaultValue={venueEditFormData.capacity}
                          onChange={handleVenueEditFormChange}
                          required
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Narx:</label>
                        <input
                          type="number"
                          name="price"
                          defaultValue={venueEditFormData.price}
                          onChange={handleVenueEditFormChange}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Telefon:</label>
                        <input
                          type="tel"
                          name="phone_number"
                          defaultValue={venueEditFormData.phone_number}
                          onChange={handleVenueEditFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Status:</label>
                        <select
                          name="status_id"
                          defaultValue={venueEditFormData.status_id}
                          onChange={handleVenueEditFormChange}
                          required
                        >
                          <option value="">Tanlang...</option>
                          {venueStatuses.map((s) => (
                            <option key={s.status_id} value={s.status_id}>
                              {s.status_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Egasi:</label>
                      <select
                        name="owner_user_id"
                        defaultValue={venueEditFormData.owner_user_id || ""}
                        onChange={handleVenueEditFormChange}
                      >
                        <option value="">Egasini olib tashlash</option>
                        {venueOwners.map((owner) => (
                          <option key={owner.user_id} value={owner.user_id}>
                            {owner.fio} ({owner.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Asosiy Rasm URL:</label>
                      <input
                        type="text"
                        name="main_image_url"
                        defaultValue={venueEditFormData.main_image_url}
                        onChange={handleVenueEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Qo'shimcha Ma'lumot:</label>
                      <textarea
                        name="additional_info"
                        defaultValue={venueEditFormData.additional_info}
                        onChange={handleVenueEditFormChange}
                      ></textarea>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-button">
                        Saqlash
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowVenueEditModal(false);
                          setEditingVenue(null);
                        }}
                        className="cancel-button"
                      >
                        Bekor
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Booking Management Tab */}
        {activeTab === "bookings" && (
          <section id="booking-management">
            <h3>Bronlarni Boshqarish</h3>
            <div className="filters-panel booking-filters">
              <input
                type="text"
                name="client_search"
                placeholder="Klient FIO, telefon..."
                value={bookingFilters.client_search}
                onChange={handleBookingFilterChange}
              />
              <select
                name="venue_id"
                value={bookingFilters.venue_id}
                onChange={handleBookingFilterChange}
              >
                <option value="">Barcha To'yxonalar</option>
                {venuesForBookingFilter.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <select
                name="district_id"
                value={bookingFilters.district_id}
                onChange={handleBookingFilterChange}
              >
                <option value="">Barcha Tumanlar</option>
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.district_name}
                  </option>
                ))}
              </select>
              <select
                name="status_id"
                value={bookingFilters.status_id}
                onChange={handleBookingFilterChange}
              >
                <option value="">Barcha Statuslar</option>
                {bookingStatuses.map((s) => (
                  <option key={s.status_id} value={s.status_id}>
                    {s.status_name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="date_from"
                value={bookingFilters.date_from}
                onChange={handleBookingFilterChange}
              />
              <input
                type="date"
                name="date_to"
                value={bookingFilters.date_to}
                onChange={handleBookingFilterChange}
              />
              <button onClick={fetchAdminBookings} className="filter-button">
                <i className="fas fa-filter"></i> Filter
              </button>
            </div>

            {loadingAllBookings && (
              <p className="loading-text">Yuklanmoqda...</p>
            )}
            {!loadingAllBookings && (
              <div className="table-responsive">
                <table className="admin-table booking-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>To'yxona</th>
                      <th>Klient</th>
                      <th>Sana</th>
                      <th>Mehmonlar</th>
                      <th>Status</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.length > 0 ? (
                      allBookings.map((b) => (
                        <tr key={b.booking_id}>
                          <td>{b.booking_id}</td>
                          <td>{b.venue_name}</td>
                          <td>{b.client_fio}</td>
                          <td>
                            {new Date(b.booking_date).toLocaleDateString()}
                          </td>
                          <td>{b.number_of_guests}</td>
                          <td>
                            <span
                              className={`status-badge status-${b.booking_status
                                ?.toLowerCase()
                                .replace(/ /g, "_")}`}
                            >
                              {b.booking_status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {b.booking_status === "Kutilmoqda" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      b.booking_id,
                                      "Tasdiqlangan"
                                    )
                                  }
                                  className="action-btn-approve"
                                  title="Tasdiqlash"
                                >
                                  <i className="fas fa-check-circle"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      b.booking_id,
                                      "Rad_etilgan"
                                    )
                                  }
                                  className="action-btn-reject"
                                  title="Rad Etish"
                                >
                                  <i className="fas fa-times-circle"></i>
                                </button>
                              </>
                            )}
                            {(b.booking_status === "Tasdiqlangan" ||
                              b.booking_status === "Kutilmoqda") && (
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    b.booking_id,
                                    "Bekor_qilingan_admin"
                                  )
                                }
                                className="delete-btn"
                                title="Admin Tomonidan Bekor Qilish"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">Bronlar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;
