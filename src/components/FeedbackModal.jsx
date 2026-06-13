import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getTranslation } from '../utils/translations';

export default function FeedbackModal({ lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('suggestion');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('feedback')
        .insert([{
          name: name.trim() || null,
          contact: contact.trim() || null,
          message: message.trim(),
          type,
          status: 'new'
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      setName('');
      setContact('');
      setMessage('');
      setType('suggestion');
      
      // Auto close modal after 2.5 seconds on success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2500);

    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(getTranslation('feedbackError', lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '12px 18px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="feedback-fab"
        title={getTranslation('feedbackBtn', lang)}
      >
        <MessageSquare size={18} />
        <span>{getTranslation('feedbackBtn', lang)}</span>
      </button>

      {/* Styles for hover and animation */}
      <style>{`
        .feedback-fab:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 30px rgba(249, 115, 22, 0.5), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .feedback-fab:active {
          transform: translateY(0) scale(0.98);
        }
        .feedback-overlay {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .feedback-card {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="feedback-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(5, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="feedback-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#0c0f1d',
              border: '1px solid rgba(249, 115, 22, 0.15)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(249, 115, 22, 0.05)',
              color: '#f3f4f6',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '14px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MessageSquare size={20} style={{ color: '#f97316' }} />
                {getTranslation('feedbackTitle', lang)}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <X size={16} />
              </button>
            </div>

            {success ? (
              /* Success View */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 10px',
                textAlign: 'center',
                gap: '16px'
              }}>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  padding: '16px',
                  borderRadius: '50%',
                  color: '#22c55e',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <CheckCircle2 size={48} />
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  {getTranslation('feedbackSuccess', lang)}
                </h4>
              </div>
            ) : (
              /* Form View */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#f87171',
                    fontSize: '13px'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Type Selection */}
                <div className="input-group">
                  <span className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '13px', color: '#9ca3af' }}>
                    {getTranslation('feedbackTypeLabel', lang)}
                  </span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="form-select"
                    style={{ width: '100%', padding: '10px 14px' }}
                  >
                    <option value="suggestion">{getTranslation('feedbackTypeSuggestion', lang)}</option>
                    <option value="bug">{getTranslation('feedbackTypeBug', lang)}</option>
                    <option value="contact">{getTranslation('feedbackTypeContact', lang)}</option>
                  </select>
                </div>

                {/* Name */}
                <div className="input-group">
                  <span className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '13px', color: '#9ca3af' }}>
                    {getTranslation('feedbackNameLabel', lang)}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={getTranslation('formContactNamePlaceholder', lang)}
                    className="form-input"
                    disabled={submitting}
                  />
                </div>

                {/* Contact */}
                <div className="input-group">
                  <span className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '13px', color: '#9ca3af' }}>
                    {getTranslation('feedbackContactLabel', lang)}
                  </span>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={getTranslation('feedbackContactPlaceholder', lang)}
                    className="form-input"
                    disabled={submitting}
                  />
                </div>

                {/* Message */}
                <div className="input-group">
                  <span className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '13px', color: '#9ca3af' }}>
                    {getTranslation('feedbackMessageLabel', lang)}
                  </span>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={getTranslation('feedbackMessagePlaceholder', lang)}
                    className="form-input"
                    style={{ resize: 'none', minHeight: '100px', lineHeight: '1.5' }}
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
                    transition: 'opacity 0.2s',
                    marginTop: '8px',
                    opacity: submitting || !message.trim() ? 0.6 : 1
                  }}
                >
                  <Send size={16} />
                  <span>{submitting ? '...' : getTranslation('feedbackSubmitBtn', lang)}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
