import EnrollDropdown from '@/components/Enroll';
import { FbVideoEmbed } from '@/components/FbVideoEmbed';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Bitverse Tuition — Online Tutoring for Abroad Students',
  description:
    'Bitverse Tuition connects Nepali students abroad with experienced teachers for online classes (Grades 1–10). One-to-one and small-batch sessions in Math, Science, English, Nepali, Computer, and more.',
};

const SUBJECTS = [
  { icon: '📐', label: 'Mathematics' },
  { icon: '🔬', label: 'Science' },
  { icon: '📖', label: 'English' },
  { icon: '🇳🇵', label: 'Nepali' },
  { icon: '💻', label: 'Computer' },
  { icon: '📊', label: 'Account & Optional Math' },
];

const WHY_CHOOSE = [
  { icon: '🎯', title: 'One-to-One Classes', desc: 'Dedicated sessions focused entirely on your child — maximum attention, minimum distractions.' },
  { icon: '👥', title: 'Small Batches', desc: 'When group learning suits better, we keep batches tiny so every student gets noticed.' },
  { icon: '📝', title: 'Weekly Tests', desc: 'Regular assessments to track progress and reinforce learning online.' },
  { icon: '📋', title: 'Weekly Progress Report', desc: 'Parents stay fully informed with detailed weekly updates sent directly to you.' },
  { icon: '🌏', title: 'Study from Anywhere', desc: 'Live online classes accessible from any country — all you need is an internet connection.' },
  { icon: '🆓', title: '3-Day Free Trial', desc: 'Experience our teaching quality before you commit — completely free, no obligation.' },
];

const ONLINE_PROGRAMS = [
  {
    title: 'Primary Online',
    range: 'Grades 1 – 4',
    color: 'lp-prog-green',
    tag: 'One-to-One',
    subjects: ['Homework Support', 'All Core Subjects', 'Nepali & English', 'Interactive Activities'],
  },
  {
    title: 'Middle School Online',
    range: 'Grades 5 – 7',
    color: 'lp-prog-blue',
    tag: 'Small Batch / 1-to-1',
    subjects: ['Math & Science', 'English & Nepali', 'Computer', 'Social Studies'],
  },
  {
    title: 'High School Online',
    range: 'Grades 8 – 10',
    color: 'lp-prog-purple',
    tag: 'Small Batch / 1-to-1',
    subjects: ['Math & Science', 'Optional Mathematics', 'Computer', 'Account'],
  },
];

const TIMINGS = [
  { session: 'Morning (NPT)', time: '7:00 – 9:00 AM', icon: '🌅' },
  { session: 'Evening (NPT)', time: '5:00 – 7:00 PM', icon: '🌆' },
];

export default function LandingPage(): React.ReactElement {
  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo-link">
            <Image src="/logo.jpeg" alt="Bitverse Tuition" width={48} height={48} className="lp-logo-img" />
            <span className="lp-logo-text hidden-on-mobile">Bitverse <span className="lp-logo-accent">Tuition</span></span>
          </Link>
          <nav className="lp-nav-links">
            <a href="#why-us">Why Us</a>
            <a href="#programs">Programs</a>
            <a href="#timings">Timings</a>
            <a href="#contact">Contact</a>
          </nav>
          <EnrollDropdown text="Enroll Now" />
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <Image
            src="/coverimage.png"
            alt="Bitverse online tuition for students abroad"
            fill
            className="lp-hero-img"
            priority
          />
          <div className="lp-hero-overlay" />
        </div>
        <div className="lp-hero-content">
          <span className="lp-hero-badge">Online Classes · Grades 1 – 10 · Study from Anywhere</span>
          <h1 className="lp-hero-title">
            Personal Attention,<br />
            <span className="lp-hero-title-accent">Real Results</span>
          </h1>
          <p className="lp-hero-subtitle">
            Bitverse Tuition brings experienced Nepali teachers directly to students living abroad — through live, one-to-one and small-batch online classes. Flexible timings, weekly reports, and a free 3-day trial.
          </p>
          <div className="lp-hero-actions">
            <div className="btn btn-primary">
              <EnrollDropdown text="Start Free Trial" />
            </div>
            <a href="#programs" className="btn lp-btn-lg lp-btn-ghost">View Programs</a>
          </div>
          <div className="lp-hero-phones">
            <a href="tel:9846940545">📞 9846940545</a>
            <a href="tel:9765941104">📞 9765941104</a>
          </div>
        </div>
      </section>

      {/* ── FEATURED VIDEOS ── */}
      <section className="lp-section lp-videos-section" id="videos">
        <div className="lp-container">
          <div className="lp-section-label">See Us in Action</div>
          <h2 className="lp-section-title">Real Classes, Real Students</h2>
          <p className="lp-section-sub" style={{ marginBottom: '2.5rem' }}>
            Watch how our online sessions work — teaching style, student moments, and learning in action.
          </p>

          <div className="lp-videos-grid">
            {/* TikTok — bitverse.tuition featured post */}
            {/* <div className="lp-video-item">
              <div className="lp-video-wrapper">
                <div className="lp-video-cover">
                  <Image src="/videocover1.png" alt="Video preview" fill className="lp-video-cover-img" />
                  <div className="lp-video-play-btn">▶</div>
                </div>
                <blockquote
                  className="tiktok-embed"
                  cite="https://www.tiktok.com/@bitverse.tuition/photo/7634230446410272008"
                  data-video-id="7634230446410272008"
                  style={{ maxWidth: '325px', minWidth: '280px', margin: 0 }}
                >
                  <section>
                    <a target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@bitverse.tuition?refer=embed">@bitverse.tuition</a>
                  </section>
                </blockquote>
              </div>
            </div> */}

            {/* TikTok — urmilaadhikaripou video 1 */}
            <div className="lp-video-item">
              <div className="lp-video-wrapper">
                <div className="lp-video-cover">
                  <Image src="/videocover2.png" alt="Video preview" fill className="lp-video-cover-img" />
                  <div className="lp-video-play-btn">▶</div>
                  <a href="https://www.tiktok.com/@urmilaadhikaripou/video/7618611825583623442" target="_blank" rel="noopener noreferrer">https://www.tiktok.com/@urmilaadhikaripou/video/7618611825583623442</a>
                </div>
                <blockquote
                  className="tiktok-embed"
                  cite="https://www.tiktok.com/@urmilaadhikaripou/video/7618611825583623442"
                  data-video-id="7618611825583623442"
                  style={{ maxWidth: '325px', minWidth: '280px', margin: 0 }}
                >
                  <section>
                    <a target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@urmilaadhikaripou?refer=embed">@urmilaadhikaripou</a>
                  </section>
                </blockquote>
              </div>
            </div>

            {/* TikTok — urmilaadhikaripou video 2 */}
            <div className="lp-video-item">
              <div className="lp-video-wrapper">
                <div className="lp-video-cover">
                  <Image src="/videocover3.png" alt="Video preview" fill className="lp-video-cover-img" />
                  <div className="lp-video-play-btn">▶</div>
                  <a href="https://www.tiktok.com/@urmilaadhikaripou/video/7638261168649342228" target="_blank" rel="noopener noreferrer">https://www.tiktok.com/@urmilaadhikaripou/video/7638261168649342228</a>
                </div>
                <blockquote
                  className="tiktok-embed"
                  cite="https://www.tiktok.com/@urmilaadhikaripou/video/7638261168649342228"
                  data-video-id="7638261168649342228"
                  style={{ maxWidth: '325px', minWidth: '280px', margin: 0 }}
                >
                  <section>
                    <a target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@urmilaadhikaripou?refer=embed">@urmilaadhikaripou</a>
                  </section>
                </blockquote>
              </div>
            </div>

            {/* Facebook Reel */}
            <div className="lp-video-item">
              <FbVideoEmbed
                reelId="1468237488200378"
                coverSrc="/videocover4.png"
                coverAlt="Video preview"
              />
            </div>
          </div>

          <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />

          <div className="lp-tiktok-cta">
            <a
              href="https://www.tiktok.com/@bitverse.tuition?_r=1&_t=ZS-96P11muDM3h"
              target="_blank"
              rel="noopener noreferrer"
              className="btn lp-btn-lg lp-tiktok-btn"
            >
              🎵 Follow @bitverse.tuition on TikTok
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-how">
        <div className="lp-container">
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-section-title">Learning Online Has Never Been Easier</h2>
          <p className="lp-section-sub">
            No matter where your child is in the world, we connect them with the right teacher in minutes — live, interactive, and tailored to their school curriculum.
          </p>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <h3>Enquire</h3>
              <p>Tell us your grade, subjects, and preferred timing — takes under a minute.</p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <h3>Get Matched</h3>
              <p>We assign a qualified teacher tailored to your child's needs and schedule.</p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <h3>Start Learning</h3>
              <p>Join your first 3 online classes completely free and see the difference.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section className="lp-section lp-subjects-section">
        <div className="lp-container">
          <div className="lp-section-label">What We Teach</div>
          <h2 className="lp-section-title">Subjects We Cover</h2>
          <div className="lp-subjects-grid">
            {SUBJECTS.map(({ icon, label }) => (
              <div key={label} className="lp-subject-card">
                <span className="lp-subject-icon">{icon}</span>
                <span className="lp-subject-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="lp-section" id="why-us">
        <div className="lp-container">
          <div className="lp-section-label">Why Families Choose Us</div>
          <h2 className="lp-section-title">Everything Your Child Needs to Excel Online</h2>
          <div className="lp-features-grid">
            {WHY_CHOOSE.map(({ icon, title, desc }) => (
              <div key={title} className="lp-feature-card panel">
                <div className="lp-feature-icon">{icon}</div>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONLINE PROGRAMS ── */}
      <section className="lp-section" id="programs">
        <div className="lp-container">
          <div className="lp-section-label">Our Programs</div>
          <h2 className="lp-section-title">Online Classes for Every Grade — Wherever You Are</h2>
          <h2 className="lp-section-subtitle">Flexible Timings to Suit Your Time Zone (Online study at any time you want)</h2>
          <p className="lp-section-sub" style={{ marginBottom: '0' }}>
            All programs are delivered live over video call, following the Nepal school curriculum so your child stays on track regardless of which country they're in.
          </p>
          <div className="lp-programs-grid">
            {ONLINE_PROGRAMS.map(({ title, range, color, tag, subjects }) => (
              <div key={range} className={`lp-program-card panel ${color}`}>
                <div>
                  <span className="lp-program-tag">{tag}</span>
                  <h3 className="lp-program-range">{range}</h3>
                  <p className="lp-program-title-label">{title}</p>
                </div>
                <ul className="lp-program-list">
                  {subjects.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <a href="tel:9846940545" className="btn btn-primary lp-program-btn">Enquire</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMINGS ── */}
      {/* <section className="lp-section lp-timings-section" id="timings">
        <div className="lp-container">
          <div className="lp-section-label">Class Schedule</div>
          <h2 className="lp-section-title">Flexible Timings to Suit Your Time Zone</h2>
          <div className="lp-timings-grid">
            {TIMINGS.map(({ session, time, icon }) => (
              <div key={session} className="lp-timing-card panel">
                <span className="lp-timing-icon">{icon}</span>
                <div>
                  <div className="lp-timing-session">{session}</div>
                  <div className="lp-timing-time">{time}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="lp-timings-note">
            All times shown in Nepal Standard Time (NPT, UTC+5:45). Custom timings can be arranged to suit students in different countries — just ask when you enquire.
          </p>
        </div>
      </section> */}

      {/* ── CONTACT ── */}
      <section className="lp-section lp-contact-section" id="contact">
        <div className="lp-container">
          <div className="lp-section-label">Get In Touch</div>
          <h2 className="lp-section-title">Reach Out &amp; Start Today</h2>
          <div className="lp-contact-grid">
            <div className="lp-contact-card panel">
              <div className="lp-contact-icon">📞</div>
              <h3>Phone / WhatsApp</h3>
              <p>
                <a href="tel:9846940545">9846940545</a><br />
                <a href="tel:9765941104">9765941104</a>
              </p>
            </div>
            <div className="lp-contact-card panel">
              <div className="lp-contact-icon">🔗</div>
              <h3>Follow Us</h3>
              <p>
                <a
                  href="https://www.facebook.com/BitverseTech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-link lp-fb-link"
                >
                  Facebook — BitverseTech
                </a>
                <br />
                <a
                  href="https://www.youtube.com/@Bitverse-Tuition"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-link lp-yt-link"
                >
                  YouTube — @Bitverse-Tuition
                </a>
                <br />
                <a
                  href="https://www.tiktok.com/@bitverse.tuition?_r=1&_t=ZS-96P11muDM3h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-link lp-tt-link"
                >
                  TikTok — @bitverse.tuition
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner">
        <div className="lp-container lp-cta-inner">
          <div>
            <h2 className="lp-cta-title">Ready to get started?</h2>
            <p className="lp-cta-sub">Claim your 3 free online trial classes — no obligation, no payment required.</p>
          </div>
          <a href="tel:9846940545" className="btn btn-primary lp-btn-lg">Call / WhatsApp Us</a>
          <a href="tel:9846940545" className="lp-hero-phones">📞 9846940545</a>
          <a href="tel:9765941104" className="lp-hero-phones">📞 9765941104</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <Image src="/logo.jpeg" alt="Bitverse Tuition" width={36} height={36} className="lp-logo-img" />
            <span>Bitverse Tuition</span>
          </div>
          <p className="lp-footer-tagline">Personal Attention, Real Results — Online</p>
          <div className="lp-footer-links">
            <a href="https://www.facebook.com/BitverseTech" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://www.youtube.com/@Bitverse-Tuition" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="https://www.tiktok.com/@bitverse.tuition?_r=1&_t=ZS-96P11muDM3h" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href="tel:9846940545">9846940545</a>
          </div>
          <p className="lp-footer-location">📍 Shishuwa, Naubise, Nepal</p>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Bitverse Tuition. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
