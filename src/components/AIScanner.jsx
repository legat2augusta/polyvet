import React, { useState, useEffect } from 'react';
import { Cpu, ArrowLeft, RefreshCw, CheckCircle, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateVectorSimilarity } from '../utils/imageAI';
import { getTranslation } from '../utils/translations';
import { logEvent } from '../supabaseClient';

const COLOR_KEYS = {
  'Рыжий': 'colorGinger',
  'Черный': 'colorBlack',
  'Белый': 'colorWhite',
  'Серый': 'colorGrey',
  'Трехцветный': 'colorCalico',
  'Сиамский': 'colorSiamese',
  'Полосатый': 'colorTabby',
  'Двухцветный': 'colorBicolor'
};

const DISTRICT_KEYS = {
  'Бостандыкский': 'districtBostandyk',
  'Медеуский': 'districtMedeu',
  'Алмалинский': 'districtAlmaly',
  'Ауэзовский': 'districtAuezov',
  'Алатауский': 'districtAlatau',
  'Жетысуский': 'districtZhetysu',
  'Турксибский': 'districtTurksib',
  'Наурызбайский': 'districtNauryzbai'
};

const TAG_KEYS = {
  kitten: 'tagKitten',
  adult: 'tagAdult',
  senior: 'tagSenior',
  collar: 'tagCollar',
  injured: 'tagInjured',
  scared: 'tagScared',
  friendly: 'tagFriendly',
  home: 'tagHome',
  oddeyes: 'tagOddEyes',
  neutered: 'tagNeutered',
  longhair: 'tagLongHair',
  shorthair: 'tagShortHair'
};

export default function AIScanner({ targetCat, cats, onClose, lang }) {
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
      { text: getTranslation('scanLogInit', lang), delay: 800, photoIndex: 0 },
      { text: getTranslation('scanLogFaceDetection', lang).replace('{faceConfidence}', faceConfidence), delay: 800, photoIndex: 0 }
    ];

    // If confidence is low, inject warning log
    if (faceConfidence < 60) {
      dynamicSteps.push({ 
        text: getTranslation('scanLogFaceWarning', lang), 
        delay: 1500,
        isWarning: true,
        photoIndex: 0
      });
    }

    const localizedColor = COLOR_KEYS[targetCat.color] ? getTranslation(COLOR_KEYS[targetCat.color], lang) : targetCat.color;
    dynamicSteps.push(
      { text: getTranslation('scanLogColor', lang).replace('{color}', localizedColor), delay: 1000, photoIndex: 0 }
    );

    // If there are multiple photos, add steps to scan them dynamically
    if (targetPhotos.length > 1) {
      dynamicSteps.push({
        text: getTranslation('scanLogPhoto2', lang),
        delay: 1000,
        photoIndex: 1
      });
    }
    if (targetPhotos.length > 2) {
      dynamicSteps.push({
        text: getTranslation('scanLogPhoto3', lang),
        delay: 1000,
        photoIndex: 2
      });
    }

    if (targetPhotos.length > 1) {
      dynamicSteps.push({
        text: getTranslation('scanLogFusion', lang).replace('{count}', targetPhotos.length),
        delay: 1000,
        photoIndex: 0
      });
    }

    const localizedDistrict = DISTRICT_KEYS[targetCat.district] ? getTranslation(DISTRICT_KEYS[targetCat.district], lang) : targetCat.district;
    dynamicSteps.push(
      { text: getTranslation('scanLogExtract', lang), delay: 900 },
      { text: getTranslation('scanLogGeo', lang).replace('{district}', localizedDistrict), delay: 800 },
      { text: getTranslation('scanLogCosine', lang), delay: 700 },
      { text: getTranslation('scanLogComplete', lang), delay: 500 }
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
      
      // Calculate tag match adjustments
      const targetTags = targetCat.tags || [];
      const candidateTags = cat.tags || [];
      
      // 1. Add +8 points per matching tag
      const matchingTags = targetTags.filter(t => candidateTags.includes(t));
      const tagBonus = matchingTags.length * 8;
      score += tagBonus;
      
      // 2. Heavy penalty for age conflicts (-35 points)
      const targetAge = targetTags.find(t => ['kitten', 'adult', 'senior'].includes(t));
      const candidateAge = candidateTags.find(t => ['kitten', 'adult', 'senior'].includes(t));
      
      if (targetAge && candidateAge && targetAge !== candidateAge) {
        score -= 35;
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
    logEvent('ai_scan', 'scan', {
      target_id: targetCat.id,
      breed: targetCat.breed,
      status: targetCat.status,
      match_count: relevantMatches.length,
      highest_score: relevantMatches.length > 0 ? relevantMatches[0].matchScore : 0
    });
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
          <ArrowLeft size={16} /> {getTranslation('scanBackBtn', lang)}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--scan-accent)' }}>
          <Cpu size={20} className={isScanning ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{getTranslation('scanTitle', lang)}</span>
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
          <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>{getTranslation('scanTargetTitle', lang)}</h3>
          
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
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                {targetCat.breed === 'Беспородная' || !targetCat.breed ? getTranslation('cardBreedDefault', lang) : targetCat.breed}
              </strong>
              <span className={`badge ${targetCat.status === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                {targetCat.status === 'lost' ? getTranslation('statusLost', lang) : getTranslation('statusFound', lang)}
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <strong>{getTranslation('labelColor', lang)}</strong> {COLOR_KEYS[targetCat.color] ? getTranslation(COLOR_KEYS[targetCat.color], lang) : targetCat.color}
            </p>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <strong>{getTranslation('labelDistrict', lang)}</strong> {DISTRICT_KEYS[targetCat.district] ? getTranslation(DISTRICT_KEYS[targetCat.district], lang) : targetCat.district} {getTranslation('cardDistrict', lang)}
            </p>
            {targetPhotos.length > 1 && (
              <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--scan-accent)' }}>
                <strong>{getTranslation('labelAngles', lang)}</strong> {targetPhotos.length}
              </p>
            )}
            
            {/* Target Cat Tags */}
            {targetCat.tags && targetCat.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '12px' }}>
                {targetCat.tags.map(tagId => {
                  const tagKey = TAG_KEYS[tagId];
                  if (!tagKey) return null;
                  return (
                    <span 
                      key={tagId} 
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.05)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        color: '#ffedd5'
                      }}
                    >
                      {getTranslation(tagKey, lang)}
                    </span>
                  );
                })}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
              {targetCat.description || getTranslation('descNotSpecified', lang)}
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
              <span>{isScanning ? getTranslation('statusScanning', lang) : getTranslation('statusDone', lang)}</span>
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
                <span>{getTranslation('statusComputing', lang)}</span>
              </div>
            )}
          </div>

          {/* Matches Output */}
          {!isScanning && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="var(--scan-accent)" />
                {getTranslation('scanResultsTitle', lang)}
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
                              <h4 style={{ fontSize: '1.1rem' }}>
                                {match.breed === 'Беспородная' || !match.breed ? getTranslation('cardBreedDefault', lang) : match.breed}
                              </h4>
                              <span style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 'bold', 
                                color: scoreColor, 
                                background: `rgba(255,255,255,0.02)`,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${scoreColor}40`
                              }}>
                                {match.matchScore}% {getTranslation('matchSuffix', lang)}
                              </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              <strong>{getTranslation('labelColor', lang)}</strong> {COLOR_KEYS[match.color] ? getTranslation(COLOR_KEYS[match.color], lang) : match.color} • <strong>{getTranslation('labelDistrict', lang)}</strong> {DISTRICT_KEYS[match.district] ? getTranslation(DISTRICT_KEYS[match.district], lang) : match.district} {getTranslation('cardDistrict', lang)}
                            </p>
                            
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', alignItems: 'center' }}>
                              <span className={`badge ${match.status === 'lost' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.65rem' }}>
                                {match.status === 'lost' ? getTranslation('statusLost', lang) : getTranslation('statusFound', lang)}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>{getTranslation('labelDate', lang)} {match.date}</span>
                            </div>

                            {/* Candidate Cat Tags with match highlighting */}
                            {match.tags && match.tags.length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {match.tags.map(tagId => {
                                  const tagKey = TAG_KEYS[tagId];
                                  if (!tagKey) return null;
                                  const isMatching = (targetCat.tags || []).includes(tagId);
                                  return (
                                    <span 
                                      key={tagId} 
                                      style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        background: isMatching ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.05)',
                                        border: `1px solid ${isMatching ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.15)'}`,
                                        color: isMatching ? '#34d399' : '#ffedd5',
                                        fontWeight: isMatching ? 600 : 'normal'
                                      }}
                                    >
                                      {getTranslation(tagKey, lang)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
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
                            <strong>{getTranslation('labelAuthor', lang)}</strong> {match.contact_name || match.contactName || 'Аноним'} • <span style={{ color: 'var(--text-muted)' }}>{match.contact_phone || match.contactPhone}</span>
                          </div>
                          
                          <a 
                            href={`https://wa.me/${(match.contact_phone || match.contactPhone).replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-primary" 
                            style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '8px', gap: '4px' }}
                          >
                            <Phone size={14} /> {getTranslation('scanWriteBtn', lang)}
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {getTranslation('scanNoResults', lang)}
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
