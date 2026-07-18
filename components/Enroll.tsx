'use client';
import React, { useState } from 'react';

interface IEnrollDropdownProps {
  text: string;
}

export function EnrollDropdown({ text }: IEnrollDropdownProps): React.ReactElement {
  const [country, setCountry] = useState('');
  const [error, setError] = useState(false);

  const handleGo = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();

    if (!country) {
      setError(true);
      return;
    }

    setError(false);
    window.open(
      `https://bitverseacademy.com/country/${country === 'other' ? 'nepal' : country}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setCountry(e.target.value);
    if (e.target.value) {
      setError(false);
    }
  };

  return (
    <div className="enroll-wrap">
      <div className={`enroll-container${error ? ' enroll-container--error' : ''}`}>
        <select className="enroll-select" value={country} onChange={handleSelectChange} aria-label="Select country">
          <option value="" disabled>
            Select country
          </option>
          <option value="japan">Japan</option>
          <option value="canada">Canada</option>
          <option value="australia">Australia</option>
          <option value="uk">United Kingdom</option>
          <option value="usa">United States</option>
          <option value="south-korea">South Korea</option>
          <option value="nepal">Nepal</option>
          <option value="other">Others</option>
        </select>

        <button type="button" className="btn btn-primary enroll-go-btn" onClick={handleGo}>
          {text}
        </button>
      </div>

      {error ? <span className="enroll-error">Please select a country to proceed.</span> : null}
    </div>
  );
}
