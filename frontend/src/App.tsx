import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Workspace } from './components/Workspace';
import { IllustrativeResults } from './components/IllustrativeResults';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import type { AnalysisResult } from './types/api';

type AppPage = 'home' | 'analyze' | 'results';

function pageForPath(pathname: string): AppPage {
  if (pathname === '/analyze') return 'analyze';
  if (pathname === '/results') return 'results';
  return 'home';
}

export const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisVersion, setAnalysisVersion] = useState(0);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [page, setPage] = useState<AppPage>(() => {
    const initialPage = pageForPath(window.location.pathname);
    if (initialPage === 'results') {
      window.history.replaceState(null, '', '/analyze');
      return 'analyze';
    }
    return initialPage;
  });

  const navigate = useCallback((destination: string, replace = false, allowEmptyResults = false) => {
    const url = new URL(destination, window.location.origin);
    let nextPage = pageForPath(url.pathname);
    let nextPath = nextPage === 'home' ? '/' : url.pathname;

    if (nextPage === 'results' && !analysisResult && !allowEmptyResults) {
      nextPage = 'analyze';
      nextPath = '/analyze';
    }

    const nextLocation = `${nextPath}${nextPage === 'home' ? url.hash : ''}`;
    if (window.location.pathname + window.location.hash === nextLocation) {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const historyMethod = replace ? 'replaceState' : 'pushState';
    window.history[historyMethod](null, '', nextLocation);
    setPage(nextPage);

    if (nextPage === 'home' && url.hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(url.hash.slice(1))?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [analysisResult]);

  useEffect(() => {
    const handlePopState = () => {
      let nextPage = pageForPath(window.location.pathname);
      if (nextPage === 'results' && !analysisResult) {
        window.history.replaceState(null, '', '/analyze');
        nextPage = 'analyze';
      }
      setPage(nextPage);
      if (nextPage === 'home' && window.location.hash) {
        window.requestAnimationFrame(() => {
          document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'auto' });
        });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [analysisResult]);

  const handleAnalysisComplete = (result: AnalysisResult | null) => {
    // Keep a previous result and its user-managed checklists until a new analysis succeeds.
    if (!result) return;
    setAnalysisResult(result);
    setAnalysisVersion((version) => version + 1);
    navigate('/results', false, true);
  };

  const startNewAnalysis = () => {
    setWorkspaceVersion((version) => version + 1);
    navigate('/analyze');
  };

  return (
    <div id="top" className="app-container">
      <div className="bg-grid-pattern" aria-hidden="true" />
      <div className="content-layer">
        <Navbar page={page} onNavigate={navigate} hasResult={Boolean(analysisResult)} />
        <main>
          <section className="page-view" hidden={page !== 'home'} aria-label="Home">
            <Hero onNavigate={navigate} />
            <section className="home-value-section" aria-labelledby="value-heading">
              <div className="section-container">
                <p className="section-kicker">From issue to first contribution</p>
                <h2 id="value-heading">A clearer starting point for an unfamiliar codebase.</h2>
                <p>Upload selected files to understand their purpose, inspect evidence-backed potential problems, and find an informed starting point. Add an optional issue description to focus the investigation. FirstPatch AI only reviews the files you provide; it does not execute code.</p>
              </div>
            </section>
            <HowItWorks />
            <Features />
          </section>

          <section className="page-view analyze-page" hidden={page !== 'analyze'} aria-labelledby="analyze-page-heading">
            <div className="section-container">
              <div className="page-heading-row">
                <div>
                  <p className="section-kicker">Understand the supplied code</p>
                  <h1 id="analyze-page-heading">Find your starting point.</h1>
                  <p>Upload source files to understand what they do and surface potential problems. Add an issue description only when you want the analysis to investigate a specific symptom.</p>
                </div>
                <a className="page-back-link" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Back to Home</a>
              </div>
              <Workspace key={workspaceVersion} onAnalysisComplete={handleAnalysisComplete} />
            </div>
          </section>

          <section className="page-view results-page" hidden={page !== 'results'} aria-label="Analysis results">
            <div className="section-container results-route-actions">
              <div>
                <p className="section-kicker">Selected-file analysis</p>
                <h1>Understand the code. Choose where to begin.</h1>
              </div>
              <div className="route-action-buttons">
                <a className="btn-secondary" href="/analyze" onClick={(event) => { event.preventDefault(); navigate('/analyze'); }}>Back to submission</a>
                <a className="btn-primary" href="/analyze" onClick={(event) => { event.preventDefault(); startNewAnalysis(); }}>Start a new analysis</a>
              </div>
            </div>
            <IllustrativeResults key={analysisVersion} result={analysisResult} />
          </section>
        </main>
        <Footer onNavigate={navigate} />
      </div>
    </div>
  );
};

export default App;
