'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ApiCallError } from '@/lib/api';
import { resolveIanaTimeZoneForCountrySlug } from '@/lib/country-tuition-timezones';
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
  const { ianaTimeZone, slugWasRecognized } = useMemo(
    () => resolveIanaTimeZoneForCountrySlug(normalizedCountrySlug),
    [normalizedCountrySlug],
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

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (subjects.length === 0) {
      setError('Select at least one subject.');
      return;
    }
    if (availableDays.length === 0) {
      setError('Select at least one available day.');
      return;
    }
    if (subjects.includes('Other') && subjectsOther.trim().length === 0) {
      setError('Please describe the other subjects you need.');
      return;
    }
    if (preferredDate.trim().length === 0) {
      alert('preferredDate: ' + preferredDate);
      setError('Choose a preferred date and time for your first session.');
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
        preferredTime: preferredDate.trim(),
        availableDays,
        messengerNumber: messengerNumber.trim(),
      });
      setShowSuccess(true);
      setParentFullName('');
      setStudentFullNames('');
      setStudentAge('');
      setStudentClass('');
      setSubjects([]);
      setSubjectsOther('');
      setPreferredDate('');
      setAvailableDays([]);
      setMessengerNumber('');
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess ? <SuccessModal onClose={() => setShowSuccess(false)} /> : null}
    <form className="panel tuition-form" onSubmit={(event) => void onSubmit(event)}>
      <h2 className="tuition-form-title">Request information</h2>
      <p className="meta tuition-form-lead">Fill this form and we will contact you shortly.</p>
      {error ? <div className="error-banner">{error}</div> : null}
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
          Times are interpreted in <strong>{timeZoneLabel}</strong> ({ianaTimeZone}) for this country page.
          {!slugWasRecognized ? (
            <span> We could not match this URL to a known region; if the time zone is wrong, mention your city in the
            message to staff when they contact you.</span>
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
      <div className="field">
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
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Sending…' : 'Submit'}
      </button>
    </form>
    </>
  );
}
