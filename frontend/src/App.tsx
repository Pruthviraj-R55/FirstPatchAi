import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Workspace } from './components/Workspace';
import { IllustrativeResults } from './components/IllustrativeResults';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import type { AnalysisResult } from './types/api';

export const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  return (
    <div className="app-container">
      {/* Background Grid Pattern */}
      <div className="bg-grid-pattern" aria-hidden="true" />

      {/* Main Content Layer */}
      <div className="content-layer">
        <Navbar />
        <main>
          <Hero />
          <Workspace onAnalysisComplete={setAnalysisResult} />
          <IllustrativeResults result={analysisResult} />
          <HowItWorks />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
