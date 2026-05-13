'use client';

import { DateTime } from 'luxon';
import { FormEvent, useMemo, useState, type ReactElement } from 'react';
import { ApiCallError } from '@/lib/api';
import { resolveIanaTimeZoneForCountrySlug } from '@/lib/country-tuition-timezones';
import {
  submitTuitionInquiry,
  TUITION_DAY_OPTIONS,
  TUITION_SUBJECT_OPTIONS,
  type TTuitionDayOption,
  type TTuitionSubjectOption,
} from '@/lib/tuition-inquiry.client';
import { combineLocalDateTimeToUtcIso } from '@/lib/tuition-preferred-datetime';

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

  const minPreferredDate = useMemo((): string => {
    return DateTime.now().setZone(ianaTimeZone).toISODate() ?? '';
  }, [ianaTimeZone]);

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
  const [preferredWallTime, setPreferredWallTime] = useState('');
  const [availableDays, setAvailableDays] = useState<TTuitionDayOption[]>([]);
  const [messengerNumber, setMessengerNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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
    if (preferredDate.trim().length === 0 || preferredWallTime.trim().length === 0) {
      setError('Choose a preferred date and time for your first session.');
      return;
    }
    const preferredStartAtIso = combineLocalDateTimeToUtcIso(preferredDate, preferredWallTime, ianaTimeZone);
    if (!preferredStartAtIso) {
      setError('That date and time could not be read. Please check your entries.');
      return;
    }
    const preferredInstantMs = Date.parse(preferredStartAtIso);
    if (Number.isNaN(preferredInstantMs) || preferredInstantMs < Date.now() - 60_000) {
      setError("Pick a date and time at least one minute from now (in your country's local time).");
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
        preferredStartAt: preferredStartAtIso,
        ianaTimeZone,
        countrySlug: normalizedCountrySlug,
        availableDays,
        messengerNumber: messengerNumber.trim(),
      });
      setSuccess('Thank you. We will contact you shortly.');
      setParentFullName('');
      setStudentFullNames('');
      setStudentAge('');
      setStudentClass('');
      setSubjects([]);
      setSubjectsOther('');
      setPreferredDate('');
      setPreferredWallTime('');
      setAvailableDays([]);
      setMessengerNumber('');
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel tuition-form" onSubmit={(event) => void onSubmit(event)}>
      <h2 className="tuition-form-title">Request information</h2>
      <p className="meta tuition-form-lead">Fill this form and we will contact you shortly.</p>
      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}
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
          placeholder="e.g. 10 or 8 and 12 (two children)"
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
        <span className="meta tuition-field-heading">
          Preferred first session (date &amp; local time) · मिति र स्थानीय समय
        </span>
        <p className="meta" style={{ marginBottom: '0.5rem' }}>
          Times are interpreted in <strong>{timeZoneLabel}</strong> ({ianaTimeZone}) for this country page.
          {!slugWasRecognized ? (
            <span> We could not match this URL to a known region; if the time zone is wrong, mention your city in the
            message to staff when they contact you.</span>
          ) : null}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="preferred-date">Date</label>
            <input
              id="preferred-date"
              type="date"
              value={preferredDate}
              min={minPreferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              required
            />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label htmlFor="preferred-wall-time">Time</label>
            <input
              id="preferred-wall-time"
              type="time"
              value={preferredWallTime}
              onChange={(event) => setPreferredWallTime(event.target.value)}
              required
            />
          </div>
        </div>
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
  );
}
