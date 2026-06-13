import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft, Upload, Sparkles, Check, MapPin, Loader, X } from 'lucide-react';
import CatsMap from './CatsMap';
import { supabase } from '../supabaseClient';
import { compressImage, extractImageEmbedding } from '../utils/imageAI';
import { getTranslation } from '../utils/translations';

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
  'Сиамский',
  'Полосатый',
  'Черепаховый',
  'Шоколадный',
  'Кремовый',
  'Двухцветный'
];

const DEMO_PHOTOS = [
  { name: 'Рыжий', url: '/assets/cats/ginger.png' },
  { name: 'Черный', url: '/assets/cats/black.png' },
  { name: 'Бело-серый', url: '/assets/cats/white_grey.png' },
  { name: 'Трехцветная', url: '/assets/cats/calico.png' },
  { name: 'Сиамский', url: '/assets/cats/siamese.png' }
];

const DISTRICT_KEYS = {
  'Бостандыкский': 'districtBostandyk',
  'Медеуский': 'districtMedeu',
  'Алмалинский': 'districtAlmaly',
  'Ауэзовский': 'districtAuezov',
  'Алатауский': 'districtAlatau',
  'Жетысуский': 'districtZhetysu',
  'Турксибский': 'districtTurksib',
  'Наурызбайский': 'districtNauryzbai'
};

const COLOR_KEYS = {
  'Рыжий': 'colorGinger',
  'Черный': 'colorBlack',
  'Белый': 'colorWhite',
  'Серый': 'colorGrey',
  'Трехцветный': 'colorCalico',
  'Сиамский': 'colorSiamese',
  'Полосатый': 'colorTabby',
  'Черепаховый': 'colorTortoiseshell',
  'Шоколадный': 'colorChocolate',
  'Кремовый': 'colorCream',
  'Двухцветный': 'colorBicolor'
};

const COLOR_EXAMPLES = {
  'Рыжий': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop',
  'Черный': 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200&auto=format&fit=crop',
  'Белый': 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?q=80&w=200&auto=format&fit=crop',
  'Серый': 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?q=80&w=200&auto=format&fit=crop',
  'Трехцветный': 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=200&auto=format&fit=crop',
  'Сиамский': 'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=200&auto=format&fit=crop',
  'Полосатый': 'https://images.unsplash.com/photo-1513360309081-36f5e878498d?q=80&w=200&auto=format&fit=crop',
  'Черепаховый': 'https://images.unsplash.com/photo-1606214174585-fe31582d63e6?q=80&w=200&auto=format&fit=crop',
  'Шоколадный': 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=200&auto=format&fit=crop',
  'Кремовый': 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?q=80&w=200&auto=format&fit=crop',
  'Двухцветный': 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=200&auto=format&fit=crop'
};

const DEMO_KEYS = {
  'Рыжий': 'formDemoNameGinger',
  'Черный': 'formDemoNameBlack',
  'Бело-серый': 'formDemoNameWhiteGrey',
  'Трехцветная': 'formDemoNameCalico',
  'Сиамский': 'formDemoNameSiamese'
};

const AVAILABLE_TAGS = [
  { id: 'kitten', key: 'tagKitten' },
  { id: 'adult', key: 'tagAdult' },
  { id: 'senior', key: 'tagSenior' },
  { id: 'collar', key: 'tagCollar' },
  { id: 'injured', key: 'tagInjured' },
  { id: 'scared', key: 'tagScared' },
  { id: 'friendly', key: 'tagFriendly' },
  { id: 'home', key: 'tagHome' },
  { id: 'oddeyes', key: 'tagOddEyes' },
  { id: 'neutered', key: 'tagNeutered' },
  { id: 'longhair', key: 'tagLongHair' },
  { id: 'shorthair', key: 'tagShortHair' }
];

export default function ReportForm({ onSubmit, onCancel, lang }) {
  const [status, setStatus] = useState('lost');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('Рыжий');
  const [district, setDistrict] = useState('Бостандыкский');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Array to store up to 3 photos (starts empty now)
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Default coordinates for Almaty (center)
  const [position, setPosition] = useState([43.2389, 76.8897]);

  const handleToggleTag = (tagId) => {
    let newTags = [...selectedTags];
    if (newTags.includes(tagId)) {
      newTags = newTags.filter(t => t !== tagId);
    } else {
      // Mutual exclusion for age tags
      if (tagId === 'kitten') newTags = newTags.filter(t => t !== 'adult' && t !== 'senior');
      if (tagId === 'adult') newTags = newTags.filter(t => t !== 'kitten' && t !== 'senior');
      if (tagId === 'senior') newTags = newTags.filter(t => t !== 'kitten' && t !== 'adult');
      
      // Mutual exclusion for hair length
      if (tagId === 'longhair') newTags = newTags.filter(t => t !== 'shorthair');
      if (tagId === 'shorthair') newTags = newTags.filter(t => t !== 'longhair');
      
      newTags.push(tagId);
    }
    setSelectedTags(newTags);
  };
  
  const fileInputRef = useRef(null);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    let digits = value.replace(/\D/g, '');
    
    // Auto-strip leading 7 or 8 if they pasted/typed a full 11-digit number
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      digits = digits.substring(1);
    }
    
    digits = digits.substring(0, 10);
    
    let formatted = '';
    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 3);
    }
    if (digits.length > 3) {
      formatted += ') ' + digits.substring(3, 6);
    }
    if (digits.length > 6) {
      formatted += '-' + digits.substring(6, 8);
    }
    if (digits.length > 8) {
      formatted += '-' + digits.substring(8, 10);
    }
    
    setContactPhone(formatted);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const availableSlots = 3 - photos.length;
    
    if (selectedFiles.length > availableSlots) {
      alert(getTranslation('formPhotosLimit', lang).replace('{slots}', availableSlots));
    }

    const filesToUpload = selectedFiles.slice(0, availableSlots);
    
    if (filesToUpload.length > 0) {
      setUploading(true);
      let loadedCount = 0;
      const loadedPhotos = [];

      filesToUpload.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          loadedPhotos.push(reader.result);
          loadedCount++;
          if (loadedCount === filesToUpload.length) {
            setPhotos(prev => [...prev, ...loadedPhotos]);
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSelectDemo = (url) => {
    if (photos.length >= 3) {
      alert(getTranslation('formPhotosLimitMax', lang));
      return;
    }
    // Check if already exists in selection to avoid duplicates
    if (photos.includes(url)) {
      alert(getTranslation('formPhotosDup', lang));
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
      alert(getTranslation('formPhotoRequired', lang));
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = [];

      // Extract the 64-D embedding vector from the primary photo
      const primaryPhoto = photos[0];
      let embeddingVector = null;
      try {
        embeddingVector = await extractImageEmbedding(primaryPhoto);
      } catch (embErr) {
        console.warn('Не удалось извлечь ИИ-вектор признаков:', embErr);
      }

      // Generate a random 4-digit deletion passcode (e.g., "5829")
      const passcode = Math.floor(1000 + Math.random() * 9000).toString();

      for (let i = 0; i < photos.length; i++) {
        const photoItem = photos[i];
        
        // If it's a new local image (represented as base64 string), compress and upload
        if (photoItem.startsWith('data:image/')) {
          // Compress the base64 photo to a lightweight JPEG blob
          const compressedBlob = await compressImage(photoItem);
          
          const fileExt = 'jpg';
          const fileName = `cats/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('cat-photos')
            .upload(fileName, compressedBlob, {
              contentType: 'image/jpeg'
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
        contact_phone: contactPhone.trim() ? '+7 ' + contactPhone.trim() : '',
        photo_url: uploadedUrls[0] || '',
        photo_url_2: uploadedUrls[1] || null,
        photo_url_3: uploadedUrls[2] || null,
        tags: selectedTags,
        latitude: position[0],
        longitude: position[1],
        embedding: embeddingVector, // Save the real vector in PostgreSQL!
        passcode: passcode // Save the passcode in DB
      };

      alert(getTranslation('formSuccessAlert', lang).replace('{passcode}', passcode));

      await onSubmit(newCat);
    } catch (err) {
      console.error('Ошибка при отправке объявления:', err);
      alert(getTranslation('formSubmitError', lang) + err.message);
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
        {getTranslation('formBackBtn', lang)}
      </button>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', textAlign: 'left' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>{getTranslation('formTitle', lang)}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {getTranslation('formSub', lang)}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Status lost/found Toggle */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label">{getTranslation('formStatusLabel', lang)}</span>
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
                {getTranslation('formStatusLostBtn', lang)}
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
                {getTranslation('formStatusFoundBtn', lang)}
              </button>
            </div>
          </div>

          {/* Photo upload block */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <span className="input-label">{getTranslation('formPhotosLabel', lang)}</span>
            
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
                      {getTranslation('photoMain', lang)}
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
                    multiple
                    style={{ display: 'none' }} 
                    disabled={submitting}
                  />
                  {uploading ? (
                    <Loader size={24} className="animate-spin" color="var(--primary)" />
                  ) : (
                    <>
                      <Upload size={20} color="var(--text-secondary)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{getTranslation('formUploadBtn', lang)}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tags Selection Block */}
            <div style={{ marginTop: '16px' }}>
              <span className="input-label" style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                {getTranslation('formTagsTitle', lang)}
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleToggleTag(tag.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-light)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? '600' : 'normal',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}></span>}
                      {getTranslation(tag.key, lang)}
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
              {getTranslation('formMapLabel', lang)}
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {getTranslation('formMapSub', lang)}
            </p>
            <CatsMap selectMode={true} position={position} setPosition={setPosition} lang={lang} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {getTranslation('formCoordsLabel', lang)} {position[0].toFixed(5)}, {position[1].toFixed(5)}
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
              <span className="input-label">{getTranslation('formBreedLabel', lang)}</span>
              <input 
                type="text" 
                placeholder={getTranslation('formBreedPlaceholder', lang)}
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="form-input"
                disabled={submitting}
              />
            </div>

            {/* Color with preview example thumbnail */}
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="input-label">{getTranslation('formColorLabel', lang)}</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <select 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="form-select"
                  disabled={submitting}
                  style={{ flexGrow: 1 }}
                >
                  {COLORS.map(c => (
                    <option key={c} value={c}>{getTranslation(COLOR_KEYS[c], lang)}</option>
                  ))}
                </select>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: '#0c0f1d',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                  <img 
                    src={COLOR_EXAMPLES[color]} 
                    alt={color} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
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
            {/* District */}
            <div className="input-group">
              <span className="input-label">{getTranslation('formDistrictLabel', lang)}</span>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="form-select"
                disabled={submitting}
              >
                {ALMATY_DISTRICTS.map(d => (
                  <option key={d} value={d}>{getTranslation(DISTRICT_KEYS[d], lang)} {getTranslation('formDistrictText', lang)}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="input-group">
              <span className="input-label">
                {getTranslation('formDateLabel', lang)} {status === 'lost' ? getTranslation('formDateLost', lang) : getTranslation('formDateFound', lang)}
              </span>
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
            <span className="input-label">{getTranslation('formDescLabel', lang)}</span>
            <textarea 
              rows={4}
              placeholder={getTranslation('formDescPlaceholder', lang)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              disabled={submitting}
            />
          </div>

          {/* Contacts Section */}
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            {getTranslation('formContactTitle', lang)}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Name */}
            <div className="input-group">
              <span className="input-label">{getTranslation('formContactNameLabel', lang)}</span>
              <input 
                type="text" 
                placeholder={getTranslation('formContactNamePlaceholder', lang)}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="form-input"
                required
                disabled={submitting}
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <span className="input-label">{getTranslation('formContactPhoneLabel', lang)}</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                overflow: 'hidden',
                height: '46px'
              }}>
                <span style={{
                  padding: '0 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                  userSelect: 'none',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  +7
                </span>
                <input 
                  type="text" 
                  placeholder="(707) 123-45-67"
                  value={contactPhone}
                  onChange={handlePhoneChange}
                  className="form-input"
                  style={{
                    border: 'none',
                    background: 'none',
                    margin: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    boxShadow: 'none'
                  }}
                  required
                  disabled={submitting}
                />
              </div>
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
              {getTranslation('formCancelBtn', lang)}
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
                  {getTranslation('formSubmitLoading', lang).replace('{count}', photos.length)}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {getTranslation('formSubmitBtn', lang)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
