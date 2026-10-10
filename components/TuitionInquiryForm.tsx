'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ApiCallError } from '@/lib/api';
import {
  isMultiZoneCountrySlug,
  resolveIanaTimeZoneForCountrySlug,
} from '@/lib/country-tuition-timezones';
import {
  submitTuitionInquiry,
  TUITION_DAY_OPTIONS,
  TUITION_SUBJECT_OPTIONS,
  type TTuitionDayOption,
  type TTuitionSubjectOption,
} from '@/lib/tuition-inquiry.client';

interface IConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const CONFETTI_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#facc15', '#fb923c', '#60a5fa', '#a78bfa', '#f472b6'];

function SuccessModal({ onClose }: { onClose: () => void }): ReactElement {
  const [pieces, setPieces] = useState<IConfettiPiece[]>([]);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    const generated: IConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.8,
      duration: 1.4 + Math.random() * 1.2,
      size: 6 + Math.random() * 8,
    }));
    setPieces(generated);
  }, []);

  return (
    <div className="success-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
      <div className="success-modal-confetti" aria-hidden="true">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.x}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
            }}
          />
        ))}
      </div>
      <div className="success-modal-card">
        <div className="success-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" stroke="#22c55e" strokeWidth="4" fill="#f0fdf4" className="success-circle" />
            <path
              d="M18 33l10 10 18-18"
              stroke="#22c55e"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-check"
            />
          </svg>
        </div>
        <h2 id="success-modal-title" className="success-modal-title">Submitted!</h2>
        <p className="success-modal-message">Thank you. We will contact you shortly.</p>
        <button type="button" className="btn btn-primary success-modal-ok" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

export interface ITuitionInquiryFormProps {
  /** Lowercase country slug from the URL (e.g. japan). Used with a time zone map for scheduling. */
  countrySlug: string;
}

export function TuitionInquiryForm({ countrySlug }: ITuitionInquiryFormProps): ReactElement {
  const normalizedCountrySlug = countrySlug.trim().toLowerCase();
  const [city, setCity] = useState('');
  const multiZoneCountry = isMultiZoneCountrySlug(normalizedCountrySlug);

  const { ianaTimeZone, slugWasRecognized, cityMatched } = useMemo(
    () => resolveIanaTimeZoneForCountrySlug(normalizedCountrySlug, city),
    [normalizedCountrySlug, city],
  );

  const timeZoneLabel = useMemo((): string => {
    try {
      const formatted = new Intl.DateTimeFormat('en', {
        timeZone: ianaTimeZone,
        timeZoneName: 'long',
      }).formatToParts(new Date());
      const name = formatted.find((part) => part.type === 'timeZoneName');
      return name?.value ?? ianaTimeZone;
    } catch {
      return ianaTimeZone;
    }
  }, [ianaTimeZone]);

  const [parentFullName, setParentFullName] = useState('');
  const [studentFullNames, setStudentFullNames] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [subjects, setSubjects] = useState<TTuitionSubjectOption[]>([]);
  const [subjectsOther, setSubjectsOther] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [availableDays, setAvailableDays] = useState<TTuitionDayOption[]>([]);
  const [messengerNumber, setMessengerNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorRevision, setErrorRevision] = useState(0);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const scrollIntoViewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (message: string): void => {
    setError(message);
    // Bump even when the message is unchanged so the banner is scrolled back into view on every failed tap.
    setErrorRevision((previous) => previous + 1);
  };

  useEffect(() => {
    return () => {
      if (scrollIntoViewTimeoutRef.current !== null) {
        clearTimeout(scrollIntoViewTimeoutRef.current);
      }
    };
  }, []);

  // The banner sits at the top of a long form; make sure the user actually sees why submit did nothing.
  useEffect(() => {
    if (errorRevision > 0) {
      errorBannerRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [errorRevision]);

  /*
   * Only nudge a text field into view when the soft keyboard really covers it (some Android browsers).
   * iOS Safari already pans the visual viewport to the focused field; resizing the form or scrolling
   * on every focus there moved the Submit button mid-tap, so taps landed on nothing.
   */
  const scrollFocusedFieldAboveKeyboard = (target: EventTarget | null): void => {
    const isTextField =
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement && target.type !== 'checkbox' && target.type !== 'radio');
    if (!isTextField) {
      return;
    }
    if (scrollIntoViewTimeoutRef.current !== null) {
      clearTimeout(scrollIntoViewTimeoutRef.current);
    }
    // Wait for the soft keyboard / visualViewport to settle before checking.
    scrollIntoViewTimeoutRef.current = setTimeout(() => {
      scrollIntoViewTimeoutRef.current = null;
      const viewport = window.visualViewport;
      if (!viewport || document.activeElement !== target) {
        return;
      }
      const rect = target.getBoundingClientRect();
      const visibleTop = viewport.offsetTop;
      const visibleBottom = viewport.offsetTop + viewport.height;
      if (rect.top >= visibleTop && rect.bottom <= visibleBottom) {
        return;
      }
      target.scrollIntoView({ block: 'center' });
    }, 350);
  };

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (loading) {
      return;
    }
    setError(null);
    if (city.trim().length === 0) {
      showError('Enter your city or area so we can use the correct time zone.');
      return;
    }
    if (subjects.length === 0) {
      showError('Select at least one subject.');
      return;
    }
    if (availableDays.length === 0) {
      showError('Select at least one available day.');
      return;
    }
    if (subjects.includes('Other') && subjectsOther.trim().length === 0) {
      showError('Please describe the other subjects you need.');
      return;
    }
    if (preferredDate.trim().length === 0) {
      showError('Choose a preferred date and time for your first session.');
      return;
    }

    setLoading(true);
    try {
      await submitTuitionInquiry({
        parentFullName: parentFullName.trim(),
        studentFullNames: studentFullNames.trim(),
        studentAge: studentAge.trim(),
        studentClass: studentClass.trim(),
        subjects,
        subjectsOther: subjects.includes('Other') ? subjectsOther.trim() : undefined,
        ianaTimeZone,
        countrySlug: normalizedCountrySlug,
        city: city.trim(),
        preferredTime: preferredDate.trim(),
        availableDays,
        messengerNumber: messengerNumber.trim(),
      });
      setShowSuccess(true);
      setParentFullName('');
      setStudentFullNames('');
      setStudentAge('');
      setStudentClass('');
      setCity('');
      setSubjects([]);
      setSubjectsOther('');
      setPreferredDate('');
      setAvailableDays([]);
      setMessengerNumber('');
    } catch (err: unknown) {
      showError(err instanceof ApiCallError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess ? <SuccessModal onClose={() => setShowSuccess(false)} /> : null}
    <form
      className="panel tuition-form"
      onFocusCapture={(event) => scrollFocusedFieldAboveKeyboard(event.target)}
      onSubmit={(event) => void onSubmit(event)}
    >
      <h2 className="tuition-form-title">Request information</h2>
      <p className="meta tuition-form-lead">Fill this form and we will contact you shortly.</p>
      {error ? (
        <div ref={errorBannerRef} className="error-banner" role="alert">
          {error}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="parent-full-name">Full name of parent(s)</label>
        <input
          id="parent-full-name"
          value={parentFullName}
          onChange={(event) => setParentFullName(event.target.value)}
          required
          minLength={2}
          maxLength={200}
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label htmlFor="student-full-names">Full name of student(s)</label>
        <input
          id="student-full-names"
          value={studentFullNames}
          onChange={(event) => setStudentFullNames(event.target.value)}
          required
          minLength={2}
          maxLength={500}
        />
      </div>
      <div className="field">
        <label htmlFor="student-age">Student age</label>
        <input
          id="student-age"
          value={studentAge}
          onChange={(event) => setStudentAge(event.target.value)}
          required
          maxLength={100}
          placeholder=""
        />
      </div>
      <div className="field">
        <label htmlFor="student-class">Student class / grade</label>
        <input
          id="student-class"
          value={studentClass}
          onChange={(event) => setStudentClass(event.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor="tuition-city">City / area · शहर</label>
        <input
          id="tuition-city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          required
          minLength={1}
          maxLength={120}
          placeholder={multiZoneCountry ? 'e.g. Vancouver, Perth, Los Angeles' : 'e.g. Tokyo, Kathmandu'}
          autoComplete="address-level2"
        />
        {multiZoneCountry ? (
          <p className="meta" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
            This country has several time zones — your city helps us schedule in the right local time.
          </p>
        ) : null}
      </div>
      <div className="field">
        <span className="meta tuition-field-heading">Subjects needed · चाहिएको विषयहरू</span>
        <div className="checkbox-grid">
          {TUITION_SUBJECT_OPTIONS.map((subject) => (
            <label key={subject} className="checkbox-tile">
              <input
                type="checkbox"
                checked={subjects.includes(subject)}
                onChange={() => setSubjects((previous) => toggleInList(previous, subject))}
              />
              <span>{subject}</span>
            </label>
          ))}
        </div>
      </div>
      {subjects.includes('Other') ? (
        <div className="field">
          <label htmlFor="subjects-other">Other subjects (please specify)</label>
          <textarea
            id="subjects-other"
            value={subjectsOther}
            onChange={(event) => setSubjectsOther(event.target.value)}
            rows={2}
            maxLength={300}
          />
        </div>
      ) : null}
      <div className="field">
        <p className="meta" style={{ marginBottom: '0.5rem' }}>
        <span className="meta tuition-field-heading">
          Preferred first session (local time) · मिति र स्थानीय समय
        </span>
          Times are interpreted in <strong>{timeZoneLabel}</strong> ({ianaTimeZone})
          {cityMatched ? ' based on your city' : ' for this country page'}.
          {!slugWasRecognized || (multiZoneCountry && city.trim().length > 0 && !cityMatched) ? (
            <span>
              {' '}
              If the time zone looks wrong, include a clearer city name or tell staff when they contact you.
            </span>
          ) : null}
        </p>
            <label htmlFor="preferred-date"> Preferred Time </label>
            <input
              id="preferred-date"
              type="text"
              value={preferredDate}
              placeholder="e.g. 06:00 PM JST , evening, flexible, morning, 06-08 PM JST"
              onChange={(event) => setPreferredDate(event.target.value)}
              required
            />
      
      </div>
      <div className="field tuition-messenger-field">
        <label htmlFor="messenger">WhatsApp / Viber number</label>
        <input
          id="messenger"
          value={messengerNumber}
          onChange={(event) => setMessengerNumber(event.target.value)}
          required
          minLength={6}
          maxLength={80}
          inputMode="tel"
          autoComplete="tel"
          type="tel"
        />
      </div>
      <div className="field">
        <span className="meta tuition-field-heading">Available days · उपलब्ध दिनहरू</span>
        <div className="checkbox-grid">
          {TUITION_DAY_OPTIONS.map((day) => (
            <label key={day} className="checkbox-tile">
              <input
                type="checkbox"
                checked={availableDays.includes(day)}
                onChange={() => setAvailableDays((previous) => toggleInList(previous, day))}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Sending…' : 'Submit'}
      </button>
    </form>
    </>
  );
}
