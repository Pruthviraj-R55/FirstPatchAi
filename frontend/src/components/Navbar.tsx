import React, { useEffect, useRef, useState } from 'react';
import '../styles/Navbar.css';

type AppPage = 'home' | 'analyze' | 'results';

interface NavbarProps {
  page: AppPage;
  hasResult: boolean;
  onNavigate: (destination: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ page, hasResult, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const follow = (event: React.MouseEvent<HTMLAnchorElement>, destination: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(destination);
  };

  const links = [
    { href: '/', label: 'Home' },
    ...(page === 'home' ? [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#features', label: 'Capabilities' },
    ] : []),
    { href: '/analyze', label: 'Understand code' },
    ...(hasResult ? [{ href: '/results', label: 'Results' }] : []),
  ];

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a className="navbar-brand" href="/" onClick={(event) => follow(event, '/')} aria-label="FirstPatch AI home">
          <span className="logo-symbol" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17L10 11L4 5" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19H20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand-name">FirstPatch <span className="brand-accent">AI</span></span>
        </a>

        <nav className="navbar-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} className={`nav-link${(link.href === '/' && page === 'home') || (link.href === '/analyze' && page === 'analyze') || (link.href === '/results' && page === 'results') ? ' is-active' : ''}`} href={link.href} aria-current={(link.href === '/' && page === 'home') || (link.href === '/analyze' && page === 'analyze') || (link.href === '/results' && page === 'results') ? 'page' : undefined} onClick={(event) => follow(event, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <a className="btn-get-started" href="/analyze" onClick={(event) => follow(event, '/analyze')}>
            <span>{page === 'analyze' ? 'Analysis workspace' : 'Understand code'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <button className="mobile-toggle" ref={mobileToggleRef} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation">
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-navigation" className="mobile-nav-drawer" aria-label="Mobile navigation">
          {links.map((link) => <a key={link.href} className="mobile-nav-link" href={link.href} onClick={(event) => follow(event, link.href)}>{link.label}</a>)}
          <a className="btn-get-started mobile-cta" href="/analyze" onClick={(event) => follow(event, '/analyze')}>Understand code</a>
        </nav>
      )}
    </header>
  );
};
