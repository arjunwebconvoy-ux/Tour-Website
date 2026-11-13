import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Minus,
  Star,
  Users,
} from 'lucide-react';
import { TOUR_PACKAGES, formatMoney } from '../data/catalog';
import { AppView, BookingDraft } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface PackageDetailViewProps {
  packageId: string;
  onNavigate: (view: AppView) => void;
}

function addDaysIso(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date('2026-12-05');
  if (Number.isNaN(base.getTime())) return '2026-12-12';
  base.setDate(base.getDate() + Math.max(1, days));
  return base.toISOString().slice(0, 10);
}

export const PackageDetailView: React.FC<PackageDetailViewProps> = ({
  packageId,
  onNavigate,
}) => {
  const {
    currency,
    user,
    reviews,
    isItemSaved,
    toggleSaveTrip,
    signInWithGoogle,
    submitReview,
  } = useFirebase();

  const pkg = TOUR_PACKAGES.find((p) => p.id === packageId) || TOUR_PACKAGES[0];
  const saved = isItemSaved(pkg.id);

  const [departureDate, setDepartureDate] = useState('2026-12-05');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomTier, setRoomTier] = useState('Standard Double / Twin');

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDate, setReviewDate] = useState('November 2026');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  const packageReviews = useMemo(() => {
    const exact = reviews.filter((r) => r.itemId === pkg.id);
    return exact.length > 0 ? exact : reviews.slice(0, 2);
  }, [reviews, pkg.id]);

  const tierSurcharge = roomTier.includes('Solo') ? 380 : roomTier.includes('Superior') ? 240 : 0;
  const unitPrice = pkg.priceUsd + tierSurcharge;
  const baseEstimate = Math.round(unitPrice * (adults + children * 0.75));
  const taxEstimate = Math.round(pkg.taxesAndFeesUsd * (adults + children));
  const totalEstimate = baseEstimate + taxEstimate;

  const handleContinueBooking = () => {
    const draft: BookingDraft = {
      itemId: pkg.id,
      itemType: 'package',
      itemTitle: pkg.title,
      destinationName: pkg.destinationName,
      imageUrl: pkg.imageUrl,
      unitPriceUsd: unitPrice,
      taxesPerTravelerUsd: pkg.taxesAndFeesUsd,
      durationDays: pkg.durationDays,
      departureDate,
      returnDate: addDaysIso(departureDate, pkg.durationDays),
      adults,
      children,
      cabinOrRoomOptions: [
        'Standard Double / Twin',
        'Superior View Room (+$240/guest)',
        'Solo Private Room (+$380/guest)',
      ],
      selectedCabinOrRoom: roomTier,
      cancellationNote: pkg.cancellationPolicy,
    };
    onNavigate({ name: 'booking', draft });
  };

  const handleSave = async () => {
    if (!user) {
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
    }
    await toggleSaveTrip({
      itemId: pkg.id,
      itemType: 'package',
      title: pkg.title,
      subtitle: `${pkg.destinationName} · ${pkg.durationDays} days`,
      priceUsd: pkg.priceUsd,
      imageUrl: pkg.imageUrl,
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewStatus(null);
    if (!user) {
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
    }
    if (reviewTitle.trim().length < 3 || reviewComment.trim().length < 10) {
      setReviewStatus('Please enter a title (3+ characters) and a comment (10+ characters).');
      return;
    }
    setReviewBusy(true);
    try {
      await submitReview({
        itemId: pkg.id,
        itemTitle: pkg.title,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
        travelDate: reviewDate,
      });
      setReviewTitle('');
      setReviewComment('');
      setReviewStatus('Thank you. Your review is now published.');
    } catch (err) {
      setReviewStatus(err instanceof Error ? err.message : 'Unable to publish review.');
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div>
      {/* Package Switcher Strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'search' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 pr-3 border-r border-slate-200 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Search</span>
          </button>
          {TOUR_PACKAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onNavigate({ name: 'package', packageId: p.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                p.id === pkg.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {p.destinationName.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Content Column */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {pkg.destinationName} · {pkg.durationDays} days · {pkg.seasonalLabel}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" aria-hidden="true" />
                  {pkg.rating.toFixed(1)} ({pkg.reviewCount} reviews)
                </span>
              </div>
              <h1
                className="mt-2 font-display font-semibold text-slate-900 tracking-tight"
                style={{ fontSize: 'clamp(1.85rem, 3vw, 2.75rem)', textWrap: 'balance' }}
              >
                {pkg.title}
              </h1>
              <p className="mt-2 text-base text-slate-600">{pkg.subtitle}</p>
            </div>

            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <TravelImage
                src={pkg.imageUrl}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Logistics Summary */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <h2 className="text-xs font-semibold text-slate-500">Group Size</h2>
                <p className="mt-1 text-sm font-medium text-slate-900 tabular-nums">
                  {pkg.groupSizeMin} to {pkg.groupSizeMax} travelers max
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500">Accommodation</h2>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {pkg.accommodationSummary}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500">Regional Transit</h2>
                <p className="mt-1 text-sm font-medium text-slate-900">{pkg.transportSummary}</p>
              </div>
            </section>

            {/* Day-by-Day Itinerary */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 mb-5">
                Day-by-day itinerary
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {pkg.itinerary.map((day) => (
                  <div key={day.day} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-teal-700 tabular-nums">
                        Day {String(day.day).padStart(2, '0')} · {day.location}
                      </span>
                      <span>
                        Meals: {day.meals} · Overnight: {day.overnight}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-slate-900">{day.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{day.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Included in fare</h2>
                <ul className="space-y-3 text-sm text-slate-700">
                  {pkg.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Not included</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  {pkg.exclusions.map((exc) => (
                    <li key={exc} className="flex items-start gap-2.5">
                      <Minus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Cancellation &amp; flexibility policy
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {pkg.cancellationPolicy}
              </p>
            </section>

            {/* Reviews & Review Form */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 mb-5">
                Traveler reviews
              </h2>
              <div className="space-y-4">
                {packageReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-white rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {rev.authorName} · {rev.travelDate}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" aria-hidden="true" />
                        {rev.rating}.0 / 5
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-slate-900">{rev.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                  </article>
                ))}
              </div>

              <form
                onSubmit={handleReviewSubmit}
                className="mt-6 bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <h3 className="text-base font-semibold text-slate-900">Share your experience</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rev-rating" className="block text-xs font-medium text-slate-700 mb-1">
                      Rating
                    </label>
                    <select
                      id="rev-rating"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value={5}>5 — Outstanding</option>
                      <option value={4}>4 — Very good</option>
                      <option value={3}>3 — Satisfactory</option>
                      <option value={2}>2 — Below expectations</option>
                      <option value={1}>1 — Poor</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rev-date" className="block text-xs font-medium text-slate-700 mb-1">
                      Travel Month
                    </label>
                    <input
                      id="rev-date"
                      type="text"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      placeholder="e.g., October 2026"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="rev-title" className="block text-xs font-medium text-slate-700 mb-1">
                    Review Headline
                  </label>
                  <input
                    id="rev-title"
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarize your trip logistics and pacing"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label htmlFor="rev-comment" className="block text-xs font-medium text-slate-700 mb-1">
                    Details
                  </label>
                  <textarea
                    id="rev-comment"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Mention stays, transfers, or guide highlights..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                {reviewStatus && (
                  <p className="text-xs font-medium text-teal-800">{reviewStatus}</p>
                )}
                <button
                  type="submit"
                  disabled={reviewBusy}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {user ? (reviewBusy ? 'Publishing...' : 'Publish review') : 'Sign in & publish review'}
                </button>
              </form>
            </section>
          </div>

          {/* Right Sticky Booking Card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-500">Starting per guest</span>
                <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {formatMoney(unitPrice, currency)}
                </div>
              </div>
              <span className="text-xs font-medium text-teal-800 tabular-nums">
                {pkg.spotsAvailable} spots available
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pkg-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Departure Date
                </label>
                <input
                  id="pkg-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pkg-adults" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Adults
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <select
                      id="pkg-adults"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full pl-9 pr-2 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="pkg-children" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Children (25% off)
                  </label>
                  <select
                    id="pkg-children"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Child' : 'Children'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pkg-room" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Room Configuration
                </label>
                <select
                  id="pkg-room"
                  value={roomTier}
                  onChange={(e) => setRoomTier(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="Standard Double / Twin">Standard Double / Twin</option>
                  <option value="Superior View Room (+$240/guest)">
                    Superior View Room (+$240/guest)
                  </option>
                  <option value="Solo Private Room (+$380/guest)">
                    Solo Private Room (+$380/guest)
                  </option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base itinerary fare</span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatMoney(baseEstimate, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Local taxes &amp; port levies</span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatMoney(taxEstimate, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Wayfare booking fee</span>
                <span className="tabular-nums font-medium text-teal-700">{formatMoney(0, currency)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-semibold text-slate-900">
                <span>Total estimate</span>
                <span className="tabular-nums">{formatMoney(totalEstimate, currency)}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleContinueBooking}
                className="w-full py-3 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors min-h-[44px]"
              >
                Continue to booking
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 inline-flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-teal-700 text-teal-700' : ''}`} aria-hidden="true" />
                <span>{saved ? 'Saved to My Trips' : 'Save package'}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
