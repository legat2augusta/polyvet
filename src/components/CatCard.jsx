import React, { useState } from 'react';
import { Calendar, MapPin, Cpu, ChevronLeft, ChevronRight, Trash2, Heart, X, Share2, Phone, User, MessageSquare, Mail } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { supabase } from '../supabaseClient';

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

export default function CatCard({ cat, onScan, onDelete, onMarkReunited, onShare, onFetchPhone, lang, viewMode = 'grid' }) {
  const isLost = cat.status === 'lost';
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };
  const [deleteStep, setDeleteStep] = useState('passcode');
  const [passcode, setPasscode] = useState('');
  const [story, setStory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Messaging & Web Inbox States
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [inboxPasscode, setInboxPasscode] = useState('');
  const [isInboxUnlocked, setIsInboxUnlocked] = useState(false);
  const [verifiedInboxPasscode, setVerifiedInboxPasscode] = useState('');
  const [inboxMessages, setInboxMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inboxError, setInboxError] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!senderName || !senderContact || !messageText) {
      alert(getTranslation('msgErrorAlert', lang));
      return;
    }
    setSendingMsg(true);
    try {
      const { error } = await supabase
        .from('cat_messages')
        .insert([{
          cat_id: cat.id,
          sender_name: senderName,
          sender_contact: senderContact,
          message_text: messageText
        }]);

      if (error) throw error;

      // Trigger Telegram notification relay serverless webhook
      try {
        await fetch('/api/send-telegram-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cat_id: cat.id,
            sender_name: senderName,
            sender_contact: senderContact,
            message_text: messageText
          })
        });
      } catch (teleErr) {
        console.warn('Failed to relay telegram alert:', teleErr);
      }

      alert(getTranslation('msgSuccessAlert', lang));
      setIsSendModalOpen(false);
      setSenderName('');
      setSenderContact('');
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(getTranslation('msgErrorAlert', lang));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleOpenInbox = () => {
    let localPass = '';
    try {
      const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
      localPass = myPosts[cat.id] || '';
    } catch (err) {
      console.warn('Failed to parse my posts:', err);
    }

    if (localPass) {
      setVerifiedInboxPasscode(localPass);
      setIsInboxUnlocked(true);
      fetchInboxMessages(localPass);
    } else {
      setInboxPasscode('');
      setIsInboxUnlocked(false);
      setInboxMessages([]);
    }
    setInboxError(null);
    setIsInboxModalOpen(true);
  };

  const fetchInboxMessages = async (pass) => {
    setLoadingMessages(true);
    setInboxError(null);
    try {
      const { data, error } = await supabase.rpc('get_cat_messages', {
        input_cat_id: cat.id,
        input_passcode: pass
      });

      if (error) throw error;
      setInboxMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setInboxError(getTranslation('msgPINIncorrect', lang));
      setIsInboxUnlocked(false);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleVerifyInboxPasscode = async (e) => {
    e.preventDefault();
    if (!inboxPasscode) return;
    setLoadingMessages(true);
    setInboxError(null);
    try {
      const { data, error } = await supabase.rpc('get_cat_messages', {
        input_cat_id: cat.id,
        input_passcode: inboxPasscode
      });

      if (error) throw error;

      setInboxMessages(data || []);
      setVerifiedInboxPasscode(inboxPasscode);
      setIsInboxUnlocked(true);
      
      // Save passcode ownership locally
      try {
        const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
        myPosts[cat.id] = inboxPasscode;
        localStorage.setItem('kotopoisk_my_posts', JSON.stringify(myPosts));
      } catch (err) {
        console.warn('Failed to update localStorage:', err);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setInboxError(getTranslation('msgPINIncorrect', lang));
    } finally {
      setLoadingMessages(false);
    }
  };

  const playFanfare = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const notes = [
        { f: 261.63, t: 0.1 },  // C4
        { f: 329.63, t: 0.1 },  // E4
        { f: 392.00, t: 0.1 },  // G4
        { f: 523.25, t: 0.4 }   // C5
      ];
      
      let now = ctx.currentTime;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.t);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + note.t);
        
        now += note.t + 0.05;
      });
    } catch (err) {
      console.warn('Failed to play audio:', err);
    }
  };
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

  const isListView = viewMode === 'list';

  return (
    <div 
      className={`glass-card cat-card ${isListView ? 'cat-card-list' : 'cat-card-grid'} ${cat.status === 'reunited' ? 'reunited-card' : ''}`} 
      onMouseMove={handleMouseMove}
      style={{
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        border: cat.status === 'reunited' ? '2px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--card-border)',
        boxShadow: cat.status === 'reunited' ? '0 8px 32px rgba(249, 115, 22, 0.15)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="glass-card-content" style={{ display: 'flex', flexDirection: 'inherit', width: '100%', height: '100%' }}>
        {/* Status Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10
        }}>
          {cat.status === 'reunited' ? (
            <span className="badge" style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(249, 115, 22, 0.4)'
            }}>
              {getTranslation('statusReunited', lang)}
            </span>
          ) : (
            <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
              {isLost ? getTranslation('statusLost', lang) : getTranslation('statusFound', lang)}
            </span>
          )}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              let localPasscode = '';
              try {
                const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
                localPasscode = myPosts[cat.id] || '';
              } catch (err) {
                console.warn('Failed to parse my posts:', err);
              }
              
              setPasscode(localPasscode);
              setDeleteStep(localPasscode ? 'reunited_question' : 'passcode');
              setDeleteError(null);
              setStory('');
              setIsDeleteModalOpen(true);
            }}
            className="hover-rotate-scale"
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
              cursor: 'pointer'
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

        {/* Share Button */}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(cat);
            }}
            className="hover-rotate-scale"
            style={{
              position: 'absolute',
              top: '12px',
              right: onDelete ? '50px' : '12px',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
            title={getTranslation('cardShareBtn', lang)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.border = '1px solid var(--primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            }}
          >
            <Share2 size={16} />
          </button>
        )}

      {/* Cat Photo / Carousel */}
      <div 
        className="cat-card-photo-wrapper"
        style={{
          overflow: 'hidden',
          position: 'relative',
          background: '#0c0f1d'
        }}
      >
        <img 
          key={currentPhotoIndex}
          src={cardPhotos[currentPhotoIndex]} 
          alt={cat.breed || 'Кошка'} 
          className="carousel-img-fade"
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
      <div 
        className="cat-card-details-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          textAlign: 'left'
        }}
      >
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
            let localPasscode = null;
            try {
              const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
              localPasscode = myPosts[cat.id];
            } catch (err) {
              console.warn('Failed to parse my posts:', err);
            }
            if (!localPasscode) return null;
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
          })()}
        </div>

        {/* Action Button & Contact Details Reveal */}
        {cat.status === 'reunited' ? (
          <div style={{ 
            marginTop: 'auto', 
            padding: '10px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#fdba74',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            <Heart size={16} fill="var(--primary)" color="var(--primary)" />
            <span>{getTranslation('statusReunited', lang)}</span>
          </div>
        ) : (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {showContacts && cat.contact_phone ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <User size={12} color="var(--primary)" />
                  <span>{cat.contact_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Phone size={12} color="var(--primary)" />
                  <span style={{ fontFamily: 'monospace' }}>{cat.contact_phone}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  <a 
                    href={`tel:${cat.contact_phone}`} 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem', height: 'auto', minHeight: '28px', justifyContent: 'center', whiteSpace: 'nowrap' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getTranslation('cardCallBtn', lang)}
                  </a>
                  <a 
                    href={`https://wa.me/${cat.contact_phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      padding: '4px 0', 
                      fontSize: '0.75rem', 
                      height: 'auto', 
                      minHeight: '28px', 
                      justifyContent: 'center', 
                      background: '#128c7e', 
                      borderColor: '#128c7e',
                      color: '#fff',
                      fontWeight: '600'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!cat.contact_phone && onFetchPhone) {
                    setLoadingPhone(true);
                    const phone = await onFetchPhone(cat.id);
                    setLoadingPhone(false);
                    if (phone) {
                      setShowContacts(true);
                    }
                  } else {
                    setShowContacts(true);
                  }
                }}
                disabled={loadingPhone}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  fontSize: '0.8rem', 
                  justifyContent: 'center',
                  fontWeight: '600',
                  gap: '6px'
                }}
              >
                <Phone size={14} />
                {loadingPhone ? (lang === 'kk' ? 'Жүктелуде...' : 'Загрузка...') : getTranslation('cardShowContactsBtn', lang)}
              </button>
            )}
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSendModalOpen(true);
                }}
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center', fontWeight: '600', gap: '6px' }}
              >
                <MessageSquare size={14} />
                {getTranslation('msgSendBtn', lang)}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInbox();
                }}
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center', fontWeight: '600', gap: '6px' }}
              >
                <Mail size={14} />
                {getTranslation('cardMessagesBtn', lang)}
              </button>
            </div>
            
            <button 
              className="btn btn-accent btn-pulse-green" 
              style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              onClick={() => onScan(cat)}
            >
              <Cpu size={16} />
              {getTranslation('cardScanBtn', lang)}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Delete/Reunion Modal */}
      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={(e) => e.stopPropagation()}>
          
          <div style={{
            background: 'linear-gradient(135deg, #131a35 0%, #0b0f19 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(249, 115, 22, 0.05)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '450px',
            padding: '30px',
            position: 'relative',
            color: '#fff',
            overflow: 'hidden'
          }} className="delete-modal-content">
            
            {/* Confetti canvas on success step */}
            {deleteStep === 'success' && <ConfettiCanvas />}

            {/* Close button - hidden in success step */}
            {deleteStep !== 'success' && (
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Step 1: Passcode Verification */}
            {deleteStep === 'passcode' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
                  {getTranslation('cardDeleteBtn', lang)}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  {getTranslation('cardDeletePrompt', lang)}
                </p>
                <input 
                  type="text"
                  placeholder="PIN"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.trim())}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    letterSpacing: '0.1em',
                    marginBottom: '20px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && passcode) {
                      setDeleteStep('reunited_question');
                    }
                  }}
                  autoFocus
                />
                {deleteError && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setIsDeleteModalOpen(false)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Отмена
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (!passcode) {
                        setDeleteError('Пожалуйста, введите код доступа.');
                        return;
                      }
                      setDeleteStep('reunited_question');
                    }}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Reunited Question */}
            {deleteStep === 'reunited_question' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--primary)'
                }}>
                  <Heart size={32} fill="var(--primary)" color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>
                  {getTranslation('confirmReunitedQuestion', lang)}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                  {lang === 'kk' 
                    ? 'Егер үй жануарыңыз табылса, оны «Сәтті оқиғалар» бөліміне қосамыз. Оның контактілері құпиялылығыңыз үшін жасырылады.'
                    : 'Если ваш питомец нашелся, мы добавим его в раздел «Счастливые истории». Его контакты будут скрыты для вашей приватности.'}
                </p>
                {deleteError && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setDeleteStep('story_input');
                    }}
                    style={{ 
                      padding: '14px', 
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    {getTranslation('confirmReunitedYes', lang)}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setDeleteError(null);
                      const success = await onDelete(cat.id, passcode);
                      setSubmitting(false);
                      if (success) {
                        setIsDeleteModalOpen(false);
                      } else {
                        setDeleteError(lang === 'kk' ? 'Рұқсат коды қате. Қайта байқап көріңіз.' : 'Неверный код доступа. Попробуйте еще раз.');
                        setDeleteStep('passcode');
                      }
                    }}
                    style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {submitting ? (lang === 'kk' ? 'Өшіру...' : 'Удаление...') : getTranslation('confirmReunitedNo', lang)}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Happy Story Input */}
            {deleteStep === 'story_input' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={20} fill="var(--primary)" color="var(--primary)" />
                  {getTranslation('storyTitle', lang)}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  {lang === 'kk'
                    ? 'Мысығыңыздың қалай табылғанымен бөлісе аласыз. Бұл басқа иелерге үміт береді!'
                    : 'Вы можете поделиться тем, как котик нашелся. Это подарит надежду другим владельцам!'}
                </p>
                <textarea 
                  placeholder={getTranslation('storyPlaceholder', lang)}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  style={{
                    width: '100%',
                    height: '110px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'none',
                    outline: 'none',
                    marginBottom: '16px',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />
                {deleteError && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className="btn btn-primary" 
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setDeleteError(null);
                      const success = await onMarkReunited(cat.id, passcode, story);
                      setSubmitting(false);
                      if (success) {
                        playFanfare();
                        setDeleteStep('success');
                        setTimeout(() => {
                          setIsDeleteModalOpen(false);
                        }, 4000);
                      } else {
                        setDeleteError(lang === 'kk' ? 'Рұқсат коды қате. Қайта байқап көріңіз.' : 'Неверный код доступа. Пожалуйста, вернитесь к вводу кода.');
                        setDeleteStep('passcode');
                      }
                    }}
                    style={{ padding: '12px' }}
                  >
                    {submitting ? (lang === 'kk' ? 'Сақталуда...' : 'Сохранение...') : getTranslation('storySaveBtn', lang)}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setDeleteError(null);
                      const success = await onMarkReunited(cat.id, passcode, '');
                      setSubmitting(false);
                      if (success) {
                        playFanfare();
                        setDeleteStep('success');
                        setTimeout(() => {
                          setIsDeleteModalOpen(false);
                        }, 4000);
                      } else {
                        setDeleteError(lang === 'kk' ? 'Рұқсат коды қате. Қайта байқап көріңіз.' : 'Неверный код доступа. Пожалуйста, вернитесь к вводу кода.');
                        setDeleteStep('passcode');
                      }
                    }}
                    style={{ padding: '10px', fontSize: '0.8rem', opacity: 0.7 }}
                  >
                    {getTranslation('storySkipBtn', lang)}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Celebration Success */}
            {deleteStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '16px',
                }}>
                  🎉
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px' }}>
                  {getTranslation('storySuccess', lang)}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5' }}>
                  {lang === 'kk' ? 'Біз сіз бен мысығыңыз үшін шын жүректен қуаныштымыз! ❤️' : 'Мы искренне рады за вас и вашего котика! ❤️'}
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {isSendModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={(e) => {
          e.stopPropagation();
          setIsSendModalOpen(false);
        }}>
          
          <form onSubmit={handleSendMessage} onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, #131a35 0%, #0b0f19 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(249, 115, 22, 0.05)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            position: 'relative',
            color: '#fff',
            overflow: 'hidden'
          }}>
            <button 
              type="button"
              onClick={() => setIsSendModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="var(--primary)" />
              {getTranslation('msgSendModalTitle', lang)}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              {getTranslation('msgSendPrompt', lang)}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                  {getTranslation('msgSenderNameLabel', lang)}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={getTranslation('msgSenderNamePlaceholder', lang)}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                  {getTranslation('msgSenderContactLabel', lang)}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={getTranslation('msgSenderContactPlaceholder', lang)}
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>
                  {getTranslation('msgTextLabel', lang)}
                </label>
                <textarea 
                  required
                  placeholder={getTranslation('msgTextPlaceholder', lang)}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => setIsSendModalOpen(false)}
                style={{ flex: 1, padding: '12px' }}
              >
                {getTranslation('formCancelBtn', lang)}
              </button>
              <button 
                type="submit"
                disabled={sendingMsg}
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px' }}
              >
                {sendingMsg ? (lang === 'kk' ? 'Жіберілуде...' : 'Отправка...') : getTranslation('msgSubmitBtn', lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inbox Viewer Modal */}
      {isInboxModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={(e) => {
          e.stopPropagation();
          setIsInboxModalOpen(false);
        }}>
          
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, #131a35 0%, #0b0f19 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(249, 115, 22, 0.05)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '30px',
            position: 'relative',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden'
          }}>
            <button 
              onClick={() => setIsInboxModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <X size={16} />
            </button>

            {!isInboxUnlocked ? (
              <form onSubmit={handleVerifyInboxPasscode} style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={20} color="var(--primary)" />
                  {getTranslation('msgPINTitle', lang)}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  {getTranslation('msgPINPrompt', lang)}
                </p>
                <input 
                  type="text"
                  required
                  placeholder="PIN"
                  value={inboxPasscode}
                  onChange={(e) => setInboxPasscode(e.target.value.trim())}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    letterSpacing: '0.1em',
                    marginBottom: '20px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  autoFocus
                />
                {inboxError && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>{inboxError}</p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setIsInboxModalOpen(false)}
                    style={{ flex: 1, padding: '12px' }}
                  >
                    {getTranslation('formCancelBtn', lang)}
                  </button>
                  <button 
                    type="submit"
                    disabled={loadingMessages}
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '12px' }}
                  >
                    {loadingMessages ? (lang === 'kk' ? 'Тексерілуде...' : 'Проверка...') : (lang === 'kk' ? 'Кіру' : 'Войти')}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={20} color="var(--primary)" />
                  {getTranslation('msgModalTitle', lang)}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {lang === 'kk' ? `Басылым ID: ${cat.id}` : `ID объявления: ${cat.id}`}
                </p>

                {/* Telegram Integration Link */}
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  <div style={{ fontWeight: '600', color: '#60a5fa', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: '#3b82f6' }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.82-1.05 6.09-1.5 8.56-.19 1.04-.57 1.39-.94 1.42-.82.07-1.44-.55-2.24-1.07-1.25-.82-1.95-1.33-3.17-2.13-1.41-.93-.5-1.44.31-2.28.21-.22 3.89-3.57 3.96-3.87.01-.04.02-.17-.06-.24-.08-.07-.2-.05-.28-.03-.12.02-2.02 1.28-5.7 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.5-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.98 8.24-3.55 3.93-1.63 4.74-1.92 5.27-1.93.12 0 .38.03.55.17.14.12.18.28.2.46.02.16-.01.97-.03 1.94z"/>
                    </svg>
                    {getTranslation('msgConnectTelegram', lang)}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', fontSize: '0.8rem' }}>
                    {lang === 'kk' 
                      ? 'Хабарландыру үшін Telegram-да жедел хабарландыруларды алу үшін ботты қосыңыз.'
                      : 'Подключите бота, чтобы получать мгновенные уведомления о новых сообщениях для этого объявления в Telegram.'}
                  </p>
                  <a 
                    href={`https://t.me/KotoPoiskAlmatyBot?start=cat_${cat.id}_${verifiedInboxPasscode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#2481cc',
                      border: 'none',
                      color: '#fff',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    {lang === 'kk' ? 'Ботты іске қосу' : 'Запустить бота'}
                  </a>
                </div>

                {/* Messages Timeline */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '6px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }} className="custom-scrollbar">
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {lang === 'kk' ? 'Хабарламалар жүктелуде...' : 'Загрузка сообщений...'}
                    </div>
                  ) : inboxMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {getTranslation('msgNoMessages', lang)}
                    </div>
                  ) : (
                    inboxMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--primary)' }}>{msg.sender_name}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {msg.sender_contact}
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#f1f5f9', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                          {msg.message_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setIsInboxModalOpen(false)}
                    style={{ padding: '10px 24px' }}
                  >
                    {lang === 'kk' ? 'Жабу' : 'Закрыть'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ConfettiCanvas = () => {
  const canvasRef = React.useRef(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const colors = ['#f97316', '#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * (canvas.width || 400),
      y: Math.random() * (canvas.height || 400) - (canvas.height || 400),
      r: Math.random() * 6 + 4,
      d: Math.random() * (canvas.height || 400),
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx/3) * 15;
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
        
        if (p.y > canvas.height) {
          particles[idx] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle
          };
        }
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100
      }}
    />
  );
};
