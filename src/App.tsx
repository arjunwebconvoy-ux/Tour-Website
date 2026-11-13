/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { DestinationView } from './components/DestinationView';
import { PackageDetailView } from './components/PackageDetailView';
import { BookingFlowView } from './components/BookingFlowView';
import { AccountView } from './components/AccountView';
import { SupportView } from './components/SupportView';
import { AppView, SearchQueryState } from './types/travel';

const DEFAULT_SEARCH_STATE: SearchQueryState = {
  mode: 'all',
  origin: '',
  destination: '',
  departureDate: '2026-12-05',
  returnDate: '2026-12-12',
  travelers: 2,
  maxPriceUsd: 3500,
  durationFilter: 'any',
  minRating: 0,
  amenities: [],
  sortBy: 'recommended',
};

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 p-8">
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              A data or connection error interrupted this view. Reloading will restore your session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function WayfareShell() {
  const [activeView, setActiveView] = useState<AppView>({ name: 'home' });
  const [searchQuery, setSearchQuery] = useState<SearchQueryState>(DEFAULT_SEARCH_STATE);

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  const handleUpdateSearch = (patch: Partial<SearchQueryState>) => {
    setSearchQuery((prev) => ({ ...prev, ...patch }));
  };

  const handleResetSearch = () => {
    setSearchQuery(DEFAULT_SEARCH_STATE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        onResetSearch={handleResetSearch}
      />

      <main className="flex-1">
        {activeView.name === 'home' && (
          <HomeView
            searchQuery={searchQuery}
            onUpdateSearch={handleUpdateSearch}
            onNavigate={handleNavigate}
          />
        )}

        {activeView.name === 'search' && (
          <SearchView
            searchQuery={searchQuery}
            onUpdateSearch={handleUpdateSearch}
            onNavigate={handleNavigate}
            onResetSearch={handleResetSearch}
          />
        )}

        {activeView.name === 'destination' && (
          <DestinationView
            destinationId={activeView.destinationId}
            onNavigate={handleNavigate}
            onUpdateSearch={handleUpdateSearch}
          />
        )}

        {activeView.name === 'package' && (
          <PackageDetailView
            packageId={activeView.packageId}
            onNavigate={handleNavigate}
          />
        )}

        {activeView.name === 'booking' && (
          <BookingFlowView
            initialDraft={activeView.draft}
            onNavigate={handleNavigate}
          />
        )}

        {activeView.name === 'account' && (
          <AccountView
            initialTab={activeView.tab}
            onNavigate={handleNavigate}
          />
        )}

        {activeView.name === 'support' && <SupportView onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <FirebaseProvider>
        <WayfareShell />
      </FirebaseProvider>
    </AppErrorBoundary>
  );
}
