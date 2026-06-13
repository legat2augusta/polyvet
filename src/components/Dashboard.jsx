import React, { useState } from 'react';
import CatCard from './CatCard';
import CatsMap from './CatsMap';
import { Search, Filter, AlertCircle, PlusCircle } from 'lucide-react';

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

export default function Dashboard({ cats, onScan, onNavigateToReport, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter cats based on selections
  const filteredCats = cats.filter(cat => {
    const matchesSearch = 
      (cat.breed && cat.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cat.color && cat.color.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDistrict = selectedDistrict ? cat.district === selectedDistrict : true;
    const matchesStatus = selectedStatus ? cat.status === selectedStatus : true;
    const matchesColor = selectedColor ? cat.color === selectedColor : true;
    
    return matchesSearch && matchesDistrict && matchesStatus && matchesColor;
  });

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

        <h1 style={{ marginBottom: '16px', fontSize: '2.5rem' }}>Поможем вернуть питомца домой</h1>
        <p style={{ maxWidth: '650px', margin: '0 auto 24px', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Единая интерактивная база пропавших и найденных кошек в Алматы.
          Наша интеллектуальная система автоматически сопоставляет новые фотографии с базой данных, помогая хозяевам быстрее находить своих любимцев.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onNavigateToReport}>
            <PlusCircle size={18} />
            Подать объявление
          </button>
        </div>
      </div>

      {/* Map View */}
      <div style={{ marginBottom: '40px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Интерактивная карта Алматы
        </h3>
        <CatsMap cats={filteredCats} onScan={onScan} />
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
              placeholder="Поиск по приметам, породе, окрасу..."
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
              <option value="">Все районы</option>
              {ALMATY_DISTRICTS.map(d => (
                <option key={d} value={d}>{d} район</option>
              ))}
            </select>
          </div>

          {/* Toggle Advanced Filters */}
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 18px' }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Фильтры
          </button>
        </div>

        {/* Advanced Filters Expandable Panel */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'left'
          }}>
            {/* Status Filter */}
            <div className="input-group">
              <span className="input-label">Статус</span>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="">Все</option>
                <option value="lost">Пропал</option>
                <option value="found">Найден</option>
              </select>
            </div>

            {/* Color Filter */}
            <div className="input-group">
              <span className="input-label">Основной окрас</span>
              <select 
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="form-select"
              >
                <option value="">Любой окрас</option>
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          {searchTerm || selectedDistrict || selectedStatus || selectedColor ? 'Результаты фильтрации' : 'Все объявления'}
        </h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Найдено: {filteredCats.length}
        </span>
      </div>

      {/* Grid Content */}
      {filteredCats.length > 0 ? (
        <div className="cats-grid">
          {filteredCats.map(cat => (
            <CatCard key={cat.id} cat={cat} onScan={onScan} onDelete={onDelete} />
          ))}
        </div>
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
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>Ничего не найдено</h4>
          <p style={{ maxWidth: '400px' }}>
            Попробуйте сбросить фильтры или изменить поисковый запрос. Возможно, объявление с такими характеристиками еще не добавлено.
          </p>
        </div>
      )}
    </div>
  );
}
