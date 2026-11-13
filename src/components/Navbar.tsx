import React, { useState } from 'react';
import { Menu, UserCheck, X } from 'lucide-react';
import { AppView } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onResetSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onResetSearch,
}) => {
  const { user, profile, authBusy, signInWithGoogle } = useFirebase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { label: string; isActive: boolean; action: () => void }[] = [
    {
      label: 'Destinations',
      isActive: activeView.name === 'destination',
      action: () => onNavigate({ name: 'destination', destinationId: 'kyoto' }),
    },
    {
      label: 'Packages',
      isActive: activeView.name === 'package',
      action: () => onNavigate({ name: 'package', packageId: 'pkg-kyoto-autumn' }),
    },
    {
      label: 'Search',
      isActive: activeView.name === 'search',
      action: () => {
        onResetSearch();
        onNavigate({ name: 'search' });
      },
    },
    {
      label: 'My Trips',
      isActive: activeView.name === 'account',
      action: () => onNavigate({ name: 'account', tab: 'bookings' }),
    },
    {
      label: 'Support',
      isActive: activeView.name === 'support',
      action: () => onNavigate({ name: 'support' }),
    },
  ];

  const firstName = (profile?.displayName || user?.displayName || 'Account')
    .split(' ')[0]
    .slice(0, 14);

  const handlePrimaryAction = async () => {
    if (user) {
      onNavigate({ name: 'account', tab: 'profile' });
    } else {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        onNavigate({ name: 'account', tab: 'bookings' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate({ name: 'home' })}
          className="font-display text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded-md px-1"
        >
          Wayfare
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded-sm ${
                item.isActive
                  ? 'border-teal-700 text-slate-900'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action (desktop) + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={authBusy}
            onClick={handlePrimaryAction}
            className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 min-h-[40px]"
          >
            {user ? (
              <>
                <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{firstName}</span>
              </>
            ) : (
              <span>{authBusy ? 'Signing in...' : 'Sign in'}</span>
            )}
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.action();
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                item.isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => {
                setMobileMenuOpen(false);
                void handlePrimaryAction();
              }}
              className="w-full py-3 px-4 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors min-h-[44px]"
            >
              {user ? `Account (${firstName})` : authBusy ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
