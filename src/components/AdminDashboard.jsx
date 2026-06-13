import React, { useState } from 'react';
import { Lock, Trash2, ArrowLeft, Calendar, MessageSquare, User, Mail, Archive, BarChart3, Heart, Download, TrendingUp, Users, Activity, Eye, FileSpreadsheet, Sparkles, PlusCircle, Trash, CheckCircle } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState('feedback'); // 'feedback', 'listings', 'analytics'
  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsFilter, setCatsFilter] = useState('all'); // 'all', 'lost', 'found', 'reunited'
  const [catsSearch, setCatsSearch] = useState('');

  // Analytics States
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const fetchCats = async () => {
    setCatsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('cats')
        .select('id, created_at, status, breed, color, district, date, description, contact_name, contact_phone, photo_url, photo_url_2, photo_url_3, tags, latitude, longitude')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setCats(data || []);
    } catch (err) {
      console.error('Failed to fetch cats for admin:', err);
    } finally {
      setCatsLoading(false);
    }
  };

  const fetchAnalytics = async (code = verifiedPasscode) => {
    if (!code) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const { data, error: fetchErr } = await supabase.rpc('get_analytics_data', {
        passcode: code
      });
      if (fetchErr) throw fetchErr;
      setAnalyticsData(data || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setAnalyticsError(err.message || 'Error fetching analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === 'analytics') {
      fetchAnalytics();
    } else if (section === 'listings') {
      fetchCats();
    } else if (section === 'feedback') {
      refreshMessages();
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
      
      // Load cats and analytics on successful unlock
      fetchCats();
      fetchAnalytics(passcode.trim());
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
    if (!window.confirm(getTranslation('cardDeleteConfirm', lang))) return;
    try {
      const { data: success, error: deleteErr } = await supabase.rpc('delete_cat_with_passcode', {
        cat_id: catId,
        input_passcode: verifiedPasscode
      });
      if (deleteErr) throw deleteErr;
      if (success) {
        setCats(prev => prev.filter(c => c.id !== catId));
        alert(getTranslation('adminAdDeletedAlert', lang));
      } else {
        alert(getTranslation('adminAdDeleteErrorAlert', lang));
      }
    } catch (err) {
      console.error('Admin delete cat error:', err);
      alert((lang === 'kk' ? 'Өшіру кезіндегі қате: ' : 'Ошибка при удалении: ') + err.message);
    }
  };

  const handleMarkReunited = async (catId) => {
    if (!window.confirm(getTranslation('adminConfirmMarkReunited', lang))) return;
    try {
      const { data: success, error: reunitedErr } = await supabase.rpc('mark_cat_reunited_with_passcode', {
        cat_id: catId,
        input_passcode: verifiedPasscode,
        optional_story: ''
      });
      if (reunitedErr) throw reunitedErr;
      if (success) {
        setCats(prev => prev.map(c => c.id === catId ? { ...c, status: 'reunited', contact_name: 'Аноним', contact_phone: '' } : c));
        alert(getTranslation('adminAdReunitedAlert', lang));
      } else {
        alert(getTranslation('adminAdReunitedErrorAlert', lang));
      }
    } catch (err) {
      console.error('Admin mark reunited error:', err);
      alert((lang === 'kk' ? 'Жаңарту кезіндегі қате: ' : 'Ошибка при обновлении: ') + err.message);
    }
  };

  const exportAnalyticsToCSV = () => {
    if (analyticsData.length === 0) {
      alert('Нет данных для выгрузки');
      return;
    }
    const headers = ['Timestamp', 'Event Type', 'Page Path', 'Session ID', 'Metadata'];
    const rows = analyticsData.map(e => [
      new Date(e.created_at).toLocaleString('ru-RU'),
      e.event_type,
      e.page_path || '',
      e.session_id || '',
      JSON.stringify(e.metadata || {})
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kotopoisk_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportListingsToCSV = () => {
    if (cats.length === 0) {
      alert('Нет объявлений для выгрузки');
      return;
    }
    const headers = [
      'ID', 'Дата создания', 'Статус', 'Порода', 'Окрас', 
      'Район', 'Дата объявления', 'Широта', 'Долгота', 
      'Имя контакта', 'Телефон', 'Описание'
    ];
    const rows = cats.map(c => [
      c.id,
      new Date(c.created_at || Date.now()).toLocaleString('ru-RU'),
      c.status === 'lost' ? 'Пропал' : (c.status === 'found' ? 'Найден' : 'Дома (Воссоединен)'),
      c.breed || 'Беспородная',
      c.color,
      c.district,
      c.date,
      c.latitude || '',
      c.longitude || '',
      c.status === 'reunited' ? 'Аноним' : (c.contact_name || ''),
      c.status === 'reunited' ? '' : (c.contact_phone || ''),
      c.description || ''
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kotopoisk_listings_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics calculations
  const totalViews = analyticsData.filter(e => e.event_type === 'page_view').length;
  const uniqueSessions = new Set(analyticsData.map(e => e.session_id).filter(Boolean)).size;
  const totalActions = analyticsData.filter(e => e.event_type !== 'page_view').length;
  
  const countEvent = (type) => analyticsData.filter(e => e.event_type === type).length;
  const scansCount = countEvent('ai_scan');
  const createdCount = countEvent('ad_created');
  const reunitedCount = countEvent('ad_reunited');
  const feedbackSubCount = countEvent('feedback_submitted');
  const deletedCount = countEvent('ad_deleted');

  // Page views distribution
  const pageViewsDist = {
    'dashboard': 0,
    'reunions': 0,
    'report': 0,
    'scan': 0,
    'admin': 0
  };
  analyticsData.forEach(e => {
    if (e.event_type === 'page_view' && e.page_path && pageViewsDist[e.page_path] !== undefined) {
      pageViewsDist[e.page_path]++;
    }
  });

  const maxPageView = Math.max(...Object.values(pageViewsDist), 1);
  const maxEventCount = Math.max(scansCount, createdCount, reunitedCount, feedbackSubCount, deletedCount, 1);

  const getPageLabel = (path) => {
    const labels = {
      'dashboard': 'Главная (Объявления)',
      'reunions': 'Счастливые истории',
      'report': 'Подать объявление',
      'scan': 'ИИ Сканер',
      'admin': 'Панель админа'
    };
    return labels[path] || path;
  };

  const formatMetadata = (meta) => {
    if (!meta || Object.keys(meta).length === 0) return '-';
    return Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(', ');
  };

  const formatSession = (sid) => {
    if (!sid) return '-';
    if (sid.startsWith('session_')) {
      return sid.replace('session_', '').substring(0, 8);
    }
    return sid.substring(0, 8);
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
            {getTranslation('adminAccessRestricted', lang)}
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
            <span>{getTranslation('adminBtnBack', lang)}</span>
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
              onClick={() => handleSectionChange('feedback')}
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
              {getTranslation('adminTabFeedback', lang)}
            </button>
            <button
              onClick={() => handleSectionChange('listings')}
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
              {getTranslation('adminTabListings', lang)}
            </button>
            <button
              onClick={() => handleSectionChange('analytics')}
              style={{
                background: activeSection === 'analytics' ? 'var(--primary)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: activeSection === 'analytics' ? '#ffffff' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {getTranslation('adminTabAnalytics', lang)}
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setIsUnlocked(false);
            setPasscode('');
            setVerifiedPasscode('');
            setMessages([]);
            setAnalyticsData([]);
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
          {getTranslation('adminLogoutBtn', lang)}
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
              {getTranslation('adminFilterAll', lang)} ({cats.length})
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
              {getTranslation('adminFilterLost', lang)} ({cats.filter(c => c.status === 'lost').length})
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
              {getTranslation('adminFilterFound', lang)} ({cats.filter(c => c.status === 'found').length})
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
              {getTranslation('adminFilterReunited', lang)} ({cats.filter(c => c.status === 'reunited').length})
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '400px' }}>
            <input 
              type="text"
              placeholder={getTranslation('adminSearchPlaceholder', lang)}
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
              {catsLoading ? '...' : getTranslation('adminFilterRefresh', lang)}
            </button>
          </div>
        </div>

        {/* Grid of Listings table */}
        {catsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>{getTranslation('adminLoadingListings', lang)}</div>
        ) : filteredCatsList.length === 0 ? (
          <div style={{
            background: '#0c0f1d',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p style={{ margin: 0 }}>{getTranslation('adminNoListings', lang)}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#0c0f1d', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                  <th style={{ padding: '16px' }}>{getTranslation('adminTablePhoto', lang)}</th>
                  <th style={{ padding: '16px' }}>{getTranslation('adminTableBreedColor', lang)}</th>
                  <th style={{ padding: '16px' }}>{getTranslation('adminTableStatus', lang)}</th>
                  <th style={{ padding: '16px' }}>{getTranslation('adminTableDistrictDate', lang)}</th>
                  <th style={{ padding: '16px' }}>{getTranslation('adminTableContacts', lang)}</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>{getTranslation('adminTableActions', lang)}</th>
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
                      <div style={{ fontWeight: '600', color: '#fff' }}>{cat.breed || getTranslation('cardBreedDefault', lang)}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{cat.color}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {cat.status === 'lost' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{getTranslation('statusLost', lang)}</span>}
                      {cat.status === 'found' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{getTranslation('statusFound', lang)}</span>}
                      {cat.status === 'reunited' && <span style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{getTranslation('statusReunited', lang)}</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#fff' }}>{cat.district}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{cat.date}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {cat.status === 'reunited' ? (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{getTranslation('adminTableHiddenReunited', lang)}</span>
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
                            title={getTranslation('adminTooltipReunited', lang)}
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
                          title={getTranslation('adminTooltipDelete', lang)}
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

    {activeSection === 'analytics' && (
      <div>
        {analyticsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Загрузка аналитики...</div>
        ) : analyticsError ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            color: '#f87171',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 12px 0' }}>Не удалось загрузить данные аналитики.</p>
            <p style={{ fontSize: '12px', margin: 0 }}>{analyticsError}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Analytics KPI cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {/* Views */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px', borderRadius: '12px' }}>
                  <Eye size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminAnalyticsViews', lang)}</span>
                  <strong style={{ fontSize: '24px', fontWeight: '700' }}>{totalViews}</strong>
                </div>
              </div>

              {/* Visitors */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '12px', borderRadius: '12px' }}>
                  <Users size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminAnalyticsVisitors', lang)}</span>
                  <strong style={{ fontSize: '24px', fontWeight: '700' }}>{uniqueSessions}</strong>
                </div>
              </div>

              {/* AI searches */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '12px', borderRadius: '12px' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminAnalyticsScans', lang)}</span>
                  <strong style={{ fontSize: '24px', fontWeight: '700' }}>{scansCount}</strong>
                </div>
              </div>

              {/* Reunions */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '12px', borderRadius: '12px' }}>
                  <Heart size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>{getTranslation('adminAnalyticsReunited', lang)}</span>
                  <strong style={{ fontSize: '24px', fontWeight: '700' }}>{reunitedCount}</strong>
                </div>
              </div>
            </div>

            {/* Export options block */}
            <div style={{
              background: 'linear-gradient(135deg, #0c0f1d 0%, #080a14 100%)',
              border: '1px solid rgba(249, 115, 22, 0.15)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                  {getTranslation('adminAnalyticsCSVExport', lang)}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                  Выгрузка полной сырой информации о визитах и объявлениях в формате CSV для Excel/Google Таблиц
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={exportAnalyticsToCSV}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  <FileSpreadsheet size={16} />
                  <span>{getTranslation('adminExportAnalyticsBtn', lang)}</span>
                </button>

                <button
                  onClick={exportListingsToCSV}
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Download size={16} />
                  <span>{getTranslation('adminExportListingsBtn', lang)}</span>
                </button>
              </div>
            </div>

            {/* Custom Visual Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {/* Page Views Chart */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} style={{ color: '#3b82f6' }} />
                  <span>Популярность разделов (Просмотры)</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {Object.entries(pageViewsDist).map(([path, count]) => (
                    <div key={path} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#e5e7eb', fontWeight: '500' }}>{getPageLabel(path)}</span>
                        <span style={{ color: '#9ca3af' }}>{count} {lang === 'ru' ? 'просмотров' : 'қарау'} ({totalViews > 0 ? Math.round((count / totalViews) * 100) : 0}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${totalViews > 0 ? (count / maxPageView) * 100 : 0}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                          borderRadius: '5px',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Distribution Chart */}
              <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: '#a855f7' }} />
                  <span>Распределение активностей (Действия)</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {[
                    { type: 'ai_scan', label: 'ИИ Сканирования', count: scansCount, color: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)' },
                    { type: 'ad_created', label: 'Подано объявлений', count: createdCount, color: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' },
                    { type: 'ad_reunited', label: 'Воссоединений (Дома)', count: reunitedCount, color: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)' },
                    { type: 'feedback_submitted', label: 'Отправлено отзывов', count: feedbackSubCount, color: 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)' },
                    { type: 'ad_deleted', label: 'Удалено объявлений', count: deletedCount, color: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)' }
                  ].map(({ type, label, count, color }) => (
                    <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#e5e7eb', fontWeight: '500' }}>{label}</span>
                        <span style={{ color: '#9ca3af' }}>{count} ({totalActions > 0 ? Math.round((count / totalActions) * 100) : 0}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${totalActions > 0 ? (count / maxEventCount) * 100 : 0}%`,
                          height: '100%',
                          background: color,
                          borderRadius: '5px',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Events List */}
            <div style={{ background: '#0c0f1d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                <span>{getTranslation('adminAnalyticsRecentEvents', lang)}</span>
              </h3>

              {analyticsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  {getTranslation('adminAnalyticsNoEvents', lang)}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                        <th style={{ padding: '12px' }}>{getTranslation('adminAnalyticsEventColTime', lang)}</th>
                        <th style={{ padding: '12px' }}>{getTranslation('adminAnalyticsEventColType', lang)}</th>
                        <th style={{ padding: '12px' }}>{getTranslation('adminAnalyticsEventColPage', lang)}</th>
                        <th style={{ padding: '12px' }}>{getTranslation('adminAnalyticsEventColSession', lang)}</th>
                        <th style={{ padding: '12px' }}>{getTranslation('adminAnalyticsEventColMeta', lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.slice(0, 25).map(e => {
                        let typeColor = '#9ca3af';
                        let typeBg = 'rgba(255, 255, 255, 0.03)';
                        let typeText = e.event_type;

                        if (e.event_type === 'page_view') {
                          typeColor = '#3b82f6';
                          typeBg = 'rgba(59, 130, 246, 0.08)';
                          typeText = 'Просмотр';
                        } else if (e.event_type === 'ai_scan') {
                          typeColor = '#f97316';
                          typeBg = 'rgba(249, 115, 22, 0.08)';
                          typeText = 'ИИ Поиск';
                        } else if (e.event_type === 'ad_created') {
                          typeColor = '#10b981';
                          typeBg = 'rgba(16, 185, 129, 0.08)';
                          typeText = 'Создано';
                        } else if (e.event_type === 'ad_reunited') {
                          typeColor = '#ec4899';
                          typeBg = 'rgba(236, 72, 153, 0.08)';
                          typeText = 'Дома 🧡';
                        } else if (e.event_type === 'feedback_submitted') {
                          typeColor = '#a855f7';
                          typeBg = 'rgba(168, 85, 247, 0.08)';
                          typeText = 'Отзыв';
                        } else if (e.event_type === 'ad_deleted') {
                          typeColor = '#ef4444';
                          typeBg = 'rgba(239, 68, 68, 0.08)';
                          typeText = 'Удалено';
                        }

                        return (
                          <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }} className="admin-table-row">
                            <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#9ca3af' }}>
                              {new Date(e.created_at).toLocaleString('ru-RU')}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                background: typeBg,
                                color: typeColor,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {typeText}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#ffffff' }}>
                              {getPageLabel(e.page_path)}
                            </td>
                            <td style={{ padding: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                              {formatSession(e.session_id)}
                            </td>
                            <td style={{ padding: '12px', color: '#9ca3af', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatMetadata(e.metadata)}>
                              {formatMetadata(e.metadata)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    )}
  </div>
    </div>
  );
}
