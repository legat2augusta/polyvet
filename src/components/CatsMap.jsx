import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix custom icon sizing and layout
const createCustomIcon = (status) => {
  const color = status === 'lost' ? '#ef4444' : '#10b981';
  return L.divIcon({
    html: `<div style="
      background-color: ${color}; 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
    </div>`,
    className: 'custom-cat-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Map center for Almaty (Kazakhstan)
const ALMATY_CENTER = [43.2389, 76.8897];

// Location Selector sub-component for ReportForm
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon('lost')} />
  );
}

export default function CatsMap({ cats, selectMode, position, setPosition, onScan }) {
  if (selectMode) {
    return (
      <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <MapContainer center={ALMATY_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    );
  }

  // Dashboard mode: show all cats
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-lg)' }}>
      <MapContainer center={ALMATY_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cats
          .filter(cat => cat.latitude && cat.longitude)
          .map(cat => (
            <Marker key={cat.id} position={[cat.latitude, cat.longitude]} icon={createCustomIcon(cat.status)}>
              <Popup>
                <div style={{ color: '#0f172a', fontSize: '0.85rem', width: '180px', fontFamily: 'Inter, sans-serif' }}>
                  <img 
                    src={cat.photo_url || cat.photo} 
                    alt={cat.breed} 
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                  />
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 'bold' }}>{cat.breed} ({cat.color})</h4>
                  <span className={`badge ${cat.status === 'lost' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.65rem', padding: '2px 6px', marginBottom: '8px', display: 'inline-block' }}>
                    {cat.status === 'lost' ? 'Пропал' : 'Найден'}
                  </span>
                  <p style={{ margin: '0 0 8px', color: '#475569', fontSize: '0.8rem' }}><strong>Район:</strong> {cat.district}</p>
                  <button 
                    className="btn btn-accent" 
                    style={{ padding: '6px 10px', fontSize: '0.75rem', width: '100%', borderRadius: '6px', color: '#fff' }}
                    onClick={() => onScan(cat)}
                  >
                    Сверить в ИИ
                  </button>
                </div>
              </Popup>
            </Marker>
          ))
        }
      </MapContainer>
    </div>
  );
}
