import React, { useState, useEffect, useRef } from 'react';
import CatCard from './CatCard';
import CatsMap from './CatsMap';
import { Search, Filter, AlertCircle, PlusCircle, Heart, LayoutGrid, List } from 'lucide-react';
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
  'Двухцветный'
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
  'Двухцветный': 'colorBicolor'
};

export default function Dashboard({ cats, onScan, onNavigateToReport, onDelete, onMarkReunited, onShare, onFetchPhone, lang }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedHair, setSelectedHair] = useState('');
  const [selectedCollar, setSelectedCollar] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMyPosts, setShowOnlyMyPosts] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('kotopoisk_view_mode') || 'grid');
  const [visibleCount, setVisibleCount] = useState(6);
  const sentinelRef = useRef(null);

  // Persist viewMode
  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('kotopoisk_view_mode', mode);
  };

  // Filter cats based on selections
  const filteredCats = cats.filter(cat => {
    if (showOnlyMyPosts) {
      try {
        const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
        if (!myPosts[cat.id]) return false;
      } catch (e) {
        return false;
      }
    }

    const matchesSearch = 
      (cat.breed && cat.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cat.color && cat.color.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDistrict = selectedDistrict ? cat.district === selectedDistrict : true;
    const matchesStatus = selectedStatus ? cat.status === selectedStatus : true;
    const matchesColor = selectedColor ? cat.color === selectedColor : true;
    const matchesAge = !selectedAge ? true : (cat.tags && cat.tags.includes(selectedAge));
    const matchesHair = !selectedHair ? true : (cat.tags && cat.tags.includes(selectedHair));
    const matchesCollar = !selectedCollar ? true : (cat.tags && cat.tags.includes(selectedCollar));
    
    return matchesSearch && matchesDistrict && matchesStatus && matchesColor && matchesAge && matchesHair && matchesCollar;
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchTerm, selectedDistrict, selectedStatus, selectedColor, selectedAge, selectedHair, selectedCollar, showOnlyMyPosts]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 6, filteredCats.length));
      }
    }, {
      rootMargin: '150px'
    });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [filteredCats.length]);

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Intro Banner */}
      <div className="glass-card" style={{
        padding: '40px',
        borderRadius: '24px',
        marginBottom: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(26, 32, 53, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: 'rgba(249, 115, 22, 0.15)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <h1 style={{ marginBottom: '16px', fontSize: '2.5rem' }}>{getTranslation('introTitle', lang)}</h1>
        <p style={{ maxWidth: '650px', margin: '0 auto 24px', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          {getTranslation('introSub', lang)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onNavigateToReport}>
            <PlusCircle size={18} />
            {getTranslation('navAdd', lang)}
          </button>
        </div>
      </div>

      {/* Map View */}
      <div style={{ marginBottom: '40px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
          {getTranslation('mapTitle', lang)}
        </h3>
        <CatsMap cats={filteredCats} onScan={onScan} lang={lang} />
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder={getTranslation('searchPlaceholder', lang)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* District Select */}
          <div style={{ minWidth: '160px' }}>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="form-select"
            >
              <option value="">{getTranslation('allDistricts', lang)}</option>
              {ALMATY_DISTRICTS.map(d => (
                <option key={d} value={d}>{getTranslation(DISTRICT_KEYS[d], lang)} {getTranslation('formDistrictText', lang)}</option>
              ))}
            </select>
          </div>

          {/* Toggle My Ads */}
          <button 
            className={`btn ${showOnlyMyPosts ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: showOnlyMyPosts ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              background: showOnlyMyPosts ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.03)'
            }}
            onClick={() => setShowOnlyMyPosts(!showOnlyMyPosts)}
          >
            <Heart size={18} color={showOnlyMyPosts ? 'var(--primary)' : 'var(--text-secondary)'} />
            {getTranslation('myAdsBtn', lang)}
          </button>

          {/* Toggle Advanced Filters */}
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 18px' }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {getTranslation('filterBtn', lang)}
          </button>
        </div>

        {/* Advanced Filters Expandable Panel */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'left'
          }}>
            {/* Status Filter */}
            <div className="input-group">
              <span className="input-label">{getTranslation('statusFilter', lang)}</span>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="">{getTranslation('statusAll', lang)}</option>
                <option value="lost">{getTranslation('statusLost', lang)}</option>
                <option value="found">{getTranslation('statusFound', lang)}</option>
              </select>
            </div>

            {/* Color Filter */}
            <div className="input-group">
              <span className="input-label">{getTranslation('colorFilter', lang)}</span>
              <select 
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="form-select"
              >
                <option value="">{getTranslation('colorAny', lang)}</option>
                {COLORS.map(c => (
                  <option key={c} value={c}>{getTranslation(COLOR_KEYS[c], lang)}</option>
                ))}
              </select>
            </div>

            {/* Age Filter */}
            <div className="input-group">
              <span className="input-label">{getTranslation('filterAgeLabel', lang)}</span>
              <select 
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="form-select"
              >
                <option value="">{getTranslation('filterAgeAny', lang)}</option>
                <option value="kitten">{getTranslation('tagKitten', lang)}</option>
                <option value="adult">{getTranslation('tagAdult', lang)}</option>
                <option value="senior">{getTranslation('tagSenior', lang)}</option>
              </select>
            </div>

            {/* Hair length Filter */}
            <div className="input-group">
              <span className="input-label">{getTranslation('filterHairLabel', lang)}</span>
              <select 
                value={selectedHair}
                onChange={(e) => setSelectedHair(e.target.value)}
                className="form-select"
              >
                <option value="">{getTranslation('filterHairAny', lang)}</option>
                <option value="longhair">{getTranslation('tagLongHair', lang)}</option>
                <option value="shorthair">{getTranslation('tagShortHair', lang)}</option>
              </select>
            </div>

            {/* Collar Filter */}
            <div className="input-group">
              <span className="input-label">{getTranslation('filterCollarLabel', lang)}</span>
              <select 
                value={selectedCollar}
                onChange={(e) => setSelectedCollar(e.target.value)}
                className="form-select"
              >
                <option value="">{getTranslation('filterCollarAny', lang)}</option>
                <option value="collar">{getTranslation('filterCollarYes', lang)}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
          {searchTerm || selectedDistrict || selectedStatus || selectedColor ? getTranslation('resultsTitle', lang) : getTranslation('allAdsTitle', lang)}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {getTranslation('foundCount', lang)} {filteredCats.length}
          </span>
          
          {/* View Mode Toggle Buttons */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '3px',
            borderRadius: '12px'
          }}>
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              title={getTranslation('viewGrid', lang)}
              style={{
                border: 'none',
                background: viewMode === 'grid' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: viewMode === 'grid' ? '600' : 'normal',
                transition: 'var(--transition-smooth)'
              }}
            >
              <LayoutGrid size={14} color={viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)'} />
              <span className="hide-on-mobile">{getTranslation('viewGrid', lang)}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              title={getTranslation('viewList', lang)}
              style={{
                border: 'none',
                background: viewMode === 'list' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: viewMode === 'list' ? '600' : 'normal',
                transition: 'var(--transition-smooth)'
              }}
            >
              <List size={14} color={viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)'} />
              <span className="hide-on-mobile">{getTranslation('viewList', lang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid/List Content */}
      {filteredCats.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="cats-grid">
              {filteredCats.slice(0, visibleCount).map(cat => (
                <CatCard 
                  key={cat.id} 
                  cat={cat} 
                  viewMode={viewMode}
                  onScan={onScan} 
                  onDelete={onDelete} 
                  onMarkReunited={onMarkReunited} 
                  onShare={onShare} 
                  onFetchPhone={onFetchPhone} 
                  lang={lang} 
                />
              ))}
            </div>
          ) : (
            <div className="cats-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {filteredCats.slice(0, visibleCount).map(cat => (
                <CatCard 
                  key={cat.id} 
                  cat={cat} 
                  viewMode={viewMode}
                  onScan={onScan} 
                  onDelete={onDelete} 
                  onMarkReunited={onMarkReunited} 
                  onShare={onShare} 
                  onFetchPhone={onFetchPhone} 
                  lang={lang} 
                />
              ))}
            </div>
          )}
          
          {/* Sentinel for Infinite Scroll */}
          <div 
            ref={sentinelRef} 
            style={{ 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: '32px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}
          >
            {visibleCount < filteredCats.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="animate-spin" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTop: '2px solid var(--primary)',
                  borderRadius: '50%'
                }} />
                <span>{lang === 'kk' ? 'Жүктелуде...' : 'Загрузка новых объявлений...'}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass-card" style={{
          padding: '60px 40px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <AlertCircle size={48} color="var(--primary)" />
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>{getTranslation('notFoundTitle', lang)}</h4>
          <p style={{ maxWidth: '400px' }}>
            {getTranslation('notFoundSub', lang)}
          </p>
        </div>
      )}
    </div>
  );
}
