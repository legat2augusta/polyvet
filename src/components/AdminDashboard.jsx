import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Trash2, ArrowLeft, Check, Calendar, MessageSquare, AlertTriangle, User, Mail, Archive, BarChart3, Filter } from 'lucide-react';
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

      // Update state locally or re-fetch
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'archived' } : m));
    } catch (err) {
      console.error('Archive message error:', err);
      alert('Error archiving message');
    }
  };

  // Filter messages based on tab
  const filteredMessages = messages.filter(m => {
    if (filter === 'new') return m.status === 'new';
    if (filter === 'archived') return m.status === 'archived';
    return true; // 'all'
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
      </div>
    </div>
  );
}
