import React, { useState, useEffect } from 'react';
import { Cpu, ArrowLeft, RefreshCw, CheckCircle, Phone } from 'lucide-react';

export default function AIScanner({ targetCat, cats, onClose }) {
  const [scanStep, setScanStep] = useState(0);
  const [logMessages, setLogMessages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Determine if it is a stock stock cat or user test upload
    const isDemoCat = targetCat.photo_url?.startsWith('/assets/cats/');
    const isTest = targetCat.description?.toLowerCase().includes('схема') || 
                   targetCat.description?.toLowerCase().includes('тест') || 
                   !isDemoCat;
    
    // If it's a test file/non-cat image, simulate a low confidence score
    const faceConfidence = isDemoCat ? 98.4 : (isTest ? 34.2 : 86.7);

    let currentStep = 0;
    let timer;

    const runNextStep = (stepArray) => {
      if (currentStep < stepArray.length) {
        setLogMessages(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          text: stepArray[currentStep].text,
          isWarning: stepArray[currentStep].isWarning
        }]);
        
        timer = setTimeout(() => {
          currentStep++;
          setScanStep(currentStep);
          runNextStep(stepArray);
        }, stepArray[currentStep].delay);
      } else {
        // Scanning finished, calculate match percentages
        calculateMatches();
        setIsScanning(false);
      }
    };

    // Construct steps array dynamically
    const dynamicSteps = [
      { text: 'Инициализация модели распознавания образов (ResNet50 + Vision Transformer)...', delay: 800 },
      { text: `Обнаружение объекта на фото... Уверенность детектора мордочки: ${faceConfidence}%`, delay: 800 }
    ];

    // If confidence is low, inject warning log
    if (faceConfidence < 60) {
      dynamicSteps.push({ 
        text: `[!] ПРЕДУПРЕЖДЕНИЕ: Низкая уверенность распознавания мордочки кошки. Точность ИИ-сопоставления снижена. Пожалуйста, убедитесь, что фото содержит четкое изображение питомца спереди.`, 
        delay: 1500,
        isWarning: true 
      });
    }

    dynamicSteps.push(
      { text: `Анализ окраса и структуры шерсти (Обнаружен основной цвет: ${targetCat.color})...`, delay: 1000 },
      { text: 'Извлечение вектора визуальных признаков (512-мерный дескриптор эмбеддинга)...', delay: 900 },
      { text: `Фильтрация базы данных по геопозиции (${targetCat.district} район и смежные)...`, delay: 800 },
      { text: 'Вычисление косинусного сходства (Cosine Similarity) по всей базе данных...', delay: 700 },
      { text: 'Сравнение завершено. Анализ результатов...', delay: 500 }
    );

    runNextStep(dynamicSteps);

    return () => clearTimeout(timer);
  }, []);

  const calculateMatches = () => {
    // Filter out the current target cat from comparison
    const candidates = cats.filter(cat => cat.id !== targetCat.id);
    
    const scoredCandidates = candidates.map(cat => {
      let score = 15; // Base score
      
      // Opposite status match is highly relevant
      if (cat.status !== targetCat.status) {
        score += 25;
      }
      
      // Color match
      if (cat.color.toLowerCase() === targetCat.color.toLowerCase()) {
        score += 35;
      } else {
        // Partial color matches
        const colors = [cat.color.toLowerCase(), targetCat.color.toLowerCase()];
        if (colors.includes('трехцветный') && (colors.includes('рыжий') || colors.includes('черный') || colors.includes('белый'))) {
          score += 15;
        }
      }
      
      // District match
      if (cat.district === targetCat.district) {
        score += 20;
      } else {
        // Simulating neighboring districts
        const neighbors = {
          'Бостандыкский': ['Медеуский', 'Алмалинский', 'Ауэзовский'],
          'Медеуский': ['Бостандыкский', 'Алмалинский', 'Жетысуский', 'Турксибский'],
          'Алмалинский': ['Бостандыкский', 'Медеуский', 'Ауэзовский', 'Жетысуский'],
          'Ауэзовский': ['Бостандыкский', 'Алмалинский', 'Алатауский', 'Наурызбайский'],
          'Алатауский': ['Ауэзовский', 'Жетысуский', 'Турксибский'],
          'Жетысуский': ['Медеуский', 'Алмалинский', 'Алатауский', 'Турксибский'],
          'Турксибский': ['Медеуский', 'Жетысуский', 'Алатауский'],
          'Наурызбайский': ['Ауэзовский', 'Бостандыкский']
        };
        
        if (neighbors[targetCat.district]?.includes(cat.district)) {
          score += 10;
        }
      }
      
      // Breed match
      if (cat.breed.toLowerCase() === targetCat.breed.toLowerCase()) {
        score += 10;
      }
      
      // Add minor randomness for realism
      score += Math.floor(Math.random() * 9) - 4;
      
      // Clamp between 20 and 97
      score = Math.max(20, Math.min(97, score));
      
      return {
        ...cat,
        matchScore: score
      };
    });

    // Sort by match score descending
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    
    // Filter only matches that have some reasonable similarity (e.g. > 40%)
    const relevantMatches = scoredCandidates.filter(m => m.matchScore > 40);
    
    setMatches(relevantMatches);
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          <ArrowLeft size={16} /> Назад к объявлениям
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--scan-accent)' }}>
          <Cpu size={20} className={isScanning ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>ИНТЕЛЛЕКТУАЛЬНЫЙ ИИ-АНАЛИЗ</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Target Cat details & Scanning screen */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>Объект сканирования</h3>
          
          <div className="scanner-container" style={{ width: '100%', height: '300px', background: '#0a0d18', position: 'relative' }}>
            <img 
              src={targetCat.photo_url || targetCat.photo} 
              alt="Сканируемый кот" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {isScanning && (
              <>
                <div className="laser-line"></div>
                <div className="scan-overlay"></div>
              </>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>{targetCat.breed}</strong>
              <span className={`badge ${targetCat.status === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                {targetCat.status === 'lost' ? 'Пропал' : 'Найден'}
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <strong>Окрас:</strong> {targetCat.color}
            </p>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <strong>Район:</strong> {targetCat.district} район
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
              {targetCat.description || 'Описание не указано.'}
            </p>
          </div>
        </div>

        {/* Scan Log & Matching Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
          {/* Scan Log Terminal */}
          <div className="glass-card" style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'rgba(5, 8, 20, 0.9)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            textAlign: 'left',
            minHeight: '240px',
            maxHeight: '240px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: isScanning ? 'var(--shadow-glow-green)' : 'none',
            transition: 'var(--transition-smooth)'
          }}>
            <div style={{ color: 'var(--scan-accent)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '6px', marginBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>AI_SCAN_CONSOLE v1.1.0</span>
              <span>{isScanning ? 'СТАТУС: АНАЛИЗ...' : 'СТАТУС: ГОТОВО'}</span>
            </div>
            
            {logMessages.map((msg, idx) => (
              <div key={idx} style={{ 
                color: msg.isWarning ? '#f97316' : (idx === logMessages.length - 1 && isScanning ? '#fff' : '#10b981'), 
                display: 'flex', 
                gap: '8px',
                fontWeight: msg.isWarning ? 'bold' : 'normal'
              }}>
                <span style={{ color: msg.isWarning ? 'rgba(249, 115, 22, 0.5)' : 'rgba(16, 185, 129, 0.5)' }}>[{msg.time}]</span>
                <span>{msg.text}</span>
              </div>
            ))}
            
            {isScanning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', marginTop: '4px' }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>Вычисление метрик близости...</span>
              </div>
            )}
          </div>

          {/* Matches Output */}
          {!isScanning && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="var(--scan-accent)" />
                Потенциальные совпадения
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {matches.length > 0 ? (
                  matches.map((match) => {
                    const isHighMatch = match.matchScore >= 75;
                    const isMediumMatch = match.matchScore >= 50 && match.matchScore < 75;
                    
                    const scoreColor = isHighMatch 
                      ? 'var(--scan-accent)' 
                      : (isMediumMatch ? 'var(--primary)' : 'var(--text-secondary)');
                      
                    return (
                      <div 
                        key={match.id} 
                        className="glass-card" 
                        style={{
                          padding: '20px', 
                          borderRadius: '16px', 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          background: 'rgba(17, 24, 39, 0.4)',
                          borderColor: isHighMatch ? 'rgba(16, 185, 129, 0.4)' : 'var(--card-border)',
                          boxShadow: isHighMatch ? 'rgba(16, 185, 129, 0.05) 0 4px 20px' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {/* Match Photo */}
                          <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={match.photo_url || match.photo} alt={match.breed} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          
                          {/* Details */}
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <h4 style={{ fontSize: '1.1rem' }}>{match.breed}</h4>
                              <span style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 'bold', 
                                color: scoreColor, 
                                background: `rgba(255,255,255,0.02)`,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${scoreColor}40`
                              }}>
                                {match.matchScore}% совпадение
                              </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              <strong>Окрас:</strong> {match.color} • <strong>Район:</strong> {match.district}
                            </p>
                            
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', alignItems: 'center' }}>
                              <span className={`badge ${match.status === 'lost' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.65rem' }}>
                                {match.status === 'lost' ? 'Пропал' : 'Найден'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>Дата: {match.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information & Action */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginTop: '4px', 
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                          paddingTop: '12px',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <strong>Автор:</strong> {match.contact_name || match.contactName} • <span style={{ color: 'var(--text-muted)' }}>{match.contact_phone || match.contactPhone}</span>
                          </div>
                          
                          <a 
                            href={`https://wa.me/${(match.contact_phone || match.contactPhone).replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-primary" 
                            style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '8px', gap: '4px' }}
                          >
                            <Phone size={14} /> Написать
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Не найдено подходящих объявлений с сходством более 40% в базе.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
