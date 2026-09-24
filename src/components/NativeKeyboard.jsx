import React, { useState } from 'react';
import { Delete, X, Space, ChevronDown, Globe } from 'lucide-react';
import { LANGUAGES } from '../utils/languageConfig';

export default function NativeKeyboard({ 
  languageCode = 'hi', 
  onKeyPress, 
  onBackspace, 
  onSpace, 
  onClear, 
  onClose,
  onChangeLanguage 
}) {
  const [activeTab, setActiveTab] = useState('consonants'); // 'vowels' | 'consonants' | 'matras' | 'numerals'
  const langConfig = LANGUAGES[languageCode] || LANGUAGES.hi;
  const keyboard = langConfig.keyboard;

  return (
    <div 
      className="animate-slideUp"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF, #F8FAFC)',
        borderTop: '2px solid var(--c-primary)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        padding: '10px 12px 16px',
        zIndex: 45,
        userSelect: 'none'
      }}
    >
      {/* Keyboard Header / Category Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 6
      }}>
        {/* Language selector in keyboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--c-primary)' }}>
            ⌨️ {langConfig.nativeName} ({langConfig.label})
          </span>
          {onChangeLanguage && (
            <select
              value={languageCode}
              onChange={(e) => onChangeLanguage(e.target.value)}
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: 8,
                padding: '3px 6px',
                border: '1px solid var(--c-border)',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              {Object.values(LANGUAGES).map(l => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.label})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Close / Minimize Button */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--c-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          <span>Hide</span>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Category selector pills */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 10,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'consonants', label: 'व्यंजन / Consonants', list: keyboard.consonants },
          { id: 'vowels',     label: 'स्वर / Vowels',       list: keyboard.vowels },
          { id: 'matras',     label: 'मात्रा / Marks',      list: keyboard.matras },
          { id: 'numerals',   label: 'अंक / 123',          list: keyboard.numerals },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 99,
              fontSize: '0.76rem',
              fontWeight: 700,
              border: `1.5px solid ${activeTab === tab.id ? 'var(--c-primary)' : 'var(--c-border)'}`,
              background: activeTab === tab.id ? 'var(--c-primary)' : '#FFF',
              color: activeTab === tab.id ? '#FFF' : 'var(--c-text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Virtual Key Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
        gap: 5,
        maxHeight: 140,
        overflowY: 'auto',
        padding: '2px',
        marginBottom: 10
      }}>
        {(keyboard[activeTab] || []).map((char, idx) => (
          <button
            key={idx}
            onClick={() => onKeyPress(char)}
            style={{
              minHeight: 40,
              borderRadius: 10,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: 'var(--c-text)',
              fontSize: '1.18rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.1s ease',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Bottom Function Bar (Space, Backspace, Clear) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <button
          onClick={onSpace}
          style={{
            minHeight: 40,
            borderRadius: 12,
            background: 'var(--c-surface)',
            border: '1.5px solid var(--c-border)',
            fontWeight: 700,
            fontSize: '0.84rem',
            color: 'var(--c-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <Space size={16} /> Space
        </button>

        <button
          onClick={onBackspace}
          style={{
            minHeight: 40,
            borderRadius: 12,
            background: '#FEE2E2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <Delete size={16} /> ⌫
        </button>

        <button
          onClick={onClear}
          style={{
            minHeight: 40,
            borderRadius: 12,
            background: '#F1F5F9',
            border: '1.5px solid #CBD5E1',
            color: 'var(--c-muted)',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
