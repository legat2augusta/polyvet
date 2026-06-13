import React, { useState } from 'react';
import { Calendar, MapPin, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CatCard({ cat, onScan }) {
  const isLost = cat.status === 'lost';
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Extract all non-empty photos for the carousel
  const cardPhotos = [
    cat.photo_url || cat.photo,
    cat.photo_url_2,
    cat.photo_url_3
  ].filter(Boolean);

  const handleNextPhoto = (e) => {
    e.stopPropagation(); // Prevent card clicks
    setCurrentPhotoIndex((prev) => (prev + 1) % cardPhotos.length);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation(); // Prevent card clicks
    setCurrentPhotoIndex((prev) => (prev - 1 + cardPhotos.length) % cardPhotos.length);
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setCurrentPhotoIndex(index);
  };

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
      position: 'relative'
    }}>
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10
      }}>
        <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
          {isLost ? 'Пропал' : 'Найден'}
        </span>
      </div>

      {/* Cat Photo / Carousel */}
      <div style={{
        width: '100%',
        height: '220px',
        overflow: 'hidden',
        position: 'relative',
        background: '#0c0f1d'
      }}>
        <img 
          src={cardPhotos[currentPhotoIndex]} 
          alt={cat.breed || 'Кошка'} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
        />

        {/* Carousel Controls (if multiple photos exist) */}
        {cardPhotos.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={handlePrevPhoto}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 5,
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.8)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Right Arrow */}
            <button
              onClick={handleNextPhoto}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 5,
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.8)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
            >
              <ChevronRight size={18} />
            </button>

            {/* Dot Indicators */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 5
            }}>
              {cardPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleDotClick(e, idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: currentPhotoIndex === idx ? 'var(--primary)' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: currentPhotoIndex === idx ? '0 0 8px var(--primary)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        textAlign: 'left'
      }}>
        {/* Breed & Primary color */}
        <h4 style={{
          fontSize: '1.2rem',
          marginBottom: '8px',
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          {cat.breed || 'Беспородная'}
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {cat.color}
          </span>
        </h4>

        {/* Description preview */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.8em'
        }}>
          {cat.description || 'Особые приметы не указаны.'}
        </p>

        {/* Location & Date */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--primary)" />
            <span>{cat.district} район</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>{cat.date}</span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            className="btn btn-accent" 
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            onClick={() => onScan(cat)}
          >
            <Cpu size={16} />
            Найти совпадения (ИИ)
          </button>
        </div>
      </div>
    </div>
  );
}
