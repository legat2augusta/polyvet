import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import AIScanner from './components/AIScanner';

// Default mock database with realistic Almaty listings
const DEFAULT_CATS = [
  {
    id: 1,
    status: 'lost',
    breed: 'Дворняжка',
    color: 'Рыжий',
    district: 'Бостандыкский',
    date: '2026-06-10',
    description: 'Рыжий пушистый кот, глаза зеленые. Испугался шума во дворе на улице Розыбакиева (уг. Басенова) и убежал. Очень ласковый, откликается на кличку Симба.',
    contactName: 'Диана',
    contactPhone: '+7 707 111 2233',
    photo: '/assets/cats/ginger.png'
  },
  {
    id: 2,
    status: 'found',
    breed: 'Бомбейский метис',
    color: 'Черный',
    district: 'Медеуский',
    date: '2026-06-11',
    description: 'Найден черный гладкошерстный кот с яркими зелеными глазами в районе Терренкура. Был в синем ошейнике от блох. Очень ласковый, явно домашний. Ищем хозяев.',
    contactName: 'Арман',
    contactPhone: '+7 777 222 3344',
    photo: '/assets/cats/black.png'
  },
  {
    id: 3,
    status: 'lost',
    breed: 'Ангорская смесь',
    color: 'Серый',
    district: 'Ауэзовский',
    date: '2026-06-08',
    description: 'Пропал кот, бело-серая пушистая шерсть, голубые глаза, на правой задней лапе темное пятнышко. Пропал в 8-м микрорайоне. Будем благодарны за любую информацию.',
    contactName: 'Мадина',
    contactPhone: '+7 701 333 4455',
    photo: '/assets/cats/white_grey.png'
  },
  {
    id: 4,
    status: 'found',
    breed: 'Калико',
    color: 'Трехцветный',
    district: 'Алмалинский',
    date: '2026-06-12',
    description: 'Около супермаркета на Толе би - Сейфуллина найдена трехцветная кошка (черно-рыже-белая). Ручная, чистая, знает лоток. Очень скучает по хозяевам.',
    contactName: 'Ирина',
    contactPhone: '+7 747 444 5566',
    photo: '/assets/cats/calico.png'
  },
  {
    id: 5,
    status: 'lost',
    breed: 'Сиамская',
    color: 'Сиамский',
    district: 'Бостандыкский',
    date: '2026-06-09',
    description: 'Пропал сиамский кот в районе Выставки (КЦДС Атакент). Голубые глаза, темная мордочка и уши. Отзывается на имя Кокос. Пожалуйста, помогите найти!',
    contactName: 'Адиль',
    contactPhone: '+7 702 555 6677',
    photo: '/assets/cats/siamese.png'
  },
  {
    id: 6,
    status: 'found',
    breed: 'Дворняжка',
    color: 'Рыжий',
    district: 'Бостандыкский',
    date: '2026-06-12',
    description: 'В районе Жарокова - Утепова сидит на дереве рыжий крупный кот, пушистый, с белым воротником. Не спускается со вчерашнего дня. Ищем старых хозяев.',
    contactName: 'Ерлан',
    contactPhone: '+7 705 666 7788',
    photo: '/assets/cats/ginger.png'
  },
  {
    id: 7,
    status: 'lost',
    breed: 'Дворняжка',
    color: 'Черный',
    district: 'Алмалинский',
    date: '2026-06-05',
    description: 'Пропала черная кошка, полностью черная без пятен. Желто-зеленые глаза. Пропала в районе Жамбыла - Байтурсынова. Вознаграждение гарантируется.',
    contactName: 'Айгерим',
    contactPhone: '+7 708 777 8899',
    photo: '/assets/cats/black.png'
  },
  {
    id: 8,
    status: 'found',
    breed: 'Дворняжка',
    color: 'Серый',
    district: 'Медеуский',
    date: '2026-06-13',
    description: 'Прибился к подъезду на Самале-2 (возле Dostyk Plaza) пушистый серый кот с белыми лапками и грудкой. Очень ласковый, мурчит, сытый. Ждет хозяев.',
    contactName: 'Данияр',
    contactPhone: '+7 777 888 9900',
    photo: '/assets/cats/white_grey.png'
  }
];

export default function App() {
  const [cats, setCats] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetCatForScan, setTargetCatForScan] = useState(null);

  // Load database on start
  useEffect(() => {
    const savedCats = localStorage.getItem('almaty_cats_db');
    if (savedCats) {
      try {
        setCats(JSON.parse(savedCats));
      } catch (e) {
        console.error('Ошибка парсинга базы данных кошек из localStorage:', e);
        setCats(DEFAULT_CATS);
      }
    } else {
      setCats(DEFAULT_CATS);
      localStorage.setItem('almaty_cats_db', JSON.stringify(DEFAULT_CATS));
    }
  }, []);

  // Sync state to localStorage when updated
  const updateDatabase = (newCatsList) => {
    setCats(newCatsList);
    localStorage.setItem('almaty_cats_db', JSON.stringify(newCatsList));
  };

  const handleAddCat = (newCat) => {
    const updatedList = [newCat, ...cats];
    updateDatabase(updatedList);
    // Switch directly to scan mode with the newly added cat
    setTargetCatForScan(newCat);
    setActiveTab('scan');
  };

  const handleStartScan = (cat) => {
    setTargetCatForScan(cat);
    setActiveTab('scan');
  };

  const activeCount = cats.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header Navigation */}
      {activeTab !== 'scan' && (
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeCount={activeCount} 
        />
      )}

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            cats={cats} 
            onScan={handleStartScan} 
            onNavigateToReport={() => setActiveTab('report')} 
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
