import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TeacherInquiryForm } from '@/components/TeacherInquiryForm';

export const metadata: Metadata = {
  title: 'Bitverse Academy — Apply to teach',
  description:
    'Join Bitverse Academy as an online teacher. Submit your application with subjects, availability, and credentials.',
};

export default function TeacherInquiryPage(): React.ReactElement {
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
              style={{ borderRadius: '6px', objectFit: 'contain' }}
            />
            Bitverse Academy — Teach with us
          </Link>
          <Link href="/" className="btn public-admin-link">
            Back to home
          </Link>
        </div>
      </header>
      <main className="public-main">
        <section className="tuition-hero panel">
          <h1 className="tuition-hero-title">Become a Bitverse teacher</h1>
          <p className="tuition-hero-text">
            We connect experienced Nepali teachers with students abroad through live online classes. Share your
            expertise, set your availability, and teach from anywhere.
          </p>
          <ul className="tuition-bullet-list">
            <li>Flexible online scheduling</li>
            <li>One-to-one and small-batch classes</li>
            <li>Support from our academic team</li>
          </ul>
          <p className="meta" style={{ marginTop: '1rem' }}>
            Questions? Email{' '}
            <a href="mailto:contactus@bitverseacademy.com" style={{ color: 'inherit' }}>
              contactus@bitverseacademy.com
            </a>
          </p>
        </section>
        <TeacherInquiryForm />
      </main>
    </div>
  );
}
