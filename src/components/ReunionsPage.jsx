import React from 'react';
import CatCard from './CatCard';
import { Heart, Sparkles } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function ReunionsPage({ cats, onDelete, onMarkReunited, onShare, lang }) {
  const reunitedCats = cats.filter(c => c.status === 'reunited');

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Celebration Header */}
      <div className="glass-card" style={{
        padding: '50px 40px',
        borderRadius: '24px',
        marginBottom: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(251, 146, 60, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse-glow 4s ease-in-out infinite'
        }}></div>

        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={24} color="#f97316" />
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: 0,
            background: 'linear-gradient(135deg, #fff 30%, #fdba74 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {getTranslation('reunitedTitle', lang)}
          </h1>
          <Sparkles size={24} color="#f97316" />
        </div>
        
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          {getTranslation('reunitedSubtitle', lang)}
        </p>
      </div>

      {/* Grid Content */}
      {reunitedCats.length > 0 ? (
        <div className="cats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {reunitedCats.map(cat => (
            <CatCard 
              key={cat.id} 
              cat={cat} 
              onScan={() => {}} // No scanning for reunited cats
              onDelete={onDelete} 
              onMarkReunited={onMarkReunited}
              onShare={onShare}
              lang={lang} 
            />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{
          padding: '80px 40px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Heart size={40} strokeWidth={1} />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0 }}>
            {lang === 'kk' ? 'Әзірге бақытты оқиғалар жоқ' : 'Пока нет счастливых историй'}
          </h4>
          <p style={{ maxWidth: '450px', margin: 0, fontSize: '0.95rem' }}>
            {lang === 'kk' 
              ? 'Егер сіз осы сайт арқылы мысығыңызды тапсаңыз, хабарландыруды өшіргенде бұл туралы бөлісіңіз.' 
              : 'Если вы найдете своего котика через этот сайт, поделитесь своей радостью при удалении объявления.'}
          </p>
        </div>
      )}
    </div>
  );
}
