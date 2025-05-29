import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import VenueCard from '../components/VenueCard';
// import './HomePage.css'; // CSS App.jsx da import qilingan

const HomePage = () => {
  const { API_BASE_URL } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state'lari
  const [searchTerm, setSearchTerm] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [capacityMin, setCapacityMin] = useState('');
  const [sortBy, setSortBy] = useState('v.name'); // Sukut bo'yicha saralash
  const [order, setOrder] = useState('ASC');     // Sukut bo'yicha tartib

  const [showFilters, setShowFilters] = useState(false); // Filterlarni ko'rsatish/yashirish

  // Tumanlarni yuklash
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/static/districts`);
        if (response.data.success) {
          setDistricts(response.data.data);
        } else {
          console.error("Tumanlarni yuklashda xatolik:", response.data.message);
        }
      } catch (err) {
        console.error("Tumanlar API xatoligi:", err);
      }
    };
    fetchDistricts();
  }, [API_BASE_URL]);

  // To'yxonalarni filterlar bilan yuklash
  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDistrict) params.append('district_id', selectedDistrict);
      if (priceRange.min) params.append('price_min', priceRange.min);
      if (priceRange.max) params.append('price_max', priceRange.max);
      if (capacityMin) params.append('capacity_min', capacityMin);
      if (sortBy) params.append('sort_by', sortBy);
      if (order) params.append('order', order);

      const response = await axios.get(`${API_BASE_URL}/venues?${params.toString()}`);
      if (response.data && response.data.success) {
        setVenues(response.data.data);
      } else {
        setError(response.data.message || "To'yxonalarni yuklashda xatolik yuz berdi.");
        setVenues([]); // Xatolik bo'lsa, bo'sh ro'yxat
      }
    } catch (err) {
      console.error("To'yxonalarni olishda xatolik!", err);
      setError("Server bilan bog'lanishda xatolik yuz berdi.");
      setVenues([]); // Xatolik bo'lsa, bo'sh ro'yxat
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, searchTerm, selectedDistrict, priceRange, capacityMin, sortBy, order]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]); // Filterlar o'zgarganda avtomatik chaqirish uchun fetchVenues ni dependency ga qo'shdik

  const handlePriceChange = (e) => {
    setPriceRange({ ...priceRange, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
      fetchVenues(); // fetchVenues filter o'zgarishlariga bog'liq, shuning uchun alohida chaqirish shart emas, lekin aniqlik uchun
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setPriceRange({ min: '', max: '' });
    setCapacityMin('');
    setSortBy('v.name');
    setOrder('ASC');
    // fetchVenues(); // Bu useEffect da avtomatik chaqiriladi, chunki state'lar o'zgardi
  };

  return (
    <div className="homepage-container">
      <div className="hero-section">
        <h1>Eng Yaxshi To'yxonani Biz Bilan Toping!</h1>
        <p>Orzuingizdagi to'y uchun mukammal makonni osonlik bilan bron qiling.</p>
        <div className="main-search-bar">
          <input
            type="text"
            placeholder="To'yxona nomi yoki manzilini qidiring..."
            className="search-input-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setShowFilters(!showFilters)} className="filter-toggle-button">
            <i className={`fas ${showFilters ? 'fa-times' : 'fa-filter'}`}></i> 
            {showFilters ? " Filterlarni Yashirish" : " Kengaytirilgan Filter"}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel-homepage">
          <div className="filter-group">
            <label htmlFor="districtFilter">Tuman:</label>
            <select id="districtFilter" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
              <option value="">Barcha Tumanlar</option>
              {districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Narx Diapazoni (so'm):</label>
            <div className="price-inputs">
              <input type="number" name="min" placeholder="Minimal" value={priceRange.min} onChange={handlePriceChange} />
              <span>-</span>
              <input type="number" name="max" placeholder="Maksimal" value={priceRange.max} onChange={handlePriceChange} />
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="capacityFilter">Minimal Sig'im (kishi):</label>
            <input type="number" id="capacityFilter" value={capacityMin} onChange={(e) => setCapacityMin(e.target.value)} placeholder="Masalan: 100" />
          </div>
          <div className="filter-group">
            <label htmlFor="sortByFilter">Saralash:</label>
            <select id="sortByFilter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="v.name">Nomi Bo'yicha</option>
              <option value="v.price">Narxi Bo'yicha</option>
              <option value="v.capacity">Sig'imi Bo'yicha</option>
              {/* <option value="average_rating">Reytingi Bo'yicha</option> */}
            </select>
          </div>
           <div className="filter-group">
            <label htmlFor="orderFilter">Tartib:</label>
            <select id="orderFilter" value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="ASC">O'sish Tartibida</option>
              <option value="DESC">Kamayish Tartibida</option>
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={applyFilters} className="apply-filters-button"><i className="fas fa-check"></i> Qo'llash</button>
            <button onClick={resetFilters} className="reset-filters-button"><i className="fas fa-undo"></i> Tozalash</button>
          </div>
        </div>
      )}

      <h2 className="venues-section-title">Mavjud To'yxonalar</h2>
      {loading && <div className="loading-animation-container"><div className="loader-homepage"></div><p>Yuklanmoqda...</p></div>}
      {error && <p className="error-text homepage-error">Xatolik: {error}</p>}
      {!loading && !error && venues.length === 0 && <p className="no-venues-message">Hozircha qidiruvingizga mos to'yxonalar mavjud emas.</p>}
      
      <div className="venues-grid-homepage">
        {!loading && !error && venues.map(venue => (
          <VenueCard key={venue.venue_id} venue={venue} />
        ))}
      </div>
      {/* TODO: Paginatsiya qo'shish */}
    </div>
  );
};
export default HomePage;