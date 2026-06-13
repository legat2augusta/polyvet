import React, { useState } from 'react';
import { Calendar, MapPin, Cpu, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';

const COLOR_KEYS = {
  'Рыжий': 'colorGinger',
  'Черный': 'colorBlack',
  'Белый': 'colorWhite',
  'Серый': 'colorGrey',
  'Трехцветный': 'colorCalico',
  'Сиамский': 'colorSiamese',
  'Полосатый': 'colorTabby',
  'Двухцветный': 'colorBicolor'
};

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

const TAG_KEYS = {
  kitten: 'tagKitten',
  adult: 'tagAdult',
  senior: 'tagSenior',
  collar: 'tagCollar',
  injured: 'tagInjured',
  scared: 'tagScared',
  friendly: 'tagFriendly',
  home: 'tagHome',
  oddeyes: 'tagOddEyes',
  neutered: 'tagNeutered',
  longhair: 'tagLongHair',
  shorthair: 'tagShortHair'
};

export default function CatCard({ cat, onScan, onDelete, lang }) {
  const isLost = cat.status === 'lost';
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async (e) => {
    e.stopPropagation();
    if (translatedDescription) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      const fromLang = 'ru';
      const toLang = lang === 'kk' ? 'kk' : 'ru';
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cat.description)}&langpair=${fromLang}|${toLang}`;
      const res = await fetch(url);
      const data = await res.json();
      const result = data.responseData.translatedText;
      setTranslatedDescription(result);
      setShowTranslation(true);
    } catch (err) {
      console.error('Translation error:', err);
      alert('Не удалось выполнить перевод.');
    } finally {
      setIsTranslating(false);
    }
  };

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
          {isLost ? getTranslation('statusLost', lang) : getTranslation('statusFound', lang)}
        </span>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const localPasscode = (() => {
              try {
                const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
                return myPosts[cat.id] || null;
              } catch (err) {
                return null;
              }
            })();

            if (localPasscode) {
              if (window.confirm(getTranslation('cardDeleteConfirm', lang))) {
                onDelete(cat.id, localPasscode);
              }
            } else {
              const enteredCode = window.prompt(getTranslation('cardDeletePrompt', lang));
              if (enteredCode !== null) {
                onDelete(cat.id, enteredCode.trim());
              }
            }
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          title="Удалить объявление"
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#f87171';
          }}
        >
          <Trash2 size={16} />
        </button>
      )}

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
          {cat.breed === 'Беспородная' || !cat.breed ? getTranslation('cardBreedDefault', lang) : cat.breed}
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {COLOR_KEYS[cat.color] ? getTranslation(COLOR_KEYS[cat.color], lang) : cat.color}
          </span>
        </h4>

        {/* Description preview & translation toggle */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8em'
          }}>
            {showTranslation && translatedDescription ? translatedDescription : (cat.description || getTranslation('descNotSpecified', lang))}
          </p>
          {cat.description && lang === 'kk' && (
            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'underline',
                marginTop: '4px'
              }}
            >
              {isTranslating ? getTranslation('cardTranslating', lang) : (showTranslation ? getTranslation('cardTranslateBackBtn', lang) : getTranslation('cardTranslateBtn', lang))}
            </button>
          )}
        </div>

        {/* Selected tags list */}
        {cat.tags && cat.tags.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px', 
            marginBottom: '16px' 
          }}>
            {cat.tags.map((tagId) => {
              const tagKey = TAG_KEYS[tagId];
              if (!tagKey) return null;
              return (
                <span 
                  key={tagId}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: 'rgba(249, 115, 22, 0.04)',
                    border: '1px solid rgba(249, 115, 22, 0.15)',
                    color: '#ffedd5',
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getTranslation(tagKey, lang)}
                </span>
              );
            })}
          </div>
        )}

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
            <span>{DISTRICT_KEYS[cat.district] ? getTranslation(DISTRICT_KEYS[cat.district], lang) : cat.district} {getTranslation('cardDistrict', lang)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>{cat.date}</span>
          </div>

          {/* Display passcode if we own this cat */}
          {(() => {
            try {
              const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
              const localPasscode = myPosts[cat.id];
              if (localPasscode) {
                return (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '6px 10px', 
                    background: 'rgba(249, 115, 22, 0.08)', 
                    border: '1px dashed rgba(249, 115, 22, 0.3)', 
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{getTranslation('cardPasscodeBadge', lang)} <strong style={{ letterSpacing: '0.05em' }}>{localPasscode}</strong></span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getTranslation('cardPasscodeOnlyYou', lang)}</span>
                  </div>
                );
              }
            } catch (err) {}
            return null;
          })()}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            className="btn btn-accent" 
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
            onClick={() => onScan(cat)}
          >
            <Cpu size={16} />
            {getTranslation('cardScanBtn', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
