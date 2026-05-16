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
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-inner">

          <span className="public-brand">
            <Image
              src="/logo.jpeg"
              alt="Bitverse Technologies"
              width={36}
              height={36}
              style={{ borderRadius: '6px', objectFit: 'contain' }}
            />
            Bitverse Academy {name[0].toUpperCase() + name.slice(1)}
          </span>
          <Link href={`${ADMIN_CONSOLE_BASE_PATH}/login`} className="btn public-admin-link">
            Staff sign in
          </Link>
        </div>
      </header>
      <main className="public-main">
        <section className="tuition-hero panel">
          <h1 className="tuition-hero-title">Online tuition for students (in {name[0].toUpperCase() + name.slice(1)})</h1>
          <p className="tuition-hero-text">
            We provide personalized online tuition for students living in {name[0].toUpperCase() + name.slice(1)}. Subjects include English, Nepali,
            Math, Science, and many more.
          </p>
          <ul className="tuition-bullet-list">
            <li>Experienced teachers</li>
            <li>Flexible timing ( {name[0].toUpperCase() + name.slice(1)} Time)</li>
            <li>3 days free trial class</li>
          </ul>
          <p className="meta" style={{ marginTop: '1rem' }}>
            Questions? Email{' '}
            <a href="mailto:cruserap@gmail.com">cruserap@gmail.com</a>.
          </p>
        </section>
        <TuitionInquiryForm countrySlug={decodeURIComponent(name)} />
      </main>
    </div>
  );
}
