import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DeleteAccountForm } from '@/components/DeleteAccountForm';

export const metadata: Metadata = {
  title: 'Bitverse Academy — Delete account',
  description: 'Permanently delete your Bitverse Academy account and personal data.',
};

export default function DeleteAccountPage(): React.ReactElement {
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-inner">
          <Link href="/" className="public-brand">
            <Image
              src="/logo.jpeg"
              alt="Bitverse Technologies"
              width={36}
              height={36}
              style={{ borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }}
            />
            <span className="public-brand-text">Bitverse Academy</span>
          </Link>
          <Link href="/" className="btn public-admin-link">
            Home
          </Link>
        </div>
      </header>
      <main className="public-main">
        <section className="tuition-hero panel">
          <h1 className="tuition-hero-title">Delete your Bitverse Academy account</h1>
          <p className="tuition-hero-text">
            Deleting your account signs you out everywhere and removes your personal details from Bitverse Academy.
          </p>
          <ul className="tuition-bullet-list">
            <li>Removed: your name, email, phone, photo, password and profile details</li>
            <li>Removed: your login sessions and notification devices</li>
            <li>
              Kept without your name: messages, homework and invoice records that other class members or the academy
              still need
            </li>
          </ul>
          <p className="meta" style={{ marginTop: '1rem' }}>
            Can&apos;t sign in? Email{' '}
            <a href="mailto:contactus@bitverseacademy.com">contactus@bitverseacademy.com</a> from your account email and
            we&apos;ll delete it for you.
          </p>
        </section>
        <DeleteAccountForm />
      </main>
    </div>
  );
}
