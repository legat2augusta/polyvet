import React, { useState } from 'react';
import { Lock, Trash2, ArrowLeft, Calendar, MessageSquare, User, Mail, Archive, BarChart3, Heart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getTranslation } from '../utils/translations';

export default function AdminDashboard({ onBack, lang }) {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifiedPasscode, setVerifiedPasscode] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('new'); // 'all', 'new', 'archived'

  // Admin Listings States
  const [activeSection, setActiveSection] = useState('feedback'); // 'feedback', 'listings'
  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsFilter, setCatsFilter] = useState('all'); // 'all', 'lost', 'found', 'reunited'
  const [catsSearch, setCatsSearch] = useState('');

  const fetchCats = async () => {
    setCatsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setCats(data || []);
    } catch (err) {
      console.error('Failed to fetch cats for admin:', err);
    } finally {
      setCatsLoading(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passcode) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch feedback messages from RPC using the passcode
      const { data, error: rpcError } = await supabase.rpc('get_feedback_messages', {
        passcode: passcode.trim()
      });

      if (rpcError) throw rpcError;

      setMessages(data || []);
      setVerifiedPasscode(passcode.trim());
      setIsUnlocked(true);
      
      // Load cats on successful unlock
      fetchCats();
    } catch (err) {
      console.error('Admin unlock error:', err);
      setError(getTranslation('adminIncorrectPasscode', lang));
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    if (!verifiedPasscode) return;
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_feedback_messages', {
        passcode: verifiedPasscode
      });
      if (rpcError) throw rpcError;
      setMessages(data || []);
    } catch (err) {
      console.error('Refresh messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      const { error: rpcError } = await supabase.rpc('archive_feedback_message', {
        message_id: id,
        passcode: verifiedPasscode
      });

      if (rpcError) throw rpcError;

      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'archived' } : m));
    } catch (err) {
      console.error('Archive message error:', err);
      alert('Error archiving message');
    }
  };

  const handleDeleteCat = async (catId) => {
    if (!window.confirm('Вы действительно хотите навсегда удалить это объявление?')) return;
    try {
      const { data: success, error: deleteErr } = await supabase.rpc('delete_cat_with_passcode', {
        cat_id: catId,
        input_passcode: verifiedPasscode
      });
      if (deleteErr) throw deleteErr;
      if (success) {
        setCats(prev => prev.filter(c => c.id !== catId));
        alert('Объявление успешно удалено.');
      } else {
        alert('Не удалось удалить объявление. Неверный пароль.');
      }
    } catch (err) {
      console.error('Admin delete cat error:', err);
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const handleMarkReunited = async (catId) => {
    if (!window.confirm('Перенести это объявление в счастливые истории? Контакты будут скрыты.')) return;
    try {
      const { data: success, error: reunitedErr } = await supabase.rpc('mark_cat_reunited_with_passcode', {
        cat_id: catId,
        input_passcode: verifiedPasscode,
        optional_story: ''
      });
      if (reunitedErr) throw reunitedErr;
      if (success) {
        setCats(prev => prev.map(c => c.id === catId ? { ...c, status: 'reunited', contact_name: 'Аноним', contact_phone: '' } : c));
        alert('Объявление перенесено в счастливые истории.');
      } else {
        alert('Не удалось изменить статус. Неверный пароль.');
      }
    } catch (err) {
      console.error('Admin mark reunited error:', err);
      alert('Ошибка при обновлении: ' + err.message);
    }
  };

  // Filter messages based on tab
  const filteredMessages = messages.filter(m => {
    if (filter === 'new') return m.status === 'new';
    if (filter === 'archived') return m.status === 'archived';
    return true; // 'all'
  });

  // Filter cats based on admin tab & search
  const filteredCatsList = cats.filter(cat => {
    const matchesFilter = catsFilter === 'all' ? true : cat.status === catsFilter;
    const matchesSearch = catsSearch
      ? (cat.breed && cat.breed.toLowerCase().includes(catsSearch.toLowerCase())) ||
        (cat.description && cat.description.toLowerCase().includes(catsSearch.toLowerCase())) ||
        (cat.district && cat.district.toLowerCase().includes(catsSearch.toLowerCase())) ||
        (cat.color && cat.color.toLowerCase().includes(catsSearch.toLowerCase()))
      : true;
    return matchesFilter && matchesSearch;
  });

  // Calculate quick metrics
  const totalCount = messages.length;
  const newCount = messages.filter(m => m.status === 'new').length;
  const suggestionsCount = messages.filter(m => m.type === 'suggestion').length;
  const bugsCount = messages.filter(m => m.type === 'bug').length;
  const contactsCount = messages.filter(m => m.type === 'contact').length;

  if (!isUnlocked) {
    /* Unlock Lock Screen */
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050712',
        color: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#0c0f1d',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '16px',
            background: 'rgba(249, 115, 22, 0.08)',
            color: '#f97316',
            borderRadius: '50%',
            marginBottom: '20px'
          }}>
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 8px 0' }}>
            {getTranslation('adminTitle', lang)}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 24px 0' }}>
            Access restricted to system administrators
          </p>

          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                color: '#f87171',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={getTranslation('adminPasscodePlaceholder', lang)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                textAlign: 'center'
              }}
              required
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !passcode}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                opacity: loading || !passcode ? 0.6 : 1,
                transition: 'opacity 0.2s',
                marginTop: '8px'
              }}
            >
              {loading ? '...' : getTranslation('adminUnlockBtn', lang)}
            </button>
          </form>

          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
        </div>
      </div>
    );
  }

  /* Unlocked Main Panel Dashboard */
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050712',
      color: '#f3f4f6',
      fontFamily: "'Outfit', sans-serif",
      paddingBottom: '80px'
    }}>
      {/* Navbar Header */}
      <header style={{
        background: '#0c0f1d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
              {getTranslation('adminTitle', lang)}
            </h1>
          </div>

          {/* Section Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '3px',
            borderRadius: '10px',
            gap: '2px'
          }}>
            <button
              onClick={() => setActiveSection('feedback')}
              style={{
                background: activeSection === 'feedback' ? 'var(--primary)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: activeSection === 'feedback' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Обратная связь
            </button>
            <button
              onClick={() => setActiveSection('listings')}
              style={{
                background: activeSection === 'listings' ? 'var(--primary)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: activeSection === 'listings' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Объявления
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setIsUnlocked(false);
            setPasscode('');
            setVerifiedPasscode('');
            setMessages([]);
          }}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        {activeSection === 'feedback' && (
          <>
            {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Total */}
          <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px', borderRadius: '12px' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminTotalSubmissions', lang)}</span>
              <strong style={{ fontSize: '24px', fontWeight: '700' }}>{totalCount}</strong>
            </div>
          </div>

          {/* Card 2: New */}
          <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '12px', borderRadius: '12px' }}>
              <MessageSquare size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminPendingSubmissions', lang)}</span>
              <strong style={{ fontSize: '24px', fontWeight: '700' }}>{newCount}</strong>
            </div>
          </div>

          {/* Card 3: Distribution */}
          <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Распределение:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
              <span style={{ color: '#fbbf24' }}>💡 Идеи: {suggestionsCount}</span>
              <span style={{ color: '#f87171' }}>⚠️ Ошибки: {bugsCount}</span>
              <span style={{ color: '#34d399' }}>✉️ Контакт: {contactsCount}</span>
            </div>
          </div>
        </div>

        {/* Filters Tabs and Refresh Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Filters */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            <button
              onClick={() => setFilter('new')}
              style={{
                background: filter === 'new' ? 'rgba(249, 115, 22, 0.1)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: filter === 'new' ? '#f97316' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {getTranslation('adminFilterNew', lang)} ({newCount})
            </button>
            <button
              onClick={() => setFilter('archived')}
              style={{
                background: filter === 'archived' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: filter === 'archived' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {getTranslation('adminFilterArchived', lang)} ({totalCount - newCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: filter === 'all' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {getTranslation('adminFilterAll', lang)} ({totalCount})
            </button>
          </div>

          <button
            onClick={refreshMessages}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Обновление...' : 'Обновить список'}
          </button>
        </div>

        {/* Message List */}
        {filteredMessages.length === 0 ? (
          <div style={{
            background: '#0c0f1d',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <MessageSquare size={40} style={{ color: 'rgba(255, 255, 255, 0.1)', marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>{getTranslation('adminNoFeedback', lang)}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredMessages.map(msg => {
              // Type styling
              let typeColor = '#fbbf24';
              let typeBg = 'rgba(251, 191, 36, 0.08)';
              let typeText = 'Идея / Предложение';
              if (msg.type === 'bug') {
                typeColor = '#f87171';
                typeBg = 'rgba(248, 113, 113, 0.08)';
                typeText = 'Ошибка / Баг';
              } else if (msg.type === 'contact') {
                typeColor = '#34d399';
                typeBg = 'rgba(52, 211, 153, 0.08)';
                typeText = 'Связь с автором';
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    background: '#0c0f1d',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative'
                  }}
                >
                  {/* Card Header row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Type badge */}
                      <span style={{
                        background: typeBg,
                        color: typeColor,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {typeText}
                      </span>

                      {/* Date */}
                      <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(msg.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    {/* Archive button */}
                    {msg.status === 'new' && (
                      <button
                        onClick={() => handleArchive(msg.id)}
                        style={{
                          background: 'rgba(249, 115, 22, 0.1)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          color: '#f97316',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.18)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'}
                      >
                        <Archive size={12} />
                        <span>{getTranslation('adminArchiveBtn', lang)}</span>
                      </button>
                    )}

                    {msg.status === 'archived' && (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        color: '#9ca3af',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}>
                        {getTranslation('adminStatusArchived', lang)}
                      </span>
                    )}
                  </div>

                  {/* Message body */}
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#e5e7eb',
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '14px',
                    borderRadius: '12px'
                  }}>
                    {msg.message}
                  </div>

                  {/* Sender details */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    fontSize: '12px',
                    color: '#9ca3af',
                    flexWrap: 'wrap',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    paddingTop: '10px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} />
                      Отправитель: <strong>{msg.name || 'Аноним'}</strong>
                    </span>
                    {msg.contact && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} />
                        Контакты: <strong>{msg.contact}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )}

    {activeSection === 'listings' && (
      <div>
        {/* Search and filter row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Filter */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            <button
              onClick={() => setCatsFilter('all')}
              style={{
                background: catsFilter === 'all' ? 'rgba(255, 255, 255, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: catsFilter === 'all' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Все ({cats.length})
            </button>
            <button
              onClick={() => setCatsFilter('lost')}
              style={{
                background: catsFilter === 'lost' ? 'rgba(239, 68, 68, 0.1)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: catsFilter === 'lost' ? '#ef4444' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Потеряны ({cats.filter(c => c.status === 'lost').length})
            </button>
            <button
              onClick={() => setCatsFilter('found')}
              style={{
                background: catsFilter === 'found' ? 'rgba(16, 185, 129, 0.1)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: catsFilter === 'found' ? '#10b981' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Найдены ({cats.filter(c => c.status === 'found').length})
            </button>
            <button
              onClick={() => setCatsFilter('reunited')}
              style={{
                background: catsFilter === 'reunited' ? 'rgba(249, 115, 22, 0.1)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: catsFilter === 'reunited' ? '#f97316' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Дома ({cats.filter(c => c.status === 'reunited').length})
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '400px' }}>
            <input 
              type="text"
              placeholder="Поиск по породе, описанию, району..."
              value={catsSearch}
              onChange={(e) => setCatsSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={fetchCats}
              disabled={catsLoading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '13px',
                color: '#ffffff',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {catsLoading ? '...' : 'Обновить'}
            </button>
          </div>
        </div>

        {/* Grid of Listings table */}
        {catsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Загрузка объявлений...</div>
        ) : filteredCatsList.length === 0 ? (
          <div style={{
            background: '#0c0f1d',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p style={{ margin: 0 }}>Объявлений не найдено.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#0c0f1d', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                  <th style={{ padding: '16px' }}>Фото</th>
                  <th style={{ padding: '16px' }}>Порода / Окрас</th>
                  <th style={{ padding: '16px' }}>Статус</th>
                  <th style={{ padding: '16px' }}>Район / Дата</th>
                  <th style={{ padding: '16px' }}>Контакты</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatsList.map(cat => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }} className="admin-table-row">
                    <td style={{ padding: '12px 16px' }}>
                      <img 
                        src={cat.photo_url || cat.photo} 
                        alt="" 
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{cat.breed || 'Беспородная'}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{cat.color}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {cat.status === 'lost' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Пропал</span>}
                      {cat.status === 'found' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Найден</span>}
                      {cat.status === 'reunited' && <span style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Дома 🧡</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#fff' }}>{cat.district}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{cat.date}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {cat.status === 'reunited' ? (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Скрыты (Дома)</span>
                      ) : (
                        <>
                          <div style={{ color: '#fff', fontWeight: '500' }}>{cat.contact_name}</div>
                          <div style={{ color: '#9ca3af', fontSize: '11px' }}>{cat.contact_phone}</div>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {cat.status !== 'reunited' && (
                          <button
                            onClick={() => handleMarkReunited(cat.id)}
                            title="Перенести в счастливые истории"
                            style={{
                              background: 'rgba(249,115,22,0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#f97316',
                              cursor: 'pointer'
                            }}
                          >
                            <Heart size={14} fill="currentColor" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCat(cat.id)}
                          title="Удалить навсегда"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f87171',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <style>{`
          .admin-table-row {
            transition: background 0.2s;
          }
          .admin-table-row:hover {
            background: rgba(255, 255, 255, 0.02) !important;
          }
        `}</style>
      </div>
    )}
  </div>
    </div>
  );
}
