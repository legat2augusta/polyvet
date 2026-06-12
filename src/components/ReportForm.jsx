import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft, Upload, Sparkles, Check } from 'lucide-react';

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
  const [photo, setPhoto] = useState(DEMO_PHOTOS[0].url); // Default to first demo photo
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectDemo = (url) => {
    setPhoto(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photo) {
      alert('Пожалуйста, добавьте фотографию кошки.');
      return;
    }

    const newCat = {
      id: Date.now(),
      status,
      breed: breed.trim() || 'Беспородная',
      color,
      district,
      date,
      description: description.trim(),
      contactName: contactName.trim() || 'Аноним',
      contactPhone: contactPhone.trim(),
      photo
    };

    onSubmit(newCat);
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      {/* Back Button */}
      <button 
        className="btn btn-secondary" 
        onClick={onCancel}
        style={{ marginBottom: '24px', alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={16} />
        Назад на главную
      </button>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', textAlign: 'left' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Подать новое объявление</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Заполните данные о кошке. После публикации наша ИИ-система просканирует базу данных и покажет возможные совпадения.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Status lost/found Toggle */}
          <div className="input-group">
            <span className="input-label">Каков статус питомца?</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStatus('lost')}
                className="btn"
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
            <span className="input-label">Фотография кошки (важно для ИИ-поиска)</span>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '20px'
            }}>
              {/* Main Photo Dropzone */}
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  minHeight: '200px',
                  transition: 'var(--transition-smooth)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                
                {photo ? (
                  <>
                    <img 
                      src={photo} 
                      alt="Превью" 
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '260px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Camera size={12} /> Изменить
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Upload size={20} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Нажмите для загрузки</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Поддерживаются PNG, JPG, JPEG
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Demo Photos Quick Select */}
              <div>
                <span className="input-label" style={{ fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Нет фото? Выберите образец для тестирования:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DEMO_PHOTOS.map((demo) => (
                    <button
                      key={demo.name}
                      type="button"
                      onClick={() => handleSelectDemo(demo.url)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: photo === demo.url ? 'var(--primary-light)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${photo === demo.url ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                        color: photo === demo.url ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {photo === demo.url && <Check size={12} color="var(--primary)" />}
                      {demo.name}
                    </button>
                  ))}
                </div>
              </div>
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
              />
            </div>

            {/* Color */}
            <div className="input-group">
              <span className="input-label">Основной окрас</span>
              <select 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="form-select"
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
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <span className="input-label">Номер телефона / Мессенджер</span>
              <input 
                type="text" 
                placeholder="+7 (7xx) xxx-xx-xx"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '240px' }}>
              <Sparkles size={18} />
              Опубликовать и найти (ИИ)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
