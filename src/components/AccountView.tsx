import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  LogOut,
  Trash2,
  XCircle,
} from 'lucide-react';
import { formatMoney } from '../data/catalog';
import {
  AppView,
  BookingRecord,
  CurrencyCode,
  TravelStyle,
} from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface AccountViewProps {
  initialTab?: 'profile' | 'saved' | 'bookings' | 'tickets';
  onNavigate: (view: AppView) => void;
}

const TRAVEL_STYLES: TravelStyle[] = [
  'Cultural',
  'Alpine & Rail',
  'Coastal',
  'Slow Luxury',
  'Adventure',
];

export const AccountView: React.FC<AccountViewProps> = ({
  initialTab = 'bookings',
  onNavigate,
}) => {
  const {
    user,
    authReady,
    authBusy,
    authError,
    profile,
    privateInfo,
    currency,
    savedTrips,
    bookings,
    supportTickets,
    dataLoading,
    signInWithGoogle,
    signOutUser,
    updateProfileData,
    toggleSaveTrip,
    requestBookingCancellation,
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<'bookings' | 'saved' | 'profile' | 'tickets'>(
    initialTab
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>('USD');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Cultural');
  const [phone, setPhone] = useState('');
  const [homeAirport, setHomeAirport] = useState('');
  const [passportNationality, setPassportNationality] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPreferredCurrency(profile.preferredCurrency || 'USD');
      setTravelStyle(profile.travelStyle || 'Cultural');
    }
    if (privateInfo) {
      setPhone(privateInfo.phone || '');
      setHomeAirport(privateInfo.homeAirport || '');
      setPassportNationality(privateInfo.passportNationality || '');
    }
  }, [profile, privateInfo]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await updateProfileData({
        displayName,
        preferredCurrency,
        travelStyle,
        phone,
        homeAirport,
        passportNationality,
      });
      setProfileMessage('Profile preferences and private contact details saved.');
    } catch (err) {
      setProfileMessage(
        err instanceof Error ? err.message : 'Unable to save profile updates.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSubmitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelError(null);
    if (cancelReason.trim().length < 5) {
      setCancelError('Please enter a brief reason (at least 5 characters).');
      return;
    }
    setCancelBusy(true);
    try {
      await requestBookingCancellation(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation request failed.');
    } finally {
      setCancelBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-slate-600">
        Loading account session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-slate-900">
            Sign in to Wayfare
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Access your saved destinations, confirmed reservations, cancellation requests, and
            traveler preferences across devices.
          </p>
          {authError && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {authError}
            </div>
          )}
          <div className="mt-7">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {authBusy ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Secured with Google Authentication and private Firestore profile isolation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Account Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={profile?.displayName || user.displayName || 'Traveler'}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center font-semibold text-lg">
              {(profile?.displayName || user.displayName || 'T')[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {profile?.displayName || user.displayName || 'Traveler'}
            </h1>
            <p className="text-xs text-slate-500">
              {privateInfo?.email || user.email} · {profile?.travelStyle || 'Cultural'} Traveler
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOutUser()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[40px]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Account Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'bookings', label: `Bookings (${bookings.length})` },
          { id: 'saved', label: `Saved Trips (${savedTrips.length})` },
          { id: 'profile', label: 'Profile & Contact' },
          { id: 'tickets', label: `Support Tickets (${supportTickets.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[40px] ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {dataLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-600">
                Loading your reservations...
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <h2 className="text-lg font-semibold text-slate-900">No bookings yet</h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Explore destinations, flights, stays, and curated packages to book your next trip.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'search' })}
                  className="mt-5 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                >
                  Search trips
                </button>
              </div>
            ) : (
              bookings.map((bk) => (
                <article
                  key={bk.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-mono font-semibold text-slate-700">{bk.bookingRef}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          bk.status === 'confirmed'
                            ? 'text-teal-700'
                            : bk.status === 'cancellation_requested'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {bk.status === 'confirmed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Confirmed</span>
                          </>
                        ) : bk.status === 'cancellation_requested' ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Cancellation Requested</span>
                          </>
                        ) : (
                          <span>Cancelled</span>
                        )}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{bk.itemTitle}</h2>
                    <p className="text-sm text-slate-600 tabular-nums">
                      {bk.destinationName} · {bk.departureDate} to {bk.returnDate} · {bk.adults}{' '}
                      adults{bk.children > 0 ? `, ${bk.children} children` : ''} · {bk.cabinOrRoom}
                    </p>
                    {bk.cancellationReason && (
                      <p className="text-xs text-amber-800 pt-1">
                        Cancellation note: {bk.cancellationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="block text-xs text-slate-500">Total fare</span>
                      <span className="text-xl font-semibold text-slate-900 tabular-nums">
                        {formatMoney(bk.totalPriceUsd, currency)}
                      </span>
                    </div>
                    {bk.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelTarget(bk);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        Request cancellation
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedTrips.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <Bookmark className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900">No saved trips yet</h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Click the bookmark icon on any destination, tour package, flight, or stay to keep
                  it here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'home' })}
                  className="mt-5 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                >
                  Discover destinations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTrips.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-slate-100">
                        <TravelImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <span className="text-xs text-slate-500 capitalize">{item.itemType}</span>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 tabular-nums text-sm">
                        {formatMoney(item.priceUsd, currency)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.itemType === 'destination') {
                              onNavigate({ name: 'destination', destinationId: item.itemId });
                            } else if (item.itemType === 'package') {
                              onNavigate({ name: 'package', packageId: item.itemId });
                            } else {
                              onNavigate({ name: 'search' });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${item.title}`}
                          onClick={() =>
                            void toggleSaveTrip({
                              itemId: item.itemId,
                              itemType: item.itemType,
                              title: item.title,
                              subtitle: item.subtitle,
                              priceUsd: item.priceUsd,
                              imageUrl: item.imageUrl,
                            })
                          }
                          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 max-w-3xl space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Traveler profile &amp; contact</h2>
              <p className="mt-1 text-sm text-slate-600">
                Contact and passport details are stored in an owner-isolated private record.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Display Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <div>
                <label htmlFor="prof-currency" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Currency
                </label>
                <select
                  id="prof-currency"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-style" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Travel Style
                </label>
                <select
                  id="prof-style"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  {TRAVEL_STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prof-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number (Private)
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 0148"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-airport" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Home Departure Airport (Private)
                </label>
                <input
                  id="prof-airport"
                  type="text"
                  value={homeAirport}
                  onChange={(e) => setHomeAirport(e.target.value)}
                  placeholder="e.g., SFO, JFK, LHR"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <div>
                <label htmlFor="prof-nationality" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Passport Nationality (Private)
                </label>
                <input
                  id="prof-nationality"
                  type="text"
                  value={passportNationality}
                  onChange={(e) => setPassportNationality(e.target.value)}
                  placeholder="e.g., United States, Canada"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {profileMessage && (
              <p className="text-sm font-medium text-teal-800">{profileMessage}</p>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 min-h-[42px]"
            >
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your support requests</h2>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'support' })}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                New support request
              </button>
            </div>
            {supportTickets.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-sm text-slate-600">
                You have no open support tickets. Visit Support for FAQs or to contact our desk.
              </div>
            ) : (
              supportTickets.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {t.category}
                      {t.bookingRef ? ` · Ref ${t.bookingRef}` : ''}
                    </span>
                    <span className="font-semibold capitalize text-teal-700">
                      Status: {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900">{t.subject}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{t.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancellation Request Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <h2 id="cancel-modal-title" className="text-lg font-semibold text-slate-900">
              Request cancellation ({cancelTarget.bookingRef})
            </h2>
            <p className="text-sm text-slate-600">
              Submitting a cancellation request notifies our operations desk to process your refund
              for <span className="font-medium text-slate-900">{cancelTarget.itemTitle}</span>.
            </p>
            <form onSubmit={handleSubmitCancellation} className="space-y-4">
              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for cancellation
                </label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  maxLength={400}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Schedule conflict, flight change, medical reason..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              {cancelError && <p className="text-xs text-red-700">{cancelError}</p>}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Keep booking
                </button>
                <button
                  type="submit"
                  disabled={cancelBusy}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {cancelBusy ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
