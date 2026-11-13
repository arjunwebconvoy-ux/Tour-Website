import React from 'react';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Compass,
  Globe,
  Star,
} from 'lucide-react';
import { DESTINATIONS, TOUR_PACKAGES, formatMoney } from '../data/catalog';
import { AppView, BookingDraft, SearchQueryState } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface DestinationViewProps {
  destinationId: string;
  onNavigate: (view: AppView) => void;
  onUpdateSearch: (patch: Partial<SearchQueryState>) => void;
}

export const DestinationView: React.FC<DestinationViewProps> = ({
  destinationId,
  onNavigate,
  onUpdateSearch,
}) => {
  const { currency, user, isItemSaved, toggleSaveTrip, signInWithGoogle } = useFirebase();
  const dest = DESTINATIONS.find((d) => d.id === destinationId) || DESTINATIONS[0];
  const recommendedPackages = TOUR_PACKAGES.filter((p) =>
    dest.recommendedPackageIds.includes(p.id)
  );
  const saved = isItemSaved(dest.id);

  const handleSave = async () => {
    if (!user) {
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
    }
    await toggleSaveTrip({
      itemId: dest.id,
      itemType: 'destination',
      title: `${dest.name}, ${dest.country}`,
      subtitle: dest.tagline,
      priceUsd: dest.startingPriceUsd,
      imageUrl: dest.imageUrl,
    });
  };

  const handleBookStay = (stay: (typeof dest.stays)[number]) => {
    const draft: BookingDraft = {
      itemId: stay.id,
      itemType: 'hotel',
      itemTitle: `${stay.name} (${dest.name})`,
      destinationName: `${dest.name}, ${dest.country}`,
      imageUrl: dest.imageUrl,
      unitPriceUsd: stay.nightlyRateUsd,
      taxesPerTravelerUsd: Math.round(stay.nightlyRateUsd * 0.12),
      durationDays: 3,
      departureDate: '2026-12-05',
      returnDate: '2026-12-08',
      adults: 2,
      children: 0,
      cabinOrRoomOptions: ['Standard Room', 'View Suite'],
      selectedCabinOrRoom: 'Standard Room',
      cancellationNote: 'Free cancellation until 7 days before check-in.',
    };
    onNavigate({ name: 'booking', draft });
  };

  return (
    <div>
      {/* Destination Switcher Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 pr-3 border-r border-slate-200 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Home</span>
          </button>
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onNavigate({ name: 'destination', destinationId: d.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                d.id === dest.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Split Banner */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-teal-700">
                {dest.region} · {dest.country}
              </p>
              <h1
                className="mt-2 font-display font-semibold text-slate-900 tracking-tight"
                style={{ fontSize: 'clamp(2.1rem, 3.5vw, 3.25rem)', textWrap: 'balance' }}
              >
                {dest.name}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                {dest.overview}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-sm">
              <div>
                <span className="block text-xs text-slate-500">Best time to visit</span>
                <span className="font-semibold text-slate-900">{dest.bestTimeToVisit}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Local currency</span>
                <span className="font-semibold text-slate-900">{dest.currency}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Typical climate</span>
                <span className="font-semibold text-slate-900 tabular-nums">{dest.averageTempC}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onUpdateSearch({ mode: 'all', destination: dest.name });
                  onNavigate({ name: 'search' });
                }}
                className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors min-h-[42px]"
              >
                Search trips to {dest.name}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[42px]"
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-teal-700 text-teal-700' : ''}`} aria-hidden="true" />
                <span>{saved ? 'Saved' : 'Save destination'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto rounded-xl overflow-hidden bg-slate-100">
            <TravelImage
              src={dest.imageUrl}
              alt={`${dest.name}, ${dest.country}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Best Time to Visit */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Best time to visit {dest.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dest.seasons.map((s) => (
              <div key={s.season} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{s.months}</span>
                  <span>Crowds: {s.crowds}</span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-slate-900">{s.season}</h3>
                <p className="mt-1 text-xs font-medium text-teal-700 tabular-nums">{s.climate}</p>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{s.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activities & Stays */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-5">
              <Compass className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Featured local activities
              </h2>
            </div>
            <div className="space-y-4">
              {dest.activities.map((act) => (
                <div key={act.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{act.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{act.duration}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatMoney(act.priceUsd, currency)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{act.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Vetted stays
              </h2>
            </div>
            <div className="space-y-4">
              {dest.stays.map((stay) => (
                <div key={stay.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{stay.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {stay.neighborhood} ·{' '}
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 tabular-nums">
                          <Star className="w-3 h-3 text-amber-600 fill-amber-600" aria-hidden="true" />
                          {stay.rating.toFixed(1)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-semibold text-slate-900 tabular-nums">
                        {formatMoney(stay.nightlyRateUsd, currency)}
                      </span>
                      <span className="block text-[11px] text-slate-500">per night</span>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-600">{stay.highlights.join(' · ')}</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleBookStay(stay)}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                    >
                      Book stay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transport Options */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-slate-900 mb-5">
            Transport options
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="py-3.5 px-5">Mode</th>
                  <th className="py-3.5 px-5">Primary Route</th>
                  <th className="py-3.5 px-5">Typical Duration</th>
                  <th className="py-3.5 px-5">Frequency</th>
                  <th className="py-3.5 px-5 text-right">Starting Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dest.transportOptions.map((opt) => (
                  <tr key={opt.route} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                      {opt.mode}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{opt.route}</td>
                    <td className="py-3.5 px-5 text-slate-600 tabular-nums whitespace-nowrap">
                      {opt.duration}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">{opt.frequency}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatMoney(opt.startingPriceUsd, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recommended Itineraries */}
        {recommendedPackages.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold text-slate-900 mb-5">
              Recommended itineraries in {dest.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedPackages.map((pkg) => (
                <article
                  key={pkg.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row"
                >
                  <div className="sm:w-52 aspect-[4/3] sm:aspect-auto bg-slate-100 shrink-0">
                    <TravelImage
                      src={pkg.imageUrl}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        {pkg.durationDays} days · Max {pkg.groupSizeMax} guests
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{pkg.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{pkg.subtitle}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-slate-900 tabular-nums">
                        {formatMoney(pkg.priceUsd, currency)} / guest
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate({ name: 'package', packageId: pkg.id })}
                        className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        View package
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
