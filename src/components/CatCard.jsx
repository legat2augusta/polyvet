import React from 'react';
import { Calendar, MapPin, Cpu } from 'lucide-react';

export default function CatCard({ cat, onScan }) {
  const isLost = cat.status === 'lost';
  
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

      {/* Cat Photo */}
      <div style={{
        width: '100%',
        height: '220px',
        overflow: 'hidden',
        position: 'relative',
        background: '#0c0f1d'
      }}>
        <img 
          src={cat.photo} 
          alt={cat.breed || 'Кошка'} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
        />
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
