/**
 * /support — PerfectASIN support page
 * Embeds SophiaChat in "page" mode.
 */

import SophiaChat from '../components/SophiaChat';

export default function SupportPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0A1929' }}
    >
      {/* ── Slim nav ──────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <a
          href="https://perfectasin.com"
          className="flex items-center gap-2 no-underline"
          aria-label="PerfectASIN home"
        >
          {/* Logo mark */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <rect width="28" height="28" rx="6" fill="#FF9900" />
            <path
              d="M8 14l4 4 8-8"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: '#FFFFFF' }}
          >
            PerfectASIN
          </span>
        </a>

        <span
          className="text-sm font-medium"
          style={{ color: '#64748B' }}
        >
          Support
        </span>
      </header>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">

        {/* Left sidebar — visible on md+ */}
        <aside
          className="hidden md:flex flex-col gap-6 px-8 py-10 flex-shrink-0"
          style={{
            width: 280,
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Sophia intro */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative">
              <img
                src="/sophia-avatar.png"
                alt="Sophia"
                className="rounded-full object-cover"
                style={{
                  width: 72,
                  height: 72,
                  border: '2px solid rgba(255,153,0,0.4)',
                }}
                onError={(e) => {
                  // Fallback initials avatar
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const fallback = (e.currentTarget as HTMLImageElement)
                    .nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Initials fallback — hidden by default */}
              <div
                className="rounded-full items-center justify-center font-bold text-white text-xl"
                style={{
                  display: 'none',
                  width: 72,
                  height: 72,
                  background: 'linear-gradient(135deg, #1B3A5C 0%, #2a4a6b 100%)',
                  border: '2px solid rgba(255,153,0,0.4)',
                }}
                aria-hidden="true"
              >
                S
              </div>
              {/* Online dot */}
              <span
                className="absolute bottom-0.5 right-0.5 rounded-full block"
                style={{
                  width: 14,
                  height: 14,
                  background: '#22C55E',
                  border: '2px solid #0A1929',
                }}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="font-semibold text-white text-base">Sophia</h2>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                Chief Customer Success Manager
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#22C55E' }}>
                ● Online now
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Quick links */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#475569' }}
            >
              Quick Help
            </p>
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Installation Guide', href: '#install' },
                { label: 'Pricing & Plans', href: '#pricing' },
                { label: 'Troubleshooting', href: '#troubleshoot' },
                { label: 'Account & Billing', href: '#billing' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors no-underline"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#E2E8F0';
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Contact fallback */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#475569' }}
            >
              Other Options
            </p>
            <a
              href="mailto:support@perfectasin.com"
              className="flex items-center gap-2 text-sm no-underline transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#FF9900')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8')
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              support@perfectasin.com
            </a>

            <a
              href="https://calendly.com/ravingfans/30min"
              className="flex items-center gap-2 text-sm no-underline transition-colors mt-2"
              style={{ color: '#94A3B8' }}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#FF9900')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8')
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Book a call with Dan
            </a>
          </div>
        </aside>

        {/* ── Chat area ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header — shown below md */}
          <div
            className="flex md:hidden items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="relative">
              <img
                src="/sophia-avatar.png"
                alt="Sophia"
                className="rounded-full object-cover"
                style={{
                  width: 36,
                  height: 36,
                  border: '1.5px solid rgba(255,153,0,0.4)',
                }}
              />
              <span
                className="absolute bottom-0 right-0 rounded-full block"
                style={{
                  width: 10,
                  height: 10,
                  background: '#22C55E',
                  border: '1.5px solid #0A1929',
                }}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Sophia</p>
              <p className="text-xs" style={{ color: '#22C55E' }}>
                Online
              </p>
            </div>
          </div>

          {/* The widget — fills remaining height */}
          <div className="flex-1 overflow-hidden">
            <SophiaChat source="perfectasin" mode="page" />
          </div>
        </main>
      </div>
    </div>
  );
}
