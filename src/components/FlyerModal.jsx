import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download, MessageSquare, Copy, Check, Send } from 'lucide-react';
import { getTranslation, translations } from '../utils/translations';

// Helper function to wrap long description text inside canvas (defined outside component)
const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) {
        // Add ellipsis if truncated
        ctx.fillText(line.substring(0, 20) + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
};

export default function FlyerModal({ cat, onClose, lang }) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const catImageRef = useRef(null);
  const qrImageRef = useRef(null);

  const isLost = cat?.status === 'lost';
  const statusTextRu = isLost ? 'ПРОПАЛ' : 'НАЙДЕН';
  const statusTextKk = isLost ? 'ЖОҒАЛДЫ' : 'ТАБЫЛДЫ';
  const statusText = lang === 'kk' ? statusTextKk : statusTextRu;

  // Generate share link
  const shareUrl = cat ? `${window.location.origin}?ad=${cat.id}` : '';
  
  // Format share message
  const getShareText = useCallback(() => {
    if (!cat) return '';
    const template = getTranslation('flyerShareTextTemplate', lang);
    const districtText = getTranslation(`district${cat.district.replace('ский', '')}`, lang) || cat.district;
    return template
      .replace('{statusText}', statusText.toLowerCase())
      .replace('{breed}', cat.breed || getTranslation('cardBreedDefault', lang))
      .replace('{district}', districtText)
      .replace('{url}', shareUrl);
  }, [cat, lang, statusText, shareUrl]);

  const generateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cat) return;

    const ctx = canvas.getContext('2d');
    
    // Set high-res canvas dimensions (800 x 1200)
    canvas.width = 800;
    canvas.height = 1200;

    // 1. Draw Gradient Background (Deep Dark Theme)
    const grad = ctx.createLinearGradient(0, 0, 0, 1200);
    grad.addColorStop(0, '#111026'); // Very deep purple
    grad.addColorStop(0.5, '#0c0b1a');
    grad.addColorStop(1, '#05040d');   // Dark near-black
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1200);

    // 2. Draw Decorative Border Frame (Glowing Neon Orange/Cyan)
    const frameColor = isLost ? '#f97316' : '#06b6d4'; // Orange or Cyan
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 1160);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 744, 1144);

    // 3. Header Text: Project Brand
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '800 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KOTOPOISK.KZ • АЛМАТЫ', 400, 65);

    // 4. Status Title (Big Bold Header)
    ctx.fillStyle = frameColor;
    ctx.font = '900 56px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, 400, 130);

    // 5. Draw Cat Photo with Rounded Rect Clip
    const imgX = 80;
    const imgY = 175;
    const imgW = 640;
    const imgH = 480;

    ctx.save();
    // Rounded corners for photo frame
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(imgX + radius, imgY);
    ctx.lineTo(imgX + imgW - radius, imgY);
    ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + radius);
    ctx.lineTo(imgX + imgW, imgY + imgH - radius);
    ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - radius, imgY + imgH);
    ctx.lineTo(imgX + radius, imgY + imgH);
    ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - radius);
    ctx.lineTo(imgX, imgY + radius);
    ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
    ctx.closePath();
    ctx.clip();

    if (catImageRef.current && catImageRef.current.complete && catImageRef.current.naturalWidth > 0) {
      // Draw image with Cover scaling
      const img = catImageRef.current;
      const imgRatio = img.width / img.height;
      const canvasRatio = imgW / imgH;
      let sx, sy, sw, sh;

      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sh = img.height;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / canvasRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
    } else {
      // Fallback gray background with cat silhouette icon
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(imgX, imgY, imgW, imgH);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '100px system-ui';
      ctx.fillText('🐱', imgX + imgW/2, imgY + imgH/2 + 30);
    }
    ctx.restore();

    // Border around photo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // 6. Draw Cat Information Details
    const textStartY = 710;
    const labelX = 80;
    const valueX = 260;
    const rowHeight = 48;

    const breedVal = cat.breed || getTranslation('cardBreedDefault', lang);
    const colorVal = getTranslation(`color${Object.keys(translations.ru).find(k => translations.ru[k] === cat.color)?.replace('color', '')}`, lang) || cat.color;
    const districtVal = (getTranslation(`district${cat.district.replace('ский', '')}`, lang) || cat.district) + ' ' + getTranslation('cardDistrict', lang);
    const dateVal = new Date(cat.date).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU');
    const contactVal = cat.status === 'reunited' ? getTranslation('adminTableHiddenReunited', lang) : `${cat.contact_name} (${cat.contact_phone})`;

    const details = [
      { label: getTranslation('flyerLabelBreed', lang), val: breedVal },
      { label: getTranslation('flyerLabelColor', lang), val: colorVal },
      { label: getTranslation('flyerLabelDistrict', lang), val: districtVal },
      { label: getTranslation('flyerLabelDate', lang), val: dateVal },
      { label: getTranslation('flyerLabelContact', lang), val: contactVal }
    ];

    details.forEach((item, index) => {
      const y = textStartY + (index * rowHeight);

      // Label (Gray/Muted)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, labelX, y);

      // Value (White)
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.val, valueX, y);
    });

    // Special description notes (wrapped text)
    const descY = textStartY + (details.length * rowHeight) + 10;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(getTranslation('flyerLabelDesc', lang), labelX, descY);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 500 22px system-ui, -apple-system, sans-serif';
    
    // Draw wrapped description
    const descText = cat.description || getTranslation('descNotSpecified', lang);
    wrapText(ctx, descText, labelX + 130, descY, 510, 32, 2);

    // 7. Footer Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 1000);
    ctx.lineTo(720, 1000);
    ctx.stroke();

    // 8. Help Message on bottom-left
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(getTranslation('flyerHelpMessage', lang), 80, 1060);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(getTranslation('flyerQRDesc', lang), 80, 1100);

    // 9. Draw QR Code on bottom-right
    if (qrImageRef.current && qrImageRef.current.complete) {
      const qrSize = 130;
      const qrX = 590;
      const qrY = 1030;
      ctx.drawImage(qrImageRef.current, qrX, qrY, qrSize, qrSize);
      
      // QR frame border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
    }
  }, [cat, lang, isLost, statusText]);

  useEffect(() => {
    if (!cat) return;

    const catImgUrl = cat.photo_url || cat.photo;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ffffff&bgcolor=1e1b4b&data=${encodeURIComponent(shareUrl)}`;

    let catLoaded = false;
    let qrLoaded = false;

    const catImg = new Image();
    // Enable cross-origin for external images to prevent tainted canvas
    if (catImgUrl && catImgUrl.startsWith('http')) {
      catImg.crossOrigin = 'anonymous';
    }
    catImg.src = catImgUrl || '';

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrImgUrl;

    const checkReady = () => {
      if (catLoaded && qrLoaded) {
        catImageRef.current = catImg;
        qrImageRef.current = qrImg;
        generateCanvas();
        setLoading(false);
      }
    };

    catImg.onload = () => {
      catLoaded = true;
      checkReady();
    };
    catImg.onerror = () => {
      console.warn('Failed to load cat image for flyer, using fallback');
      catLoaded = true; // Proceed with fallback drawing
      checkReady();
    };

    qrImg.onload = () => {
      qrLoaded = true;
      checkReady();
    };
    qrImg.onerror = () => {
      console.warn('Failed to load QR code for flyer');
      qrLoaded = true; // Proceed without QR code
      checkReady();
    };

    return () => {
      catImg.onload = null;
      catImg.onerror = null;
      qrImg.onload = null;
      qrImg.onerror = null;
    };
  }, [cat, shareUrl, generateCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cat) return;

    // Convert canvas to PNG blob/URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Trigger download
    const link = document.createElement('a');
    link.download = `kotopoisk_cat_${cat.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    if (!cat) return;
    try {
      const fullText = `${getShareText()}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy text:', err);
      // Fallback
      alert('Не удалось скопировать. Пожалуйста, скопируйте ссылку вручную: ' + shareUrl);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  if (!cat) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(5, 5, 13, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        background: 'rgba(30, 27, 75, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <X size={18} />
        </button>

        <h3 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '800', 
          color: '#fff', 
          marginBottom: '20px', 
          textAlign: 'center',
          background: 'linear-gradient(90deg, #fff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {getTranslation('flyerModalTitle', lang)}
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          overflowY: 'auto'
        }}>
          {/* Hidden Canvas for PNG Compilation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Interactive Layout (Split Preview & Share options) */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '24px',
            justifyContent: 'center'
          }}>
            
            {/* Visual Preview Block */}
            <div style={{
              width: '320px',
              height: '480px',
              borderRadius: '16px',
              border: `2px solid ${isLost ? 'var(--primary)' : '#06b6d4'}`,
              background: 'linear-gradient(180deg, #111026 0%, #05040d 100%)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ fontSize: '7px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontWeight: '800', marginBottom: '4px' }}>
                KOTOPOISK.KZ • АЛМАТЫ
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '900', 
                color: isLost ? 'var(--primary)' : '#06b6d4', 
                textAlign: 'center', 
                marginBottom: '10px' 
              }}>
                {statusText}
              </div>

              {/* Photo Area */}
              <div style={{ 
                width: '100%', 
                height: '190px', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <img 
                  src={cat.photo_url || cat.photo} 
                  alt={cat.breed}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Details List */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex' }}><span style={{ color: '#94a3b8', width: '80px', fontWeight: 'bold' }}>{getTranslation('flyerLabelBreed', lang)}</span> <span style={{ color: '#fff' }}>{cat.breed || getTranslation('cardBreedDefault', lang)}</span></div>
                <div style={{ display: 'flex' }}><span style={{ color: '#94a3b8', width: '80px', fontWeight: 'bold' }}>{getTranslation('flyerLabelColor', lang)}</span> <span style={{ color: '#fff' }}>{cat.color}</span></div>
                <div style={{ display: 'flex' }}><span style={{ color: '#94a3b8', width: '80px', fontWeight: 'bold' }}>{getTranslation('flyerLabelDistrict', lang)}</span> <span style={{ color: '#fff' }}>{cat.district}</span></div>
                <div style={{ display: 'flex' }}><span style={{ color: '#94a3b8', width: '80px', fontWeight: 'bold' }}>{getTranslation('flyerLabelDate', lang)}</span> <span style={{ color: '#fff' }}>{new Date(cat.date).toLocaleDateString()}</span></div>
                <div style={{ display: 'flex' }}><span style={{ color: '#94a3b8', width: '80px', fontWeight: 'bold' }}>{getTranslation('flyerLabelContact', lang)}</span> <span style={{ color: '#fff', fontWeight: '600' }}>{cat.status === 'reunited' ? getTranslation('adminTableHiddenReunited', lang) : cat.contact_name}</span></div>
              </div>

              {/* Footer Panel */}
              <div style={{
                marginTop: 'auto',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '8px', fontWeight: '800', color: '#e2e8f0' }}>{getTranslation('flyerHelpMessage', lang)}</div>
                  <div style={{ fontSize: '7px', color: '#94a3b8' }}>{getTranslation('flyerQRDesc', lang)}</div>
                </div>
                {/* Simulated QR Code */}
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  background: '#1e1b4b',
                  border: '1px solid #fff', 
                  padding: '2px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '2px'
                }}>
                  <div style={{ width: '100%', height: '100%', background: '#fff', opacity: 0.85 }} />
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div style={{
              flex: '1',
              minWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              justifyContent: 'center'
            }}>
              
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                {lang === 'kk' 
                  ? 'Хабарландырудың дайын листовкасын телефоныңызға жүктеп алып, оны басып шығаруға немесе оны әлеуметтік желілерде бөлісуге болады.'
                  : 'Вы можете скачать готовую листовку-постер в высоком качестве, чтобы распечатать её для расклейки или опубликовать в социальных сетях/чатах.'}
              </p>

              {/* 1. Download PNG button */}
              <button 
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <Download size={18} />
                {loading ? (lang === 'kk' ? 'Дайындалуда...' : 'Подготовка...') : getTranslation('flyerDownloadBtn', lang)}
              </button>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />

              {/* 2. Copy Link & Text template button */}
              <button 
                className="btn btn-secondary"
                onClick={handleCopyLink}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {copied ? <Check size={18} color="#22c55e" /> : <Copy size={18} />}
                {copied ? getTranslation('flyerCopiedAlert', lang) : getTranslation('flyerCopyLinkBtn', lang)}
              </button>

              {/* Social networks quick sharing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* WhatsApp */}
                <button 
                  onClick={shareWhatsApp}
                  style={{
                    background: '#128c7e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#075e54'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#128c7e'}
                >
                  <MessageSquare size={16} fill="#fff" />
                  WhatsApp
                </button>

                {/* Telegram */}
                <button 
                  onClick={shareTelegram}
                  style={{
                    background: '#0088cc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#006699'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#0088cc'}
                >
                  <Send size={16} fill="#fff" />
                  Telegram
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
