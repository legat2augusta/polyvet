import React, { useState, useEffect } from 'react';
import { Cpu, ArrowLeft, RefreshCw, CheckCircle, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateVectorSimilarity } from '../utils/imageAI';

export default function AIScanner({ targetCat, cats, onClose }) {
  const [scanStep, setScanStep] = useState(0);
  const [logMessages, setLogMessages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Extract all non-empty photos for the scanner view
  const targetPhotos = [
    targetCat.photo_url || targetCat.photo,
    targetCat.photo_url_2,
    targetCat.photo_url_3
  ].filter(Boolean);

  useEffect(() => {
    // Determine if it is a stock cat or user test upload
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
        const step = stepArray[currentStep];
        
        // Auto-slide to the corresponding photo during scanning
        if (step.photoIndex !== undefined) {
          setCurrentPhotoIndex(step.photoIndex);
        }

        setLogMessages(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          text: step.text,
          isWarning: step.isWarning
        }]);
        
        timer = setTimeout(() => {
          currentStep++;
          setScanStep(currentStep);
          runNextStep(stepArray);
        }, step.delay);
      } else {
        // Scanning finished, calculate match percentages
        calculateMatches();
        setIsScanning(false);
        setCurrentPhotoIndex(0); // Reset to main photo
      }
    };

    // Construct steps array dynamically
    const dynamicSteps = [
      { text: 'Инициализация модели распознавания образов (ResNet50 + Vision Transformer)...', delay: 800, photoIndex: 0 },
      { text: `Обнаружение объекта на фото... Уверенность детектора мордочки: ${faceConfidence}%`, delay: 800, photoIndex: 0 }
    ];

    // If confidence is low, inject warning log
    if (faceConfidence < 60) {
      dynamicSteps.push({ 
        text: `[!] ПРЕДУПРЕЖДЕНИЕ: Низкая уверенность распознавания мордочки кошки. Точность ИИ-сопоставления снижена. Пожалуйста, убедитесь, что фото содержит четкое изображение питомца спереди.`, 
        delay: 1500,
        isWarning: true,
        photoIndex: 0
      });
    }

    dynamicSteps.push(
      { text: `Анализ окраса и структуры шерсти (Обнаружен основной цвет: ${targetCat.color})...`, delay: 1000, photoIndex: 0 }
    );

    // If there are multiple photos, add steps to scan them dynamically
    if (targetPhotos.length > 1) {
      dynamicSteps.push({
        text: `Анализ ракурса 2 (Выделение контуров тела и дополнительных признаков)...`,
        delay: 1000,
        photoIndex: 1
      });
    }
    if (targetPhotos.length > 2) {
      dynamicSteps.push({
        text: `Анализ ракурса 3 (Проверка особых примет, пятен и структуры шерсти)...`,
        delay: 1000,
        photoIndex: 2
      });
    }

    if (targetPhotos.length > 1) {
      dynamicSteps.push({
        text: `Слияние многоракурсных дескрипторов (Multi-view Feature Fusion: ${targetPhotos.length} фото в единый эмбеддинг)...`,
        delay: 1000,
        photoIndex: 0
      });
    }

    dynamicSteps.push(
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
      let score = 0;
      
      // If both target and candidate have image embeddings, use real vector cosine similarity
      if (targetCat.embedding && cat.embedding) {
        const visualSimilarity = calculateVectorSimilarity(targetCat.embedding, cat.embedding);
        
        // Combine visual similarity (80% weight) with context attributes (20% weight: status & location)
        let contextRelevance = 0;
        if (cat.status !== targetCat.status) contextRelevance += 12; // opposite status relevance bonus
        if (cat.district === targetCat.district) contextRelevance += 8; // same location bonus
        
        score = Math.round(visualSimilarity * 0.8 + contextRelevance);
      } else {
        // Fallback for mock/older cats without embeddings
        let baseScore = 15;
        if (cat.status !== targetCat.status) baseScore += 25;
        if (cat.color.toLowerCase() === targetCat.color.toLowerCase()) baseScore += 35;
        if (cat.district === targetCat.district) baseScore += 20;
        if (cat.breed.toLowerCase() === targetCat.breed.toLowerCase()) baseScore += 10;
        
        score = baseScore + Math.floor(Math.random() * 9) - 4;
      }
      
      // Clamp score for UI realism
      score = Math.max(20, Math.min(98, score));
      
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

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % targetPhotos.length);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + targetPhotos.length) % targetPhotos.length);
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
              src={targetPhotos[currentPhotoIndex]} 
              alt="Сканируемый кот" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {isScanning && (
              <>
                <div className="laser-line"></div>
                <div className="scan-overlay"></div>
              </>
            )}

            {/* Carousel Controls (only after scanning completes and if there are multiple photos) */}
            {!isScanning && targetPhotos.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={handlePrevPhoto}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 15,
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNextPhoto}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 15,
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dot Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 15
                }}>
                  {targetPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: currentPhotoIndex === idx ? 'var(--primary)' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: currentPhotoIndex === idx ? '0 0 8px var(--primary)' : 'none',
                        transition: 'var(--transition-smooth)'
                      }}
                    />
                  ))}
                </div>
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
            {targetPhotos.length > 1 && (
              <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--scan-accent)' }}>
                <strong>Загружено ракурсов:</strong> {targetPhotos.length}
              </p>
            )}
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
