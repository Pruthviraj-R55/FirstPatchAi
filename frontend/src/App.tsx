import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Workspace } from './components/Workspace';
import { IllustrativeResults } from './components/IllustrativeResults';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* Background Grid Pattern */}
      <div className="bg-grid-pattern" aria-hidden="true" />

      {/* Main Content Layer */}
      <div className="content-layer">
        <Navbar />
        <main>
          <Hero />
          <Workspace />
          <IllustrativeResults />
          <HowItWorks />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
