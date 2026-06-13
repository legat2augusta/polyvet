import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import AIScanner from './components/AIScanner';
import FeedbackModal from './components/FeedbackModal';
import AdminDashboard from './components/AdminDashboard';
import ReunionsPage from './components/ReunionsPage';
import FlyerModal from './components/FlyerModal';
import { supabase, logEvent } from './supabaseClient';
import { AlertTriangle } from 'lucide-react';
import { getTranslation } from './utils/translations';

// Default mock database with realistic Almaty coordinates
const DEFAULT_CATS = [
  {
    id: 1,
    status: 'lost',
    breed: 'Дворняжка',
    color: 'Рыжий',
    district: 'Бостандыкский',
    date: '2026-06-10',
    description: 'Рыжий пушистый кот, глаза зеленые. Испугался шума во дворе на улице Розыбакиева (уг. Басенова) и убежал. Очень ласковый, откликается на кличку Симба.',
    contact_name: 'Диана',
    contact_phone: '+7 707 111 2233',
    photo_url: '/assets/cats/ginger.png',
    latitude: 43.2198,
    longitude: 76.8922
  },
  {
    id: 2,
    status: 'found',
    breed: 'Бомбейский метис',
    color: 'Черный',
    district: 'Медеуский',
    date: '2026-06-11',
    description: 'Найден черный гладкошерстный кот с яркими зелеными глазами в районе Терренкура. Был в синем ошейнике от блох. Очень ласковый, явно домашний. Ищем хозяев.',
    contact_name: 'Арман',
    contact_phone: '+7 777 222 3344',
    photo_url: '/assets/cats/black.png',
    latitude: 43.2355,
    longitude: 76.9582
  },
  {
    id: 3,
    status: 'lost',
    breed: 'Ангорская смесь',
    color: 'Серый',
    district: 'Ауэзовский',
    date: '2026-06-08',
    description: 'Пропал кот, бело-серая пушистая шерсть, голубые глаза, на правой задней лапе темное пятнышко. Пропал в 8-м микрорайоне. Будем благодарны за любую информацию.',
    contact_name: 'Мадина',
    contact_phone: '+7 701 333 4455',
    photo_url: '/assets/cats/white_grey.png',
    latitude: 43.2221,
    longitude: 76.8525
  },
  {
    id: 4,
    status: 'found',
    breed: 'Калико',
    color: 'Трехцветный',
    district: 'Алмалинский',
    date: '2026-06-12',
    description: 'Около супермаркета на Толе би - Сейфуллина найдена трехцветная кошка (черно-рыже-белая). Ручная, чистая, знает лоток. Очень скучает по хозяевам.',
    contact_name: 'Ирина',
    contact_phone: '+7 747 444 5566',
    photo_url: '/assets/cats/calico.png',
    latitude: 43.2514,
    longitude: 76.9298
  },
  {
    id: 5,
    status: 'lost',
    breed: 'Сиамская',
    color: 'Сиамский',
    district: 'Бостандыкский',
    date: '2026-06-09',
    description: 'Пропал сиамский кот в районе Выставки (КЦДС Атакент). Голубые глаза, темная мордочка и уши. Отзывается на имя Кокос. Пожалуйста, помогите найти!',
    contact_name: 'Адиль',
    contact_phone: '+7 702 555 6677',
    photo_url: '/assets/cats/siamese.png',
    latitude: 43.2255,
    longitude: 76.9088
  },
  {
    id: 6,
    status: 'found',
    breed: 'Дворняжка',
    color: 'Рыжий',
    district: 'Бостандыкский',
    date: '2026-06-12',
    description: 'В районе Жарокова - Утепова сидит на дереве рыжий крупный кот, пушистый, с белым воротником. Не спускается со вчерашнего дня. Ищем старых хозяев.',
    contact_name: 'Ерлан',
    contact_phone: '+7 705 666 7788',
    photo_url: '/assets/cats/ginger.png',
    latitude: 43.2185,
    longitude: 76.8991
  },
  {
    id: 7,
    status: 'lost',
    breed: 'Дворняжка',
    color: 'Черный',
    district: 'Алмалинский',
    date: '2026-06-05',
    description: 'Пропала черная кошка, полностью черная без пятен. Желто-зеленые глаза. Пропала в районе Жамбыла - Байтурсынова. Вознаграждение гарантируется.',
    contact_name: 'Айгерим',
    contact_phone: '+7 708 777 8899',
    photo_url: '/assets/cats/black.png',
    latitude: 43.2491,
    longitude: 76.9185
  },
  {
    id: 8,
    status: 'found',
    breed: 'Дворняжка',
    color: 'Серый',
    district: 'Медеуский',
    date: '2026-06-13',
    description: 'Прибился к подъезду на Самале-2 (возле Dostyk Plaza) пушистый серый кот с белыми лапками и грудкой. Очень ласковый, мурчит, сытый. Ждет хозяев.',
    contact_name: 'Данияр',
    contact_phone: '+7 777 888 9900',
    photo_url: '/assets/cats/white_grey.png',
    latitude: 43.2381,
    longitude: 76.9531
  }
];

export default function App() {
  const [cats, setCats] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetCatForScan, setTargetCatForScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbWarning, setDbWarning] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('kotopoisk_lang') || 'ru');
  const [activeShareCat, setActiveShareCat] = useState(null);
  const [selectedAdId, setSelectedAdId] = useState(null);

  const handleShare = async (cat) => {
    let phone = cat.contact_phone;
    if (!phone && !dbWarning) {
      try {
        const { data, error } = await supabase
          .from('cats')
          .select('contact_phone')
          .eq('id', cat.id)
          .single();
        if (data && data.contact_phone) {
          phone = data.contact_phone;
          cat.contact_phone = phone;
          setCats(prev => prev.map(c => c.id === cat.id ? { ...c, contact_phone: phone } : c));
        }
      } catch (err) {
        console.warn('Failed to fetch contact phone for flyer:', err);
      }
    }
    setActiveShareCat(cat);
    logEvent('ad_shared', activeTab, { cat_id: cat.id, breed: cat.breed });
  };

  const handleClearAdFilter = () => {
    setSelectedAdId(null);
    try {
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (e) {
      console.warn('Failed to clean URL:', e);
    }
  };

  const handleFetchPhone = async (catId) => {
    try {
      const existing = cats.find(c => c.id === catId);
      if (existing && existing.contact_phone) {
        return existing.contact_phone;
      }
      
      if (dbWarning) {
        const mock = DEFAULT_CATS.find(c => c.id === catId);
        return mock ? mock.contact_phone : '';
      }
      
      const { data, error } = await supabase
        .from('cats')
        .select('contact_phone')
        .eq('id', catId)
        .single();
        
      if (error) throw error;
      
      if (data && data.contact_phone) {
        setCats(prev => prev.map(c => 
          c.id === catId ? { ...c, contact_phone: data.contact_phone } : c
        ));
        return data.contact_phone;
      }
      return '';
    } catch (err) {
      console.error('Failed to fetch contact phone:', err);
      return '';
    }
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('kotopoisk_lang', newLang);
  };

  // Track page views
  useEffect(() => {
    logEvent('page_view', activeTab);
  }, [activeTab]);

  // Fetch cats from Supabase on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cats')
          .select('id, created_at, status, breed, color, district, date, description, contact_name, photo_url, photo_url_2, photo_url_3, tags, latitude, longitude')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setCats(data);
          setDbWarning(false);
        }
      } catch (err) {
        console.warn('Supabase fetch error, falling back to local mock data:', err.message);
        setCats(DEFAULT_CATS);
        // Show warning if database tables don't exist yet (typically error code 42P01 or Network error)
        setDbWarning(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCats();
  }, [dbWarning]);

  // Handle URL deep linking for shared ads
  useEffect(() => {
    if (cats.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const adIdStr = params.get('ad');
      if (adIdStr) {
        const adId = parseInt(adIdStr, 10);
        if (!isNaN(adId)) {
          const found = cats.find(c => c.id === adId);
          if (found) {
            setSelectedAdId(adId);
            // Switch tabs depending on whether the cat is reunited
            if (found.status === 'reunited') {
              setActiveTab('reunions');
            } else {
              setActiveTab('dashboard');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse query param:', e);
    }
  }, [cats]);

  const handleAddCat = async (newCat) => {
    try {
      let data, error;
      
      const response = await supabase
        .from('cats')
        .insert([newCat])
        .select('id, created_at, status, breed, color, district, date, description, contact_name, contact_phone, photo_url, photo_url_2, photo_url_3, tags, latitude, longitude');
      
      data = response.data;
      error = response.error;

      // Safe fallback: if column is undefined (error code 42703), retry without new columns
      if (error && error.code === '42703') {
        console.warn('Database table is missing tags or extra photo columns. Retrying with simplified schema...');
        // eslint-disable-next-line no-unused-vars
        const { tags, photo_url_2, photo_url_3, ...simplifiedCat } = newCat;
        
        const retryResponse = await supabase
          .from('cats')
          .insert([simplifiedCat])
          .select('id, created_at, status, breed, color, district, date, description, contact_name, contact_phone, photo_url, photo_url_2, photo_url_3, tags, latitude, longitude');
          
        data = retryResponse.data;
        error = retryResponse.error;
      }

      if (error) {
        throw error;
      }

      const addedCat = data[0];
      setCats(prevCats => [addedCat, ...prevCats]);
      logEvent('ad_created', 'report', { breed: addedCat.breed, status: addedCat.status, district: addedCat.district });
      
      // Save passcode in localStorage for auto-deletion
      if (addedCat && addedCat.id && addedCat.passcode) {
        try {
          const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
          myPosts[addedCat.id] = addedCat.passcode;
          localStorage.setItem('kotopoisk_my_posts', JSON.stringify(myPosts));
        } catch (e) {
          console.warn('Could not save post ownership to localStorage:', e);
        }
      }
      
      // Trigger scanning with this new cat
      setTargetCatForScan(addedCat);
      setActiveTab('scan');
    } catch (err) {
      console.error('Failed to save in Supabase, saving locally instead:', err);
      // Fallback for local experience if DB is not set up
      const localCat = {
        id: Date.now(),
        ...newCat,
        photo: newCat.photo_url // ensure backward compatibility
      };
      setCats(prevCats => [localCat, ...prevCats]);
      setTargetCatForScan(localCat);
      setActiveTab('scan');
      
      if (dbWarning) {
        alert(getTranslation('addLocalWarning', lang));
      } else {
        alert(getTranslation('addErrorGeneral', lang) + err.message);
      }
    }
  };

  const handleStartScan = (cat) => {
    setTargetCatForScan(cat);
    setActiveTab('scan');
  };

  const handleDeleteCat = async (id, passcode) => {
    try {
      // Call the secure Supabase RPC function on the server
      const { data: success, error: rpcErr } = await supabase.rpc('delete_cat_with_passcode', {
        cat_id: id,
        input_passcode: passcode
      });

      if (rpcErr) {
        throw rpcErr;
      }

      if (!success) {
        alert(getTranslation('deleteErrorInvalid', lang));
        return false;
      }

      setCats(prevCats => prevCats.filter(cat => cat.id !== id));
      logEvent('ad_deleted', activeTab, { cat_id: id });

      try {
        const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
        delete myPosts[id];
        localStorage.setItem('kotopoisk_my_posts', JSON.stringify(myPosts));
      } catch (err) {
        console.warn('Failed to update my posts in localStorage:', err);
      }

      alert(getTranslation('deleteSuccess', lang));
      return true;
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert(getTranslation('deleteErrorGeneral', lang) + err.message);
      return false;
    }
  };

  const handleMarkReunited = async (id, passcode, storyText) => {
    try {
      const { data: success, error: rpcErr } = await supabase.rpc('mark_cat_reunited_with_passcode', {
        cat_id: id,
        input_passcode: passcode,
        optional_story: storyText
      });

      if (rpcErr) {
        throw rpcErr;
      }

      if (!success) {
        return false;
      }

      setCats(prevCats => prevCats.map(cat => {
        if (cat.id === id) {
          return {
            ...cat,
            status: 'reunited',
            contact_name: 'Аноним',
            contact_phone: '',
            description: storyText.trim() ? storyText.trim() : cat.description
          };
        }
        return cat;
      }));
      logEvent('ad_reunited', activeTab, { cat_id: id, has_story: !!storyText });

      try {
        const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
        delete myPosts[id];
        localStorage.setItem('kotopoisk_my_posts', JSON.stringify(myPosts));
      } catch (err) {
        console.warn('Failed to update my posts in localStorage:', err);
      }

      return true;
    } catch (err) {
      console.error('Ошибка при отметке reunited:', err);
      if (dbWarning) {
        setCats(prevCats => prevCats.map(cat => {
          if (cat.id === id) {
            return {
              ...cat,
              status: 'reunited',
              contact_name: 'Аноним',
              contact_phone: '',
              description: storyText.trim() ? storyText.trim() : cat.description
            };
          }
          return cat;
        }));
        return true;
      }
      alert(getTranslation('deleteErrorGeneral', lang) + err.message);
      return false;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* DB Warning Banner */}
      {dbWarning && activeTab !== 'scan' && (
        <div style={{
          background: 'rgba(249, 115, 22, 0.15)',
          borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
          color: '#ffedd5',
          padding: '12px 24px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={18} color="var(--primary)" />
          <span>
            <strong>{getTranslation('appWarningTitle', lang)}</strong> {getTranslation('appWarningText', lang)}
          </span>
        </div>
      )}

      {/* Header Navigation */}
      {activeTab !== 'scan' && activeTab !== 'admin' && (
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeCount={cats.filter(c => c.status !== 'reunited').length} 
          lang={lang}
          setLang={handleSetLang}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
              <span>{getTranslation('appLoading', lang)}</span>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {selectedAdId && activeTab !== 'scan' && activeTab !== 'admin' && (
              <div className="container" style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: '16px',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                margin: '20px auto 0 auto',
                width: 'calc(100% - 48px)',
                maxWidth: '1200px'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>
                  {getTranslation('deepLinkBannerText', lang)}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleClearAdFilter}
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  {getTranslation('deepLinkClearBtn', lang)}
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <Dashboard 
                cats={
                  selectedAdId 
                    ? cats.filter(c => c.id === selectedAdId) 
                    : cats.filter(c => c.status !== 'reunited')
                } 
                onScan={handleStartScan} 
                onNavigateToReport={() => setActiveTab('report')} 
                onDelete={handleDeleteCat}
                onMarkReunited={handleMarkReunited}
                onShare={handleShare}
                onFetchPhone={handleFetchPhone}
                lang={lang}
              />
            )}

            {activeTab === 'reunions' && (
              <ReunionsPage 
                cats={
                  selectedAdId 
                    ? cats.filter(c => c.id === selectedAdId) 
                    : cats
                } 
                onDelete={handleDeleteCat} 
                onMarkReunited={handleMarkReunited}
                onShare={handleShare}
                lang={lang}
              />
            )}
            
            {activeTab === 'report' && (
              <ReportForm 
                onSubmit={handleAddCat} 
                onCancel={() => setActiveTab('dashboard')} 
                lang={lang}
              />
            )}
            
            {activeTab === 'scan' && targetCatForScan && (
              <AIScanner 
                targetCat={targetCatForScan} 
                cats={cats.filter(c => c.status !== 'reunited')} 
                onClose={() => {
                  setActiveTab('dashboard');
                  setTargetCatForScan(null);
                }} 
                onFetchPhone={handleFetchPhone}
                lang={lang}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard 
                onBack={() => setActiveTab('dashboard')} 
                lang={lang}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      {activeTab !== 'admin' && (
        <footer style={{
          borderTop: '1px solid var(--card-border)',
          padding: '24px 0',
          marginTop: 'auto',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          background: 'rgba(10, 15, 30, 0.3)',
          textAlign: 'center'
        }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p>{getTranslation('footerText', lang)}</p>
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.2)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)'}
            >
              {getTranslation('adminTitle', lang)}
            </button>
          </div>
        </footer>
      )}

      {/* Floating Feedback Button Modal */}
      {activeTab !== 'admin' && <FeedbackModal lang={lang} />}

      {/* Flyer Share Modal */}
      {activeShareCat && (
        <FlyerModal 
          key={activeShareCat.id}
          cat={activeShareCat} 
          onClose={() => setActiveShareCat(null)} 
          lang={lang} 
        />
      )}
    </div>
  );
}
