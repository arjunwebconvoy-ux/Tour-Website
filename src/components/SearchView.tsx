import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { TRAVEL_LISTINGS, formatMoney } from '../data/catalog';
import {
  AppView,
  BookingDraft,
  SearchQueryState,
  SortOption,
  TravelListing,
  TravelMode,
} from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface SearchViewProps {
  searchQuery: SearchQueryState;
  onUpdateSearch: (patch: Partial<SearchQueryState>) => void;
  onNavigate: (view: AppView) => void;
  onResetSearch: () => void;
}

const MODE_TABS: { id: TravelMode; label: string }[] = [
  { id: 'all', label: 'All Options' },
  { id: 'package', label: 'Holiday Packages' },
  { id: 'flight', label: 'Flights' },
  { id: 'hotel', label: 'Hotels' },
  { id: 'bus', label: 'Buses' },
  { id: 'car', label: 'Car Rentals' },
];

const AMENITY_OPTIONS = [
  'Breakfast Included',
  'Free Cancellation',
  'Direct Transit',
  'Boutique Stay',
  'Local Guide',
  'EV / Hybrid',
];

function addDaysIso(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date('2026-12-05');
  if (Number.isNaN(base.getTime())) return '2026-12-12';
  base.setDate(base.getDate() + Math.max(1, days));
  return base.toISOString().slice(0, 10);
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onUpdateSearch,
  onNavigate,
  onResetSearch,
}) => {
  const { currency, user, isItemSaved, toggleSaveTrip, signInWithGoogle } = useFirebase();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredListings = useMemo(() => {
    const destTerm = searchQuery.destination.trim().toLowerCase();
    const originTerm = searchQuery.origin.trim().toLowerCase();

    const list = TRAVEL_LISTINGS.filter((item) => {
      if (searchQuery.mode !== 'all' && item.itemType !== searchQuery.mode) return false;
      if (item.priceUsd > searchQuery.maxPriceUsd) return false;
      if (item.rating < searchQuery.minRating) return false;

      if (destTerm) {
        const hay = `${item.destinationName} ${item.title} ${item.subtitle}`.toLowerCase();
        if (!hay.includes(destTerm)) return false;
      }

      if (originTerm && item.originCity) {
        if (!item.originCity.toLowerCase().includes(originTerm)) return false;
      }

      if (searchQuery.durationFilter === '1-3' && (item.durationDays < 1 || item.durationDays > 3)) {
        return false;
      }
      if (searchQuery.durationFilter === '4-7' && (item.durationDays < 4 || item.durationDays > 7)) {
        return false;
      }
      if (searchQuery.durationFilter === '8-14' && (item.durationDays < 8 || item.durationDays > 14)) {
        return false;
      }

      if (searchQuery.amenities.length > 0) {
        const hasAll = searchQuery.amenities.every((a) => item.amenities.includes(a));
        if (!hasAll) return false;
      }

      return true;
    });

    const sorted = [...list];
    switch (searchQuery.sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.priceUsd - b.priceUsd);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.priceUsd - a.priceUsd);
        break;
      case 'rating_desc':
        sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'duration_asc':
        sorted.sort((a, b) => a.durationDays - b.durationDays);
        break;
      default:
        sorted.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);
        break;
    }

    return sorted;
  }, [searchQuery]);

  const toggleAmenity = (amenity: string) => {
    const exists = searchQuery.amenities.includes(amenity);
    const next = exists
      ? searchQuery.amenities.filter((a) => a !== amenity)
      : [...searchQuery.amenities, amenity];
    onUpdateSearch({ amenities: next });
  };

  const handleBookListing = (item: TravelListing) => {
    const depDate = searchQuery.departureDate || item.nextAvailableDate;
    const retDate =
      searchQuery.returnDate && searchQuery.returnDate > depDate
        ? searchQuery.returnDate
        : addDaysIso(depDate, item.durationDays);

    const draft: BookingDraft = {
      itemId: item.id,
      itemType: item.itemType,
      itemTitle: item.title,
      destinationName: item.destinationName,
      imageUrl: item.imageUrl,
      unitPriceUsd: item.priceUsd,
      taxesPerTravelerUsd: item.taxesAndFeesUsd,
      durationDays: item.durationDays,
      departureDate: depDate,
      returnDate: retDate,
      adults: Math.max(1, searchQuery.travelers || 2),
      children: 0,
      cabinOrRoomOptions: item.cabinOrRoomOptions,
      selectedCabinOrRoom: item.cabinOrRoomOptions[0],
      cancellationNote: item.cancellationNote,
    };

    onNavigate({ name: 'booking', draft });
  };

  const handleToggleSave = async (item: TravelListing) => {
    if (!user) {
      setNotice('Sign in with Google to save items to your trip shortlist.');
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      setNotice(null);
    }
    const saved = await toggleSaveTrip({
      itemId: item.id,
      itemType: item.itemType,
      title: item.title,
      subtitle: `${item.destinationName} · ${item.durationLabel}`,
      priceUsd: item.priceUsd,
      imageUrl: item.imageUrl,
    });
    setNotice(saved ? `Saved "${item.title}".` : `Removed "${item.title}" from saved trips.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const renderFilterControls = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="filter-destination" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Destination or Keyword
        </label>
        <input
          id="filter-destination"
          type="text"
          value={searchQuery.destination}
          onChange={(e) => onUpdateSearch({ destination: e.target.value })}
          placeholder="e.g., Kyoto, Zermatt, Patagonia"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="filter-dep-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Departure
          </label>
          <input
            id="filter-dep-date"
            type="date"
            value={searchQuery.departureDate}
            onChange={(e) => onUpdateSearch({ departureDate: e.target.value })}
            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
        <div>
          <label htmlFor="filter-ret-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Return
          </label>
          <input
            id="filter-ret-date"
            type="date"
            value={searchQuery.returnDate}
            onChange={(e) => onUpdateSearch({ returnDate: e.target.value })}
            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <label htmlFor="filter-max-price">Max Base Price</label>
          <span className="tabular-nums text-slate-900">
            {formatMoney(searchQuery.maxPriceUsd, currency)}
          </span>
        </div>
        <input
          id="filter-max-price"
          type="range"
          min={50}
          max={3500}
          step={50}
          value={searchQuery.maxPriceUsd}
          onChange={(e) => onUpdateSearch({ maxPriceUsd: Number(e.target.value) })}
          className="w-full accent-teal-700"
        />
        <div className="flex justify-between text-[11px] text-slate-500 tabular-nums mt-1">
          <span>{formatMoney(50, currency)}</span>
          <span>{formatMoney(3500, currency)}</span>
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-2">Duration</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'any', label: 'Any length' },
            { id: '1-3', label: '1–3 days' },
            { id: '4-7', label: '4–7 days' },
            { id: '8-14', label: '8–14 days' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                onUpdateSearch({
                  durationFilter: opt.id as SearchQueryState['durationFilter'],
                })
              }
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap min-h-[38px] ${
                searchQuery.durationFilter === opt.id
                  ? 'border-teal-700 bg-teal-50 text-teal-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-2">Minimum Rating</span>
        <div className="flex flex-wrap gap-2">
          {[0, 4.5, 4.7, 4.9].map((ratingVal) => (
            <button
              key={ratingVal}
              type="button"
              onClick={() => onUpdateSearch({ minRating: ratingVal })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors tabular-nums min-h-[36px] ${
                searchQuery.minRating === ratingVal
                  ? 'border-teal-700 bg-teal-50 text-teal-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {ratingVal === 0 ? 'All' : `${ratingVal.toFixed(1)}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-2">Amenities &amp; Terms</span>
        <div className="space-y-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const checked = searchQuery.amenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                />
                <span>{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onResetSearch}
        className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px]"
      >
        Reset all filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Travel Type Tabs */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-900 tracking-tight">
              Search trips &amp; transit
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900 tabular-nums">{filteredListings.length}</span>{' '}
              verified options with upfront taxes and availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 min-h-[40px]"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="search-sort" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Sort by
              </label>
              <select
                id="search-sort"
                value={searchQuery.sortBy}
                onChange={(e) => onUpdateSearch({ sortBy: e.target.value as SortOption })}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 min-h-[40px]"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="duration_asc">Shortest Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mode Segmented Filter Bar */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          {MODE_TABS.map((tab) => {
            const active = searchQuery.mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onUpdateSearch({ mode: tab.id })}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {notice && (
        <div role="status" className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {notice}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Filter results</h2>
          {renderFilterControls()}
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 flex justify-end">
            <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                <h2 className="text-base font-semibold text-slate-900">Filter results</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterControls()}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full py-3 rounded-lg bg-teal-700 text-white text-sm font-semibold"
              >
                Show {filteredListings.length} results
              </button>
            </div>
          </div>
        )}

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-5">
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">No trips match these filters</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Try increasing your maximum price, clearing an amenity requirement, or switching to
                All Options.
              </p>
              <button
                type="button"
                onClick={onResetSearch}
                className="mt-5 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            filteredListings.map((item) => {
              const saved = isItemSaved(item.id);
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-shadow hover:shadow-md"
                >
                  <div className="md:col-span-4 aspect-[4/3] md:aspect-auto bg-slate-100 relative">
                    <TravelImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
                      onClick={() => void handleToggleSave(item)}
                      className={`absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        saved ? 'bg-teal-700 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="capitalize">
                          {item.itemType} · {item.provider} · {item.durationLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" aria-hidden="true" />
                          {item.rating.toFixed(1)} ({item.reviewCount})
                        </span>
                      </div>

                      <h2 className="mt-1.5 text-lg sm:text-xl font-semibold text-slate-900">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>

                      <p className="mt-3 text-xs text-slate-500">
                        {item.amenities.join(' · ')}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          {item.availabilityLabel} · Next departure{' '}
                          <span className="tabular-nums">{item.nextAvailableDate}</span>
                        </p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-semibold text-slate-900 tabular-nums">
                            {formatMoney(item.priceUsd, currency)}
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            + {formatMoney(item.taxesAndFeesUsd, currency)} taxes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.packageId ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({ name: 'package', packageId: item.packageId! })
                            }
                            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap min-h-[40px]"
                          >
                            View itinerary
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({
                                name: 'destination',
                                destinationId: item.destinationId,
                              })
                            }
                            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap min-h-[40px]"
                          >
                            Destination
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleBookListing(item)}
                          className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors whitespace-nowrap min-h-[40px]"
                        >
                          Book now
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
