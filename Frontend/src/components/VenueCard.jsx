import React from 'react';
import { Link } from 'react-router-dom';
// import './VenueCard.css'; // CSS faylini import qilish

const VenueCard = ({ venue }) => {
  const backendBaseUrl = 'http://localhost:5001'; // Rasm uchun backend manzili

  return (
    <Link to={`/venue/${venue.venue_id}`} className="venue-card-link">
      <div className="venue-card-homepage"> {/* HomePage dagi class nomini ishlatamiz yoki umumiy qilamiz */}
        {venue.main_image_url ? (
          <img
            src={`${backendBaseUrl}${venue.main_image_url}`}
            alt={venue.name}
            className="venue-image-homepage"
            onError={(e) => { e.target.src = 'https://placehold.co/600x400/EBD8C3/7A3E3E?text=Rasm+Yuklanmadi'; }}
          />
        ) : (
          <img
            src='https://placehold.co/600x400/EBD8C3/7A3E3E?text=Rasm+Mavjud+Emas'
            alt={venue.name}
            className="venue-image-homepage"
          />
        )}
        <div className="venue-card-content">
          <h3>{venue.name}</h3>
          <p><strong>{venue.district_name}</strong></p>
          <p className="venue-price">{venue.price ? venue.price.toLocaleString() : 'N/A'} so'm</p>
          <span className="venue-capacity">{venue.capacity} kishilik</span>
          {/* Reytingni ko'rsatish (agar mavjud bo'lsa) */}
          {venue.average_rating !== undefined && venue.average_rating !== null && (
            <p className="venue-rating">
              Reyting: {'⭐'.repeat(Math.round(venue.average_rating))} ({venue.review_count || 0} izoh)
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
export default VenueCard;