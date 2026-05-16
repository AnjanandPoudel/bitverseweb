import EnrollDropdown from '@/components/Enroll';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bitverse Tuition Center — Personal Attention, Real Results',
  description:
    'Bitverse Tuition Center connects students with experienced teachers for classes 1–10. Subjects include Math, Science, English, Nepali, Computer, and more. Located in Shishuwa, Naubise.',
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
  { icon: '👥', title: 'Small Batches', desc: 'Personalised attention for every student with limited class sizes.' },
  { icon: '📝', title: 'Weekly Tests', desc: 'Regular assessments to track progress and reinforce learning.' },
  { icon: '📋', title: 'Weekly Progress Report', desc: 'Parents stay fully informed with detailed weekly updates.' },
  { icon: '🎉', title: 'Extra-Curricular Activities', desc: 'Educational tours, picnics, and interactive group activities weekly.' },
  { icon: '🆓', title: '3-Day Free Trial', desc: 'Experience the quality of our teaching before you enroll — no cost.' },
  { icon: '🏠', title: 'Home Tuition', desc: 'Well-experienced teachers available for one-on-one home sessions.' },
  { icon: '🚌', title: 'Pick & Drop Service', desc: 'Convenient transportation for students to and from the centre.' },
];

const CLASS_PROGRAMS = [
  {
    range: 'Class 1 – 4',
    color: 'lp-prog-green',
    subjects: ['Homework Support', 'All Core Subjects'],
  },
  {
    range: 'Class 5 – 7',
    color: 'lp-prog-blue',
    subjects: ['Math & Science', 'English & Nepali', 'Computer', 'Social Studies'],
  },
  {
    range: 'Class 8 – 10',
    color: 'lp-prog-purple',
    subjects: ['Math & Science', 'Optional Mathematics', 'Computer', 'Account'],
  },
];

const TIMINGS = [
  { session: 'Morning', time: '7:00 – 9:00 AM', icon: '🌅' },
  { session: 'Evening', time: '5:00 – 7:00 PM', icon: '🌆' },
];

export default function LandingPage(): React.ReactElement {
 
  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo-link">
            <Image src="/logo.jpeg" alt="Bitverse Tuition Center" width={48} height={48} className="lp-logo-img" />
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
            alt="Bitverse Tuition Center students"
            fill
            className="lp-hero-img"
            priority
          />
          <div className="lp-hero-overlay" />
        </div>
        <div className="lp-hero-content">
          <span className="lp-hero-badge">Admission Open · Classes 1 – 10</span>
          <h1 className="lp-hero-title">
            Personal Attention,<br />
            <span className="lp-hero-title-accent">Real Results</span>
          </h1>
          <p className="lp-hero-subtitle">
            Bitverse Tuition Center connects dedicated teachers with students in Naubise. Small batches, flexible timings, and a 3-day free trial — because your child's future matters.
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

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-how">
        <div className="lp-container">
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-section-title">We Connect Teachers With Students</h2>
          <p className="lp-section-sub">
            Finding the right teacher shouldn't be hard. Bitverse bridges the gap — matching experienced, subject-specialist teachers with students who need them, whether at our centre or through home tuition.
          </p>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <h3>Enquire</h3>
              <p>Tell us your class, subjects, and preferred timing — takes under a minute.</p>
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
              <p>Attend your first 3 classes completely free and see the difference.</p>
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
          <div className="lp-section-label">Why Parents Choose Us</div>
          <h2 className="lp-section-title">Everything Your Child Needs to Excel</h2>
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

      {/* ── CLASS PROGRAMS ── */}
      <section className="lp-section" id="programs">
        <div className="lp-container">
          <div className="lp-section-label">Our Programs</div>
          <h2 className="lp-section-title">Classes Tailored for Every Grade</h2>
          <div className="lp-programs-grid">
            {CLASS_PROGRAMS.map(({ range, color, subjects }) => (
              <div key={range} className={`lp-program-card panel ${color}`}>
                <h3 className="lp-program-range">{range}</h3>
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
      <section className="lp-section lp-timings-section" id="timings">
        <div className="lp-container">
          <div className="lp-section-label">Class Schedule</div>
          <h2 className="lp-section-title">Flexible Timings to Suit Your Day</h2>
          <div className="lp-timings-grid">
            {TIMINGS.map(({ session, time, icon }) => (
              <div key={session} className="lp-timing-card panel">
                <span className="lp-timing-icon">{icon}</span>
                <div>
                  <div className="lp-timing-session">{session} Session</div>
                  <div className="lp-timing-time">{time}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="lp-timings-note">
            Home tuition timings are flexible and arranged directly with the teacher.
          </p>
        </div>
      </section>

      {/* ── EXTRA-CURRICULAR ── */}
      <section className="lp-section lp-extra-section">
        <div className="lp-container lp-extra-inner">
          <div className="lp-extra-text">
            <div className="lp-section-label">Beyond the Classroom</div>
            <h2 className="lp-section-title">Extra-Curricular Activities</h2>
            <p className="lp-section-sub">
              Learning isn't just about textbooks. Every week we organise interactive sessions, and throughout the year students enjoy educational tours, fun picnics, and group activities that build confidence and teamwork.
            </p>
            <ul className="lp-extra-list">
              <li>🚌 Educational Tours</li>
              <li>🧺 Picnics & Outings</li>
              <li>🤝 Group Activities</li>
              <li>🎓 Interactive Learning (weekly)</li>
            </ul>
          </div>
          <div className="lp-extra-badge-wrap">
            <div className="lp-extra-badge">
              <span className="lp-extra-badge-num">100%</span>
              <span className="lp-extra-badge-label">Holistic Education</span>
            </div>
            <div className="lp-extra-badge">
              <span className="lp-extra-badge-num">3</span>
              <span className="lp-extra-badge-label">Free Trial Classes</span>
            </div>
            <div className="lp-extra-badge">
              <span className="lp-extra-badge-num">1–10</span>
              <span className="lp-extra-badge-label">All Classes Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-section lp-contact-section" id="contact">
        <div className="lp-container">
          <div className="lp-section-label">Get In Touch</div>
          <h2 className="lp-section-title">Visit Us or Call Today</h2>
          <div className="lp-contact-grid">
            <div className="lp-contact-card panel">
              <div className="lp-contact-icon">📍</div>
              <h3>Location</h3>
              <p>Shishuwa, Naubise<br />Opposite Naubise Milk Dairy</p>
            </div>
            <div className="lp-contact-card panel">
              <div className="lp-contact-icon">📞</div>
              <h3>Phone</h3>
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
            <p className="lp-cta-sub">Claim your 3 free trial classes — no obligation, no payment required.</p>
          </div>
          <a href="tel:9846940545" className="btn btn-primary lp-btn-lg">Call Us Now</a>
          <a href="tel:9846940545" className="lp-hero-phones">📞 9846940545</a>
          <a href="tel:9765941104" className="lp-hero-phones">📞 9765941104</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <Image src="/logo.jpeg" alt="Bitverse Tuition Center" width={36} height={36} className="lp-logo-img" />
            <span>Bitverse Tuition Center</span>
          </div>
          <p className="lp-footer-tagline">Personal Attention, Real Results</p>
          <div className="lp-footer-links">
            <a href="https://www.facebook.com/BitverseTech" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://www.youtube.com/@Bitverse-Tuition" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="tel:9846940545">9846940545</a>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Bitverse Tuition Center. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
