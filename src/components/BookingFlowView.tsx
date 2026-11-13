import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatMoney } from '../data/catalog';
import { AppView, BookingDraft, BookingRecord } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { TravelImage } from './TravelImage';

interface BookingFlowViewProps {
  initialDraft: BookingDraft;
  onNavigate: (view: AppView) => void;
}

export const BookingFlowView: React.FC<BookingFlowViewProps> = ({
  initialDraft,
  onNavigate,
}) => {
  const { user, profile, privateInfo, currency, signInWithGoogle, createBooking, authBusy } =
    useFirebase();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<BookingDraft>(initialDraft);

  const [travelerName, setTravelerName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [travelerEmail, setTravelerEmail] = useState(
    privateInfo?.email || user?.email || ''
  );
  const [travelerPhone, setTravelerPhone] = useState(privateInfo?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  const totalTravelers = draft.adults + draft.children;
  const basePriceUsd = Math.round(draft.unitPriceUsd * (draft.adults + draft.children * 0.75));
  const taxesAndFeesUsd = Math.round(draft.taxesPerTravelerUsd * totalTravelers);
  const totalPriceUsd = basePriceUsd + taxesAndFeesUsd;

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!draft.departureDate) errors.departureDate = 'Select a departure date.';
    if (!draft.returnDate || draft.returnDate < draft.departureDate) {
      errors.returnDate = 'Return date must be on or after departure.';
    }
    if (draft.adults < 1) errors.adults = 'At least 1 adult traveler is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (travelerName.trim().length < 2) {
      errors.travelerName = 'Enter the lead traveler’s full name.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(travelerEmail.trim())) {
      errors.travelerEmail = 'Enter a valid email address for your receipt.';
    }
    if (travelerPhone.trim().length < 6) {
      errors.travelerPhone = 'Enter a valid contact phone number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = async () => {
    setSubmitError(null);
    if (!acceptedPolicy) {
      setSubmitError('Please confirm that you have reviewed the cancellation policy.');
      return;
    }

    if (!user) {
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      if (!travelerName) setTravelerName(signedIn.displayName || '');
      if (!travelerEmail) setTravelerEmail(signedIn.email || '');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        draft,
        travelerName,
        travelerEmail,
        travelerPhone,
        specialRequests,
      });
      setConfirmedBooking(created);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to save booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10">
          <div className="flex items-center gap-3 text-teal-700">
            <CheckCircle2 className="w-7 h-7 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">Booking Confirmed</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-slate-900">
            Your itinerary is reserved
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Confirmation reference{' '}
            <span className="font-mono font-semibold text-slate-900">
              {confirmedBooking.bookingRef}
            </span>{' '}
            has been saved to your Wayfare account.
          </p>

          <div className="mt-8 border-t border-b border-slate-200 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div>
              <span className="block text-xs text-slate-500">Trip / Service</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.itemTitle}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Destination</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.destinationName}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Travel Dates</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {confirmedBooking.departureDate} to {confirmedBooking.returnDate}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Travelers &amp; Tier</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {confirmedBooking.adults} adults
                {confirmedBooking.children > 0 ? `, ${confirmedBooking.children} children` : ''} ·{' '}
                {confirmedBooking.cabinOrRoom}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Lead Traveler</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.travelerName}</span>
              <span className="block text-xs text-slate-500">{confirmedBooking.travelerEmail}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Total Paid</span>
              <span className="text-lg font-semibold text-slate-900 tabular-nums">
                {formatMoney(confirmedBooking.totalPriceUsd, currency)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'account', tab: 'bookings' })}
              className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold min-h-[42px]"
            >
              View in My Trips
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'home' })}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[42px]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => onNavigate({ name: 'search' })}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to search results</span>
      </button>

      {/* Stepper Indicator */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5 mb-8 text-sm">
        {[
          { num: 1, label: '01. Dates & Travelers' },
          { num: 2, label: '02. Traveler Details' },
          { num: 3, label: '03. Review & Confirm' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            disabled={s.num > step}
            onClick={() => s.num < step && setStep(s.num as 1 | 2 | 3)}
            className={`font-medium whitespace-nowrap ${
              step === s.num
                ? 'text-teal-700 font-semibold'
                : s.num < step
                ? 'text-slate-700 hover:text-slate-900'
                : 'text-slate-400 cursor-default'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-semibold text-slate-900">
                  Select dates &amp; travelers
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Adjust departure dates, party size, and room or cabin class.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bk-dep" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Departure Date
                  </label>
                  <input
                    id="bk-dep"
                    type="date"
                    value={draft.departureDate}
                    onChange={(e) => setDraft({ ...draft, departureDate: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  {formErrors.departureDate && (
                    <p className="mt-1 text-xs text-red-700">{formErrors.departureDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bk-ret" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Return Date
                  </label>
                  <input
                    id="bk-ret"
                    type="date"
                    value={draft.returnDate}
                    onChange={(e) => setDraft({ ...draft, returnDate: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  {formErrors.returnDate && (
                    <p className="mt-1 text-xs text-red-700">{formErrors.returnDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bk-adults" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Adults (18+)
                  </label>
                  <select
                    id="bk-adults"
                    value={draft.adults}
                    onChange={(e) => setDraft({ ...draft, adults: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Adult' : 'Adults'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bk-children" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Children (2–17)
                  </label>
                  <select
                    id="bk-children"
                    value={draft.children}
                    onChange={(e) => setDraft({ ...draft, children: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 tabular-nums"
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
                <label htmlFor="bk-tier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cabin, Room, or Vehicle Option
                </label>
                <select
                  id="bk-tier"
                  value={draft.selectedCabinOrRoom}
                  onChange={(e) => setDraft({ ...draft, selectedCabinOrRoom: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  {draft.cabinOrRoomOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold min-h-[42px]"
                >
                  Continue to traveler details
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-semibold text-slate-900">
                  Lead traveler details
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Enter passport-matching name and contact details for booking documents.
                </p>
              </div>

              <div>
                <label htmlFor="bk-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="bk-name"
                  type="text"
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                {formErrors.travelerName && (
                  <p className="mt-1 text-xs text-red-700">{formErrors.travelerName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bk-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirmation Email
                  </label>
                  <input
                    id="bk-email"
                    type="email"
                    value={travelerEmail}
                    onChange={(e) => setTravelerEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  {formErrors.travelerEmail && (
                    <p className="mt-1 text-xs text-red-700">{formErrors.travelerEmail}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bk-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Phone
                  </label>
                  <input
                    id="bk-phone"
                    type="tel"
                    value={travelerPhone}
                    onChange={(e) => setTravelerPhone(e.target.value)}
                    placeholder="+1 415 555 0148"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  {formErrors.travelerPhone && (
                    <p className="mt-1 text-xs text-red-700">{formErrors.travelerPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="bk-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dietary, Mobility, or Seating Requests (Optional)
                </label>
                <textarea
                  id="bk-notes"
                  rows={3}
                  maxLength={500}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Twin beds requested, vegetarian meals, ground-floor access..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => validateStep2() && setStep(3)}
                  className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold min-h-[42px]"
                >
                  Review price &amp; confirm
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-semibold text-slate-900">
                  Review &amp; confirm reservation
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Verify all traveler information, dates, and cancellation terms before confirming.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lead Traveler</span>
                  <span className="font-medium text-slate-900">{travelerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Contact</span>
                  <span className="font-medium text-slate-900">
                    {travelerEmail} · {travelerPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dates</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {draft.departureDate} to {draft.returnDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Configuration</span>
                  <span className="font-medium text-slate-900">
                    {draft.adults} adults
                    {draft.children > 0 ? `, ${draft.children} children` : ''} ·{' '}
                    {draft.selectedCabinOrRoom}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  <span>Cancellation Policy</span>
                </div>
                <p>{draft.cancellationNote}</p>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPolicy}
                  onChange={(e) => setAcceptedPolicy(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                />
                <span>
                  I confirm that the traveler details match official travel IDs and I agree to the
                  cancellation and refund schedule stated above.
                </span>
              </label>

              {submitError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {submitError}
                </div>
              )}

              {!user && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                  Sign in with your Google account to securely save this booking to your Wayfare
                  profile. Your entered trip details are preserved.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting || authBusy}
                  onClick={() => void handleConfirm()}
                  className="px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
                >
                  {!user
                    ? authBusy
                      ? 'Signing in...'
                      : 'Sign in with Google & Confirm'
                    : submitting
                    ? 'Confirming booking...'
                    : `Confirm booking (${formatMoney(totalPriceUsd, currency)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Price Card */}
        <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-24">
          <div className="aspect-[16/9] bg-slate-100">
            <TravelImage
              src={draft.imageUrl}
              alt={draft.itemTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="text-xs text-slate-500 capitalize">
                {draft.itemType} · {draft.destinationName}
              </span>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{draft.itemTitle}</h2>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  Base fare ({draft.adults} adult{draft.adults > 1 ? 's' : ''}
                  {draft.children > 0 ? `, ${draft.children} child` : ''})
                </span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatMoney(basePriceUsd, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes &amp; regulatory fees</span>
                <span className="tabular-nums font-medium text-slate-900">
                  {formatMoney(taxesAndFeesUsd, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service fee</span>
                <span className="tabular-nums font-medium text-teal-700">{formatMoney(0, currency)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-semibold text-slate-900">
                <span>Total due</span>
                <span className="tabular-nums">{formatMoney(totalPriceUsd, currency)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
