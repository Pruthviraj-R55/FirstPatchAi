import React, { useMemo, useState } from 'react';
import { FAQSection } from './FAQSection';
import { LearningRoadmap } from './LearningRoadmap';
import { learningModules, type LearningModule } from '../learning/learningContent';
import '../styles/LearningHub.css';

type LearningSection = 'notes' | 'roadmap' | 'faq';
const learningSections: { id: LearningSection; label: string }[] = [
  { id: 'notes', label: 'Git & GitHub notes' },
  { id: 'roadmap', label: 'Learning roadmap' },
  { id: 'faq', label: 'FAQ & troubleshooting' },
];

interface LearningHubProps {
  onNavigate: (destination: string) => void;
}

function moduleMatches(module: LearningModule, query: string): boolean {
  const { commands: _commands, ...moduleContent } = module;
  return JSON.stringify(moduleContent).toLowerCase().includes(query);
}

export const LearningHub: React.FC<LearningHubProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<LearningSection>('notes');
  const [openModule, setOpenModule] = useState<string>('version-control');
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const visibleModules = useMemo(() => learningModules.flatMap((module) => {
    if (!normalizedSearch) return [{ module, commands: module.commands ?? [] }];
    if (moduleMatches(module, normalizedSearch)) return [{ module, commands: module.commands ?? [] }];
    const matchingCommands = (module.commands ?? []).filter((item) => JSON.stringify(item).toLowerCase().includes(normalizedSearch));
    return matchingCommands.length ? [{ module, commands: matchingCommands }] : [];
  }), [normalizedSearch]);

  const openRelatedModule = (moduleId: string) => {
    setOpenModule(moduleId);
    setActiveSection('notes');
    setSearch('');
    window.history.replaceState(null, '', '/learn#notes');
    window.requestAnimationFrame(() => document.getElementById(`learn-module-${moduleId}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  };

  return (
    <div className="learn-page">
      <div className="learn-hero">
        <div className="learn-hero-copy">
          <p className="learn-eyebrow">A practical guide for your first patch</p>
          <h1>Learn Git. Find your way into open source.</h1>
          <p>Short, practical notes for understanding version control, collaborating on GitHub, and preparing a focused contribution. No account or completed lessons required.</p>
          <div className="learn-hero-actions">
            <button type="button" className="learn-primary-action" onClick={() => onNavigate('/analyze')}>Understand selected files <span aria-hidden="true">→</span></button>
            <a className="learn-secondary-action" href="#learn-content" onClick={() => setActiveSection('roadmap')}>Explore the learning path</a>
          </div>
        </div>
        <aside className="learn-hero-note" aria-label="How to use this hub">
          <span className="learn-note-label">Start anywhere</span>
          <p>Use the notes as a reference, check off roadmap tasks as you learn, or search for a Git question.</p>
          <span className="learn-note-rule" />
          <p className="learn-note-foot">The analyzer stays available whenever you need it.</p>
        </aside>
      </div>

      <div className="learn-content-wrap" id="learn-content">
        <nav className="learn-section-nav" aria-label="Learning Hub sections" role="tablist">
          {learningSections.map((section, index) => <button
            type="button"
            role="tab"
            key={section.id}
            id={`learn-tab-${section.id}`}
            tabIndex={activeSection === section.id ? 0 : -1}
            aria-selected={activeSection === section.id}
            aria-controls={`learn-panel-${section.id}`}
            className={`learn-section-tab${activeSection === section.id ? ' is-active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            onKeyDown={(event) => {
              const key = event.key;
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;
              event.preventDefault();
              const nextIndex = key === 'Home' ? 0 : key === 'End' ? learningSections.length - 1 : (index + (key === 'ArrowRight' ? 1 : -1) + learningSections.length) % learningSections.length;
              const nextSection = learningSections[nextIndex];
              setActiveSection(nextSection.id);
              document.getElementById(`learn-tab-${nextSection.id}`)?.focus();
            }}
          >{section.label}</button>)}
        </nav>

        <section id="learn-panel-notes" className="learn-panel" role="tabpanel" aria-labelledby="learn-tab-notes" hidden={activeSection !== 'notes'}>
          <header className="learn-section-heading learn-notes-heading">
            <div><p className="learn-eyebrow">Reference library · 6 modules</p><h2>Git & GitHub notes</h2><p>Learn the concepts, review a command when you need it, and practice in a repository of your own.</p></div>
            <label className="learn-search-wrap"><span>Search the notes</span><input className="learn-search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a topic or command" /></label>
          </header>

          <div className="learn-module-list">
            {visibleModules.map(({ module, commands }) => {
              const isOpen = openModule === module.id;
              const moduleCommands = module.commands ? commands : undefined;
              return <article className={`learn-module${isOpen ? ' is-open' : ''}`} key={module.id} id={`learn-module-${module.id}`}>
                <button type="button" className="learn-module-toggle" aria-expanded={isOpen} aria-controls={`learn-module-content-${module.id}`} onClick={() => setOpenModule(isOpen ? '' : module.id)}>
                  <span className="learn-module-number">{module.number}</span><span className="learn-module-title"><strong>{module.title}</strong><small>{module.summary}</small></span><span className="learn-module-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <div id={`learn-module-content-${module.id}`} className="learn-module-content">
                  <p className="learn-module-intro">{module.explanation}</p>
                  <div className="learn-module-columns">
                    <section><h3>Key terms</h3><ul>{module.terms.map((term) => <li key={term}>{term}</li>)}</ul></section>
                    <section><h3>Example</h3><p className="learn-example">{module.example}</p></section>
                  </div>
                  {module.steps && <section className="learn-workflow"><h3>Contribution workflow</h3><ol>{module.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>}
                  {module.commands && <section className="learn-commands"><div className="learn-subsection-heading"><div><h3>Command reference</h3><p>Expand a command for its syntax, example, and common mistakes.</p></div><span>{moduleCommands?.length ?? 0} shown</span></div>
                    <div className="learn-command-list">{moduleCommands?.map((item) => <details className="learn-command" key={item.command}><summary><code>{item.command}</code><span>{item.purpose}</span><span aria-hidden="true">+</span></summary><div className="learn-command-details"><p><strong>Syntax</strong><code>{item.syntax}</code></p><p><strong>Example</strong><code>{item.example}</code></p><p><strong>When to use it</strong>{item.when}</p><p><strong>Expected behavior</strong>{item.expected}</p><p><strong>Common mistake</strong>{item.mistakes}</p></div></details>)}</div>
                  </section>}
                  <div className="learn-module-columns learn-practice-grid"><section><h3>Common mistakes</h3><ul>{module.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section><section className="learn-practice"><h3>Try it</h3><p>{module.practice}</p></section></div>
                </div>}
              </article>;
            })}
            {visibleModules.length === 0 && <p className="learn-no-results" role="status">No notes match that search. Try “branch”, “commit”, or “pull request”.</p>}
          </div>
          <div className="learn-analyzer-callout"><div><strong>Ready to look at code?</strong><p>The analyzer can explain selected source files even if you do not have an issue description.</p></div><button type="button" className="learn-inline-link" onClick={() => onNavigate('/analyze')}>Open analyzer <span aria-hidden="true">→</span></button></div>
        </section>

        <section id="learn-panel-roadmap" className="learn-panel" role="tabpanel" aria-labelledby="learn-tab-roadmap" hidden={activeSection !== 'roadmap'}><LearningRoadmap /></section>
        <section id="learn-panel-faq" className="learn-panel" role="tabpanel" aria-labelledby="learn-tab-faq" hidden={activeSection !== 'faq'}><FAQSection onOpenModule={openRelatedModule} /></section>
      </div>
    </div>
  );
};
