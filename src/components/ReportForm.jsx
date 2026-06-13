import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft, Upload, Sparkles, Check, MapPin, Loader, X } from 'lucide-react';
import CatsMap from './CatsMap';
import { supabase } from '../supabaseClient';

const ALMATY_DISTRICTS = [
  'Бостандыкский',
  'Медеуский',
  'Алмалинский',
  'Ауэзовский',
  'Алатауский',
  'Жетысуский',
  'Турксибский',
  'Наурызбайский'
];

const COLORS = [
  'Рыжий',
  'Черный',
  'Белый',
  'Серый',
  'Трехцветный',
  'Сиамский'
];

const DEMO_PHOTOS = [
  { name: 'Рыжий', url: '/assets/cats/ginger.png' },
  { name: 'Черный', url: '/assets/cats/black.png' },
  { name: 'Бело-серый', url: '/assets/cats/white_grey.png' },
  { name: 'Трехцветная', url: '/assets/cats/calico.png' },
  { name: 'Сиамский', url: '/assets/cats/siamese.png' }
];

export default function ReportForm({ onSubmit, onCancel }) {
  const [status, setStatus] = useState('lost');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('Рыжий');
  const [district, setDistrict] = useState('Бостандыкский');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Array to store up to 3 photos
  const [photos, setPhotos] = useState([DEMO_PHOTOS[0].url]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Default coordinates for Almaty (center)
  const [position, setPosition] = useState([43.2389, 76.8897]);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (photos.length >= 3) {
        alert('Максимально можно загрузить до 3-х фотографий.');
        return;
      }
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDemo = (url) => {
    if (photos.length >= 3) {
      alert('Максимально можно загрузить до 3-х фотографий.');
      return;
    }
    // Check if already exists in selection to avoid duplicates
    if (photos.includes(url)) {
      alert('Это фото уже добавлено.');
      return;
    }
    setPhotos(prev => [...prev, url]);
  };

  const handleDeletePhoto = (indexToDelete) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert('Пожалуйста, добавьте хотя бы одну фотографию кошки.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = [];

      for (let i = 0; i < photos.length; i++) {
        const photoItem = photos[i];
        
        // If it's a new local image (represented as base64 string), upload to Supabase Storage
        if (photoItem.startsWith('data:image/')) {
          const response = await fetch(photoItem);
          const blob = await response.blob();
          
          const fileExt = blob.type.split('/')[1] || 'png';
          const fileName = `cats/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('cat-photos')
            .upload(fileName, blob, {
              contentType: blob.type
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('cat-photos')
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
        } else {
          // If it is a demo photo (already hosted), use it directly
          uploadedUrls.push(photoItem);
        }
      }

      const newCat = {
        status,
        breed: breed.trim() || 'Беспородная',
        color,
        district,
        date,
        description: description.trim(),
        contact_name: contactName.trim() || 'Аноним',
        contact_phone: contactPhone.trim(),
        photo_url: uploadedUrls[0] || '',
        photo_url_2: uploadedUrls[1] || null,
        photo_url_3: uploadedUrls[2] || null,
        latitude: position[0],
        longitude: position[1]
      };

      await onSubmit(newCat);
    } catch (err) {
      console.error('Ошибка при отправке объявления:', err);
      alert('Не удалось загрузить фото или данные. Ошибка: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      {/* Back Button */}
      <button 
        className="btn btn-secondary" 
        onClick={onCancel}
        style={{ marginBottom: '24px', alignSelf: 'flex-start' }}
        disabled={submitting}
      >
        <ArrowLeft size={16} />
        Назад на главную
      </button>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', textAlign: 'left' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Подать новое объявление</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Заполните данные о кошке. Вы можете загрузить до 3-х разных фотографий (например, с разных ракурсов).
        </p>

        <form onSubmit={handleSubmit}>
          {/* Status lost/found Toggle */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label">Каков статус питомца?</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStatus('lost')}
                className="btn"
                disabled={submitting}
                style={{
                  flex: 1,
                  background: status === 'lost' ? 'var(--status-lost)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: status === 'lost' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: status === 'lost' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              >
                Я потерял кошку
              </button>
              <button
                type="button"
                onClick={() => setStatus('found')}
                className="btn"
                disabled={submitting}
                style={{
                  flex: 1,
                  background: status === 'found' ? 'var(--status-found)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: status === 'found' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: status === 'found' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                Я нашел чужую кошку
              </button>
            </div>
          </div>

          {/* Photo upload block */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label">Фотографии кошки (максимум 3 ракурса)</span>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Render selected photos */}
              {photos.map((url, index) => (
                <div 
                  key={index}
                  style={{
                    height: '150px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0c0f1d'
                  }}
                >
                  <img 
                    src={url} 
                    alt={`Загруженная ${index + 1}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Главная
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(index)}
                    disabled={submitting}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add photo slot (if less than 3) */}
              {photos.length < 3 && (
                <div 
                  onClick={() => !submitting && fileInputRef.current.click()}
                  style={{
                    height: '150px',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => !submitting && (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseOut={(e) => !submitting && (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    disabled={submitting}
                  />
                  {uploading ? (
                    <Loader size={24} className="animate-spin" color="var(--primary)" />
                  ) : (
                    <>
                      <Upload size={20} color="var(--text-secondary)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Загрузить фото</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Demo Photos Quick Select */}
            <div>
              <span className="input-label" style={{ fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                Добавить готовый образец для тестирования:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DEMO_PHOTOS.map((demo) => {
                  const isSelected = photos.includes(demo.url);
                  return (
                    <button
                      key={demo.name}
                      type="button"
                      disabled={submitting || isSelected || photos.length >= 3}
                      onClick={() => handleSelectDemo(demo.url)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--primary-light)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        cursor: (submitting || isSelected || photos.length >= 3) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'var(--transition-smooth)',
                        opacity: (isSelected || photos.length >= 3) ? 0.5 : 1
                      }}
                    >
                      {isSelected && <Check size={12} color="var(--primary)" />}
                      {demo.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Map Coordinates Picker */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} color="var(--primary)" />
              Укажите примерное местоположение на карте Алматы
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Кликните по карте в месте, где это произошло. Маркер зафиксирует координаты.
            </p>
            <CatsMap selectMode={true} position={position} setPosition={setPosition} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Координаты: {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Breed */}
            <div className="input-group">
              <span className="input-label">Порода</span>
              <input 
                type="text" 
                placeholder="Например: Британская (или беспородная)"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="form-input"
                disabled={submitting}
              />
            </div>

            {/* Color */}
            <div className="input-group">
              <span className="input-label">Основной окрас</span>
              <select 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="form-select"
                disabled={submitting}
              >
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* District */}
            <div className="input-group">
              <span className="input-label">Район Алматы</span>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="form-select"
                disabled={submitting}
              >
                {ALMATY_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d} район</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="input-group">
              <span className="input-label">Дата {status === 'lost' ? 'пропажи' : 'нахождения'}</span>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Description */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label">Особые приметы / Описание</span>
            <textarea 
              rows={4}
              placeholder="Опишите ошейник, цвет глаз, форму ушей, пугливость или другие приметы, которые помогут людям узнать кошку."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              disabled={submitting}
            />
          </div>

          {/* Contacts Section */}
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            Контактная информация
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Name */}
            <div className="input-group">
              <span className="input-label">Ваше имя</span>
              <input 
                type="text" 
                placeholder="Как к вам обращаться"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="form-input"
                required
                disabled={submitting}
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <span className="input-label">Номер телефона (для WhatsApp)</span>
              <input 
                type="text" 
                placeholder="+7 (7xx) xxx-xx-xx"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="form-input"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={submitting}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ minWidth: '240px' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                  Загрузка файлов ({photos.length})...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Опубликовать и найти (ИИ)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
