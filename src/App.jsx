import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import AIScanner from './components/AIScanner';
import { supabase } from './supabaseClient';
import { AlertTriangle } from 'lucide-react';

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

  // Fetch cats from Supabase on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cats')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setCats(data);
          setDbWarning(false);
        } else {
          // If connection is successful but table is empty, seed it with mock data 
          // or just show empty. Let's show mock data if nothing is there.
          setCats(DEFAULT_CATS);
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
  }, []);

  const handleAddCat = async (newCat) => {
    try {
      const { data, error } = await supabase
        .from('cats')
        .insert([newCat])
        .select();

      if (error) {
        throw error;
      }

      const addedCat = data[0];
      setCats(prevCats => [addedCat, ...prevCats]);
      
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
        alert('Объявление добавлено локально в сессию, так как база данных Supabase еще не настроена.');
      } else {
        alert('Ошибка при сохранении в базу данных. Сохранено локально: ' + err.message);
      }
    }
  };

  const handleStartScan = (cat) => {
    setTargetCatForScan(cat);
    setActiveTab('scan');
  };

  const handleDeleteCat = async (id, passcode) => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('cats')
        .select('passcode')
        .eq('id', id)
        .single();

      if (fetchErr) {
        throw new Error('Не удалось найти объявление в базе данных.');
      }

      const adminMasterCode = 'kotopoisk2026';
      const isAuthorized = !data.passcode || data.passcode === passcode || passcode === adminMasterCode;

      if (!isAuthorized) {
        alert('Неверный код доступа. Удаление отклонено.');
        return false;
      }

      const { error: deleteErr } = await supabase
        .from('cats')
        .delete()
        .eq('id', id);

      if (deleteErr) {
        throw deleteErr;
      }

      setCats(prevCats => prevCats.filter(cat => cat.id !== id));

      try {
        const myPosts = JSON.parse(localStorage.getItem('kotopoisk_my_posts') || '{}');
        delete myPosts[id];
        localStorage.setItem('kotopoisk_my_posts', JSON.stringify(myPosts));
      } catch (e) {}

      alert('Объявление успешно удалено.');
      return true;
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert('Не удалось удалить объявление: ' + err.message);
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
            <strong>Внимание:</strong> База данных Supabase не подключена или таблицы не созданы. 
            Пожалуйста, запустите SQL-скрипт из файла <code>supabase_setup.sql</code> в SQL Editor вашей панели Supabase. 
            Сейчас приложение работает во временном демонстрационном режиме.
          </span>
        </div>
      )}

      {/* Header Navigation */}
      {activeTab !== 'scan' && (
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeCount={cats.length} 
        />
      )}

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
              <span>Загрузка данных из облака...</span>
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
            {activeTab === 'dashboard' && (
              <Dashboard 
                cats={cats} 
                onScan={handleStartScan} 
                onNavigateToReport={() => setActiveTab('report')} 
                onDelete={handleDeleteCat}
              />
            )}
            
            {activeTab === 'report' && (
              <ReportForm 
                onSubmit={handleAddCat} 
                onCancel={() => setActiveTab('dashboard')} 
              />
            )}
            
            {activeTab === 'scan' && targetCatForScan && (
              <AIScanner 
                targetCat={targetCatForScan} 
                cats={cats} 
                onClose={() => {
                  setActiveTab('dashboard');
                  setTargetCatForScan(null);
                }} 
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--card-border)',
        padding: '24px 0',
        marginTop: 'auto',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        background: 'rgba(10, 15, 30, 0.3)',
        textAlign: 'center'
      }}>
        <div className="container">
          <p>© 2026 КотоПоиск Алматы. Сделано с заботой о питомцах.</p>
        </div>
      </footer>
    </div>
  );
}
