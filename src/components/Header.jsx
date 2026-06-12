import React from 'react';
import { Search, PlusCircle, Heart, MapPin } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, activeCount }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--card-border)',
      background: 'rgba(10, 15, 30, 0.5)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '16px 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)'
          }}>
            <Heart size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              КотоПоиск
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={10} /> Алматы
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Search size={16} />
            Объявления
          </button>
          
          <button 
            className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('report')}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <PlusCircle size={16} />
            Подать объявление
          </button>
        </nav>

        {/* Active Searches Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="glass-card" style={{
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(249, 115, 22, 0.05)',
            borderColor: 'rgba(249, 115, 22, 0.2)',
            boxShadow: 'none'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 8px var(--primary)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Активных объявлений:</span>
            <strong style={{ color: 'var(--primary)' }}>{activeCount}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
