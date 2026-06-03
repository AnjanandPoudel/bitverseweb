'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ApiCallError } from '@/lib/api';
import { COUNTRY_SLUG_TO_IANA_TIMEZONE, resolveIanaTimeZoneForCountrySlug } from '@/lib/country-tuition-timezones';
import {
  submitTeacherInquiry,
  TEACHER_DAY_OPTIONS,
  TEACHER_GENDER_OPTIONS,
  TEACHER_SUBJECT_OPTIONS,
  type TTeacherDayOption,
  type TTeacherGenderOption,
  type TTeacherSubjectOption,
} from '@/lib/teacher-inquiry.client';
import { genderLabel } from '@/lib/teacher-inquiry-workflow';

interface IConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const CONFETTI_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#facc15', '#fb923c', '#60a5fa', '#a78bfa', '#f472b6'];

const COUNTRY_OPTIONS: readonly { slug: string; label: string }[] = [
  { slug: 'nepal', label: 'Nepal' },
  { slug: 'japan', label: 'Japan' },
  { slug: 'canada', label: 'Canada' },
  { slug: 'australia', label: 'Australia' },
  { slug: 'uk', label: 'United Kingdom' },
  { slug: 'usa', label: 'United States' },
  { slug: 'south-korea', label: 'South Korea' },
  { slug: 'india', label: 'India' },
  { slug: 'singapore', label: 'Singapore' },
  { slug: 'uae', label: 'UAE' },
  { slug: 'qatar', label: 'Qatar' },
  { slug: 'malaysia', label: 'Malaysia' },
  { slug: 'thailand', label: 'Thailand' },
  { slug: 'taiwan', label: 'Taiwan' },
  { slug: 'hong-kong', label: 'Hong Kong' },
  { slug: 'france', label: 'France' },
  { slug: 'germany', label: 'Germany' },
  { slug: 'new-zealand', label: 'New Zealand' },
  { slug: 'global', label: 'Other / not listed' },
] as const;

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
    <div className="success-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="teacher-success-title">
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
        <h2 id="teacher-success-title" className="success-modal-title">Application received</h2>
        <p className="success-modal-message">
          Thank you. Our team will review your application and email you when your account is approved. You can then sign
          in to the Bitverse mobile app.
        </p>
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

export function TeacherInquiryForm(): ReactElement {
  const [countrySlug, setCountrySlug] = useState('nepal');
  const { ianaTimeZone, slugWasRecognized } = useMemo(
    () => resolveIanaTimeZoneForCountrySlug(countrySlug),
    [countrySlug],
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

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [messengerNumber, setMessengerNumber] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<TTeacherGenderOption | ''>('');
  const [city, setCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [education, setEducation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [teachingExperience, setTeachingExperience] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [subjects, setSubjects] = useState<TTeacherSubjectOption[]>([]);
  const [subjectsOther, setSubjectsOther] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [availableDays, setAvailableDays] = useState<TTeacherDayOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (subjects.length === 0) {
      setError('Select at least one subject you can teach.');
      return;
    }
    if (availableDays.length === 0) {
      setError('Select at least one day you are available.');
      return;
    }
    if (subjects.includes('Other') && subjectsOther.trim().length === 0) {
      setError('Please describe the other subjects you teach.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await submitTeacherInquiry({
        fullName: fullName.trim(),
        phone: phone.trim(),
        teacherEmail: teacherEmail.trim(),
        password,
        subjects,
        subjectsOther: subjects.includes('Other') ? subjectsOther.trim() : undefined,
        ianaTimeZone,
        countrySlug: countrySlug.trim().toLowerCase(),
        preferredTime: preferredTime.trim() || undefined,
        availableDays,
        gender: gender || undefined,
        city: city.trim() || undefined,
        education: education.trim() || undefined,
        yearsOfExperience: yearsOfExperience.trim() || undefined,
        teachingExperience: teachingExperience.trim() || undefined,
        languagesSpoken: languagesSpoken.trim() || undefined,
        messengerNumber: messengerNumber.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      setShowSuccess(true);
      setFullName('');
      setPhone('');
      setMessengerNumber('');
      setTeacherEmail('');
      setPassword('');
      setConfirmPassword('');
      setGender('');
      setCity('');
      setDateOfBirth('');
      setEducation('');
      setYearsOfExperience('');
      setTeachingExperience('');
      setLanguagesSpoken('');
      setPortfolioUrl('');
      setSubjects([]);
      setSubjectsOther('');
      setPreferredTime('');
      setAvailableDays([]);
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
        <h2 className="tuition-form-title">Apply to teach with Bitverse</h2>
        <p className="meta tuition-form-lead">
          Complete this form to join our teacher network. After admin review, you will receive approval and can sign in
          to the mobile app with the email and password you choose below.
        </p>
        {error ? <div className="error-banner">{error}</div> : null}

        <div className="field">
          <label htmlFor="teacher-full-name">Full name</label>
          <input
            id="teacher-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            minLength={2}
            maxLength={200}
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-email">Email (for sign-in after approval)</label>
          <input
            id="teacher-email"
            type="email"
            value={teacherEmail}
            onChange={(event) => setTeacherEmail(event.target.value)}
            required
            maxLength={254}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-password">Create password</label>
          <input
            id="teacher-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-confirm-password">Confirm password</label>
          <input
            id="teacher-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-phone">Phone number</label>
          <input
            id="teacher-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            minLength={6}
            maxLength={80}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-messenger">WhatsApp / Viber (optional if same as phone)</label>
          <input
            id="teacher-messenger"
            value={messengerNumber}
            onChange={(event) => setMessengerNumber(event.target.value)}
            minLength={6}
            maxLength={80}
            inputMode="tel"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-gender">Gender</label>
          <select
            id="teacher-gender"
            value={gender}
            onChange={(event) => setGender(event.target.value as TTeacherGenderOption | '')}
          >
            <option value="">— Select —</option>
            {TEACHER_GENDER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {genderLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="teacher-dob">Date of birth (optional)</label>
          <input
            id="teacher-dob"
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-country">Country / region</label>
          <select
            id="teacher-country"
            value={countrySlug}
            onChange={(event) => setCountrySlug(event.target.value)}
            required
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="meta" style={{ marginTop: '0.35rem' }}>
            Scheduling time zone: <strong>{timeZoneLabel}</strong> ({ianaTimeZone})
            {!slugWasRecognized && countrySlug !== 'global' ? (
              <span> — using default ({COUNTRY_SLUG_TO_IANA_TIMEZONE.nepal}).</span>
            ) : null}
          </p>
        </div>

        <div className="field">
          <label htmlFor="teacher-city">City / area (optional)</label>
          <input
            id="teacher-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={120}
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-education">Highest qualification</label>
          <input
            id="teacher-education"
            value={education}
            onChange={(event) => setEducation(event.target.value)}
            maxLength={300}
            placeholder="e.g. B.Ed, M.Sc Mathematics"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-years">Years of teaching experience</label>
          <input
            id="teacher-years"
            value={yearsOfExperience}
            onChange={(event) => setYearsOfExperience(event.target.value)}
            maxLength={50}
            placeholder="e.g. 5"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-experience">Teaching experience (summary)</label>
          <textarea
            id="teacher-experience"
            value={teachingExperience}
            onChange={(event) => setTeachingExperience(event.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Grades taught, curriculum, online vs in-person, etc."
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-languages">Languages you can teach in</label>
          <input
            id="teacher-languages"
            value={languagesSpoken}
            onChange={(event) => setLanguagesSpoken(event.target.value)}
            maxLength={500}
            placeholder="e.g. Nepali, English"
          />
        </div>

        <div className="field">
          <label htmlFor="teacher-portfolio">Portfolio / LinkedIn URL (optional)</label>
          <input
            id="teacher-portfolio"
            type="url"
            value={portfolioUrl}
            onChange={(event) => setPortfolioUrl(event.target.value)}
            maxLength={500}
            placeholder="https://"
          />
        </div>

        <div className="field">
          <span className="meta tuition-field-heading">Subjects you can teach</span>
          <div className="checkbox-grid">
            {TEACHER_SUBJECT_OPTIONS.map((subject) => (
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
            <label htmlFor="teacher-subjects-other">Other subjects (please specify)</label>
            <textarea
              id="teacher-subjects-other"
              value={subjectsOther}
              onChange={(event) => setSubjectsOther(event.target.value)}
              rows={2}
              maxLength={300}
            />
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="teacher-preferred-time">Preferred teaching times</label>
          <input
            id="teacher-preferred-time"
            type="text"
            value={preferredTime}
            onChange={(event) => setPreferredTime(event.target.value)}
            maxLength={300}
            placeholder="e.g. Weekday evenings, 6–9 PM NPT, flexible weekends"
          />
        </div>

        <div className="field">
          <span className="meta tuition-field-heading">Available days</span>
          <div className="checkbox-grid">
            {TEACHER_DAY_OPTIONS.map((day) => (
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
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </>
  );
}
