import React, { useMemo, useState } from 'react';
import { learningFaqs, troubleshootingEntries } from '../learning/learningContent';

type FaqCategory = 'All topics' | 'Git basics' | 'GitHub workflow' | 'First contributions' | 'FirstPatch AI';
const categories: FaqCategory[] = ['All topics', 'Git basics', 'GitHub workflow', 'First contributions', 'FirstPatch AI'];

interface FAQSectionProps {
  onOpenModule: (moduleId: string) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenModule }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FaqCategory>('All topics');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaqs = useMemo(() => learningFaqs.filter((item) => {
    const matchesCategory = category === 'All topics' || item.category === category;
    const matchesQuery = !normalizedQuery || `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  }), [category, normalizedQuery]);
  const filteredTroubleshooting = useMemo(() => troubleshootingEntries.filter((item) => {
    if (!normalizedQuery) return true;
    return `${item.error} ${item.means} ${item.why} ${item.diagnose} ${item.safeFix} ${item.prevent}`.toLowerCase().includes(normalizedQuery);
  }), [normalizedQuery]);

  return (
    <section className="learn-faq" aria-labelledby="faq-title">
      <header className="learn-section-heading">
        <div>
          <p className="learn-eyebrow">Questions and fixes</p>
          <h2 id="faq-title">FAQ & troubleshooting</h2>
          <p>Search common Git questions and safe first steps for familiar errors.</p>
        </div>
      </header>

      <label className="learn-search-label" htmlFor="learn-faq-search">Search questions and errors</label>
      <input id="learn-faq-search" className="learn-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “branch”, “push”, or “permission denied”" />
      <div className="learn-faq-categories" role="group" aria-label="Filter questions by category">
        {categories.map((item) => <button type="button" key={item} className={`learn-filter-chip${category === item ? ' is-selected' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>

      <div className="learn-faq-list">
        {filteredFaqs.map((item) => (
          <details className="learn-faq-item" key={item.question}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <div className="learn-faq-answer"><p>{item.answer}</p>{item.moduleId && <button type="button" className="learn-inline-link" onClick={() => onOpenModule(item.moduleId!)}>Read the related notes <span aria-hidden="true">→</span></button>}</div>
          </details>
        ))}
        {filteredFaqs.length === 0 && <p className="learn-no-results" role="status">No questions match that search. Try another word or choose “All topics”.</p>}
      </div>

      <section className="learn-troubleshooting" aria-labelledby="troubleshooting-title">
        <div className="learn-section-subheading"><div><p className="learn-eyebrow">Safe first checks</p><h3 id="troubleshooting-title">Troubleshooting Git errors</h3></div></div>
        <div className="learn-faq-list">
          {filteredTroubleshooting.map((item) => <details className="learn-faq-item troubleshooting-item" key={item.error}>
            <summary><code>{item.error}</code><span aria-hidden="true">+</span></summary>
            <div className="learn-faq-answer troubleshooting-answer">
              <p><strong>What it means:</strong> {item.means}</p>
              <p><strong>Why it happens:</strong> {item.why}</p>
              <p><strong>Diagnose:</strong> {item.diagnose}</p>
              <p><strong>Safe solution:</strong> {item.safeFix}</p>
              <p><strong>Prevent it:</strong> {item.prevent}</p>
            </div>
          </details>)}
          {filteredTroubleshooting.length === 0 && normalizedQuery && <p className="learn-no-results" role="status">No troubleshooting entries match. Try searching for “remote”, “commit”, or “conflict”.</p>}
        </div>
        <p className="learn-safety-note">Avoid destructive commands such as `git reset --hard` and `git push --force` unless you understand exactly which work or shared history could be lost.</p>
      </section>
    </section>
  );
};
