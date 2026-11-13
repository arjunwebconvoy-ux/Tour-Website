import React, { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Bus,
  Calendar,
  Car,
  Compass,
  Hotel,
  MapPin,
  Plane,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { DESTINATIONS, HERO_IMAGE, TOUR_PACKAGES, formatMoney } from '../data/catalog';
import { AppView, SearchQueryState, TravelMode } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface HomeViewProps {
  searchQuery: SearchQueryState;
  onUpdateSearch: (patch: Partial<SearchQueryState>) => void;
  onNavigate: (view: AppView) => void;
}

const SEARCH_MODES: { id: Exclude<TravelMode, 'all'>; label: string; icon: React.ReactNode }[] = [
  { id: 'package', label: 'Holiday Packages', icon: <Compass className="w-4 h-4" aria-hidden="true" /> },
  { id: 'flight', label: 'Flights', icon: <Plane className="w-4 h-4" aria-hidden="true" /> },
  { id: 'hotel', label: 'Hotels', icon: <Hotel className="w-4 h-4" aria-hidden="true" /> },
  { id: 'bus', label: 'Buses', icon: <Bus className="w-4 h-4" aria-hidden="true" /> },
  { id: 'car', label: 'Car Rentals', icon: <Car className="w-4 h-4" aria-hidden="true" /> },
];

export const HomeView: React.FC<HomeViewProps> = ({
  searchQuery,
  onUpdateSearch,
  onNavigate,
}) => {
  const { currency, reviews, user, isItemSaved, toggleSaveTrip, signInWithGoogle } = useFirebase();
  const [activeMode, setActiveMode] = useState<Exclude<TravelMode, 'all'>>(
    searchQuery.mode === 'all' ? 'package' : searchQuery.mode
  );
  const [origin, setOrigin] = useState(searchQuery.origin || '');
  const [destination, setDestination] = useState(searchQuery.destination || '');
  const [departureDate, setDepartureDate] = useState(searchQuery.departureDate || '2026-12-05');
  const [returnDate, setReturnDate] = useState(searchQuery.returnDate || '2026-12-12');
  const [travelers, setTravelers] = useState(searchQuery.travelers || 2);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSearch({
      mode: activeMode,
      origin: origin.trim(),
      destination: destination.trim(),
      departureDate,
      returnDate,
      travelers,
    });
    onNavigate({ name: 'search' });
  };

  const handleSaveDestination = async (dest: (typeof DESTINATIONS)[number]) => {
    if (!user) {
      setSaveNotice('Sign in with Google to save trips to your account.');
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      setSaveNotice(null);
    }
    const saved = await toggleSaveTrip({
      itemId: dest.id,
      itemType: 'destination',
      title: `${dest.name}, ${dest.country}`,
      subtitle: dest.tagline,
      priceUsd: dest.startingPriceUsd,
      imageUrl: dest.imageUrl,
    });
    setSaveNotice(saved ? `Saved ${dest.name} to your account.` : `Removed ${dest.name} from saved trips.`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const showOriginField = activeMode === 'flight' || activeMode === 'bus' || activeMode === 'car';

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <TravelImage
            src={HERO_IMAGE}
            alt="Sunlit Mediterranean limestone coast and wooden boat in turquoise cove"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-24 lg:pb-20">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-teal-200 mb-3">
              Curated Journeys · Multi-Modal Rail, Flights, Stays &amp; Coaches
            </p>
            <h1
              className="font-display font-semibold text-white tracking-tight leading-[1.08]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)', textWrap: 'balance' }}
            >
              Thoughtful journeys across rail, sea, and sky.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
              Compare direct flights, boutique stays, scenic coaches, rental cars, and small-group
              itineraries with clear all-in pricing and flexible rebooking.
            </p>
          </div>

          {/* Integrated Multi-Modal Search Bar */}
          <div className="mt-10 bg-white rounded-xl shadow-xl border border-slate-200 p-4 sm:p-6">
            <div
              role="tablist"
              aria-label="Travel booking modes"
              className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-100"
            >
              {SEARCH_MODES.map((m) => {
                const isSelected = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveMode(m.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
            >
              {showOriginField && (
                <div className="lg:col-span-2">
                  <label htmlFor="hero-origin" className="block text-xs font-medium text-slate-600 mb-1">
                    {activeMode === 'car' ? 'Pickup Location' : 'From'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="hero-origin"
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder={activeMode === 'car' ? 'Airport or city' : 'City or airport'}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>
              )}

              <div className={showOriginField ? 'lg:col-span-3' : 'lg:col-span-4'}>
                <label htmlFor="hero-destination" className="block text-xs font-medium text-slate-600 mb-1">
                  Destination
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="hero-destination"
                    type="text"
                    list="destination-suggestions"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Kyoto, Swiss Alps, Patagonia, Marrakech..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <datalist id="destination-suggestions">
                    {DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="hero-depart" className="block text-xs font-medium text-slate-600 mb-1">
                  {activeMode === 'car' ? 'Pickup Date' : 'Departure'}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="hero-depart"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 tabular-nums"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="hero-return" className="block text-xs font-medium text-slate-600 mb-1">
                  {activeMode === 'car' ? 'Drop-off Date' : 'Return'}
                </label>
                <input
                  id="hero-return"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 tabular-nums"
                />
              </div>

              <div className={showOriginField ? 'lg:col-span-1' : 'lg:col-span-2'}>
                <label htmlFor="hero-travelers" className="block text-xs font-medium text-slate-600 mb-1">
                  Travelers
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <select
                    id="hero-travelers"
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 tabular-nums"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
                >
                  Search trips
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {saveNotice && (
        <div
          role="status"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
        >
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            {saveNotice}
          </div>
        </div>
      )}

      {/* Section 1: Popular Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Popular destinations
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600">
              Explore seasonal climate windows, local rail &amp; road transfers, and vetted boutique stays.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdateSearch({ mode: 'all', destination: '' });
              onNavigate({ name: 'search' });
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
          >
            <span>Browse all routes</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {DESTINATIONS.map((dest) => {
            const saved = isItemSaved(dest.id);
            return (
              <article
                key={dest.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: 'destination', destinationId: dest.id })}
                    className="w-full h-full block focus-visible:outline-none"
                    aria-label={`Explore ${dest.name}, ${dest.country}`}
                  >
                    <TravelImage
                      src={dest.imageUrl}
                      alt={`${dest.name}, ${dest.country}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={saved ? `Remove ${dest.name} from saved trips` : `Save ${dest.name}`}
                    onClick={() => void handleSaveDestination(dest)}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                      saved
                        ? 'bg-teal-700 text-white'
                        : 'bg-white/95 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        {dest.region} · Best {dest.bestTimeToVisit}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 tabular-nums shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" aria-hidden="true" />
                        {dest.rating.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => onNavigate({ name: 'destination', destinationId: dest.id })}
                        className="text-left hover:text-teal-700 transition-colors"
                      >
                        {dest.name}, {dest.country}
                      </button>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{dest.tagline}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      From{' '}
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatMoney(dest.startingPriceUsd, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate({ name: 'destination', destinationId: dest.id })}
                      className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
                    >
                      Destination guide
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 2: Seasonal Departures & Curated Trips */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                Seasonal departures &amp; curated tours
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-600">
                Small-group itineraries with guaranteed departure windows, upfront taxes, and clear
                cancellation terms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSearch({ mode: 'package', destination: '' });
                onNavigate({ name: 'search' });
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
            >
              <span>Compare all packages</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {TOUR_PACKAGES.slice(0, 6).map((pkg) => (
              <article
                key={pkg.id}
                className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: 'package', packageId: pkg.id })}
                    className="w-full h-full block"
                    aria-label={`View itinerary for ${pkg.title}`}
                  >
                    <TravelImage
                      src={pkg.imageUrl}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center justify-between gap-2">
                      <span>
                        {pkg.seasonalLabel} · {pkg.durationDays} days
                      </span>
                      <span className="tabular-nums text-slate-700 font-medium">
                        {pkg.spotsAvailable} spots left
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold text-slate-900 leading-snug">
                      <button
                        type="button"
                        onClick={() => onNavigate({ name: 'package', packageId: pkg.id })}
                        className="text-left hover:text-teal-700 transition-colors"
                      >
                        {pkg.title}
                      </button>
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{pkg.subtitle}</p>
                    <p className="mt-2.5 text-xs text-slate-500">
                      Departures: {pkg.departureWindow} · Max {pkg.groupSizeMax} guests
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs text-slate-500">Per traveler</span>
                      <span className="text-lg font-semibold text-slate-900 tabular-nums">
                        {formatMoney(pkg.priceUsd, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate({ name: 'package', packageId: pkg.id })}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                    >
                      View itinerary
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Verified Traveler Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Verified traveler notes
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600">
            Real feedback from completed departures, covering transit punctuality, pacing, and local
            guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((rev) => (
            <article
              key={rev.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>{rev.travelDate}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" aria-hidden="true" />
                    {rev.rating}.0 / 5
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{rev.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{rev.authorName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rev.itemTitle}
                  {rev.authorLocation ? ` · ${rev.authorLocation}` : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
