import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TuitionInquiryForm } from '@/components/TuitionInquiryForm';
import { ADMIN_CONSOLE_BASE_PATH } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Bitverse Academy — Online tuition for students living abroad',
  description:
    'Personalized online tuition for students living abroad. English, Nepali, Math, Science and more. Flexible scheduling.',
};

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<React.ReactElement> {
  const { name } = await params;
  const countryLabel = name[0].toUpperCase() + name.slice(1);

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
            <span className="public-brand-text">Bitverse Academy · {countryLabel}</span>
          </Link>
          <Link href={`${ADMIN_CONSOLE_BASE_PATH}/login`} className="btn public-admin-link">
            Staff
          </Link>
        </div>
      </header>
      <main className="public-main">
        <section className="tuition-hero panel">
          <h1 className="tuition-hero-title">Online tuition for students in {countryLabel}</h1>
          <p className="tuition-hero-text">
            We provide personalized online tuition for students living in {countryLabel}. Subjects include English,
            Nepali, Math, Science, and many more.
          </p>
          <ul className="tuition-bullet-list">
            <li>Experienced teachers</li>
            <li>Flexible timing ({countryLabel} time)</li>
            <li>3 days free trial class</li>
          </ul>
          <p className="meta" style={{ marginTop: '1rem' }}>
            Questions? Email{' '}
            <a href="mailto:contactus@bitverseacademy.com">contactus@bitverseacademy.com</a>
          </p>
        </section>
        <TuitionInquiryForm countrySlug={decodeURIComponent(name)} />
      </main>
    </div>
  );
}
