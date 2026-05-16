'use client';
import React, { useState } from 'react';

export default function EnrollDropdown({ text }: { text: string }): React.ReactElement {
  const [country, setCountry] = useState('');
  const [error, setError] = useState(false);

  const handleGo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!country) {
      setError(true);
      return;
    }

    setError(false);
    window.open(`https://bitverseacademy.com/country/${country === 'other' ? 'nepal' : country}`, '_blank', 'noopener,noreferrer');
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    if (e.target.value) {
      setError(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
      <div 
        className="enroll-container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px', 
          background: '#f8fafc', 
          padding: '4px 6px', 
          borderRadius: '8px',
          border: error ? '1px solid #ef4444' : '1px solid #e2e8f0',
          transition: 'all 0.2s ease'
          
        }}
      >
        <select 
          className="form-select" 
          value={country} 
          onChange={handleSelectChange}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '14px',
            fontWeight: '500',
            color: country ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            paddingRight: '20px',
            height: '38px'
          }}
        >
          <option value="" disabled>Select your country</option>
          <option value="japan">Japan</option>
          {/* <option value="india">India</option> */}
          <option value="canada">Canada</option>
          <option value="australia">Australia</option>
          <option value="uk">United Kingdom</option>
          <option value="usa">United States</option>
          <option value="south-korea">South Korea</option>
          <option value="nepal">Nepal</option>
          <option value="other">Others</option>
        </select>

        <button
          className="btn btn-primary lp-cta-nav"
          onClick={handleGo}
          style={{
            height: '38px',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {text}
        </button>
      </div>

      {/* Professional Inline Hint */}
      {error && (
        <span style={{ 
          color: '#ef4444', 
          fontSize: '12px', 
          fontWeight: '500',
          position: 'absolute',
          bottom: '-20px',
          left: '6px'
        }}>
          Please select a country to proceed.
        </span>
      )}
    </div>
  );
}