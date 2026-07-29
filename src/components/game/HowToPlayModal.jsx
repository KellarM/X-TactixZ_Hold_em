import React, { useState } from 'react';

const STEPS = [
  {
    step: 1,
    title: 'Step 1 Title',
    icon: '🃏',
    description: 'Step 1 description — content coming soon.',
    highlight: 'Step 1 highlight tip — content coming soon.',
  },
  {
    step: 2,
    title: 'Step 2 Title',
    icon: '🔓',
    description: 'Step 2 description — content coming soon.',
    highlight: 'Step 2 highlight tip — content coming soon.',
  },
  {
    step: 3,
    title: 'Step 3 Title',
    icon: '🌊',
    description: 'Step 3 description — content coming soon.',
    highlight: 'Step 3 highlight tip — content coming soon.',
  },
  {
    step: 4,
    title: 'Step 4 Title',
    icon: '💰',
    description: 'Step 4 description — content coming soon.',
    highlight: 'Step 4 highlight tip — content coming soon.',
  },
];

export default function HowToPlayModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else { setStep(0); onClose(); }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(20,10,0,0.98) 0%, rgba(40,20,0,0.98) 100%)',
        border: '1.5px solid rgba(234,179,8,0.5)',
        borderRadius: 18,
        padding: '28px 32px 32px',
        maxWidth: 480,
        width: '90%',
        boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(234,179,8,0.1)',
        position: 'relative',
      }}>

        {/* SKIP button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'transparent', border: 'none',
            color: 'rgba(253,224,71,0.4)', fontSize: 12,
            cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em',
          }}
        >
          SKIP ✕
        </button>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? '#eab308' : i < step ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12, lineHeight: 1 }}>
          {current.icon}
        </div>

        {/* Step label */}
        <div style={{
          textAlign: 'center', fontSize: 10, fontWeight: 800,
          color: 'rgba(234,179,8,0.6)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          STEP {current.step} OF {STEPS.length}
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center', fontSize: 22, fontWeight: 800,
          color: '#ffffff', marginBottom: 14, lineHeight: 1.2,
        }}>
          {current.title}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14, color: '#cbd5e1', lineHeight: 1.65,
          textAlign: 'center', marginBottom: 16,
        }}>
          {current.description}
        </div>

        {/* Highlight bar */}
        <div style={{
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: '#fde047', fontWeight: 700,
          textAlign: 'center', marginBottom: 28,
          lineHeight: 1.5,
        }}>
          {current.highlight}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: '10px 22px', borderRadius: 9,
                border: '1px solid rgba(234,179,8,0.35)',
                background: 'transparent',
                color: '#fde047', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '10px 28px', borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #b45309, #eab308)',
              color: '#000', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', flex: step === 0 ? 1 : 'none',
              letterSpacing: '0.04em',
            }}
          >
            {step < STEPS.length - 1 ? 'Next →' : "Let's Play!"}
          </button>
        </div>
      </div>
    </div>
  );
}
