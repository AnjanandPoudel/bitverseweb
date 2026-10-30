'use client';

import { FormEvent, useState, type ReactElement } from 'react';
import { ApiCallError } from '@/lib/api';
import { deleteAccount } from '@/lib/delete-account.client';

export function DeleteAccountForm(): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!confirmed) {
      setError('Please confirm that you understand this cannot be undone.');
      return;
    }

    setLoading(true);
    try {
      await deleteAccount({ email: email.trim(), password });
      setDeleted(true);
      setPassword('');
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (deleted) {
    return (
      <section className="panel">
        <div className="success-banner">Your account has been deleted.</div>
        <p className="meta" style={{ margin: 0 }}>
          Your personal details have been removed and you have been signed out on all devices. You can uninstall the
          Bitverse Academy app.
        </p>
      </section>
    );
  }

  return (
    <form className="panel tuition-form" onSubmit={(event) => void onSubmit(event)}>
      <h2 className="tuition-form-title">Delete your account</h2>
      <p className="meta tuition-form-lead">Sign in with the email and password you use in the Bitverse Academy app.</p>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="field">
        <label htmlFor="delete-email">Email</label>
        <input
          id="delete-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="delete-password">Password</label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <label className="delete-account-confirm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>I understand that my account will be permanently deleted and this cannot be undone.</span>
      </label>

      <button type="submit" className="btn btn-primary btn-danger" disabled={loading}>
        {loading ? 'Deleting…' : 'Delete my account'}
      </button>
    </form>
  );
}
