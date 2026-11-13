import React, { useState } from 'react';
import { ChevronDown, Mail, MessageSquare, Phone } from 'lucide-react';
import { SUPPORT_FAQS } from '../data/catalog';
import { AppView, SupportCategory } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';

interface SupportViewProps {
  onNavigate: (view: AppView) => void;
}

const CATEGORIES: SupportCategory[] = [
  'Booking Change',
  'Cancellation & Refund',
  'Baggage & Transit',
  'Billing',
  'General Inquiry',
];

export const SupportView: React.FC<SupportViewProps> = ({ onNavigate }) => {
  const { user, privateInfo, bookings, createSupportTicket, signInWithGoogle, authBusy } =
    useFirebase();

  const [openFaqId, setOpenFaqId] = useState<string | null>(SUPPORT_FAQS[0].id);
  const [faqFilter, setFaqFilter] = useState<string>('All');

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportCategory>('Booking Change');
  const [bookingRef, setBookingRef] = useState('');
  const [contactEmail, setContactEmail] = useState(privateInfo?.email || user?.email || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const visibleFaqs =
    faqFilter === 'All'
      ? SUPPORT_FAQS
      : SUPPORT_FAQS.filter((f) => f.category === faqFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketFeedback(null);

    if (!user) {
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      if (!contactEmail && signedIn.email) setContactEmail(signedIn.email);
      return;
    }

    if (subject.trim().length < 3) {
      setTicketFeedback({ type: 'error', text: 'Please enter a subject (3+ characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setTicketFeedback({ type: 'error', text: 'Please enter a valid contact email.' });
      return;
    }
    if (message.trim().length < 10) {
      setTicketFeedback({
        type: 'error',
        text: 'Please describe your inquiry (at least 10 characters).',
      });
      return;
    }

    setSubmitting(true);
    try {
      await createSupportTicket({
        subject,
        category,
        bookingRef: bookingRef || undefined,
        message,
        contactEmail,
      });
      setSubject('');
      setMessage('');
      setBookingRef('');
      setTicketFeedback({
        type: 'success',
        text: 'Support ticket submitted. Track replies anytime under Account > Support Tickets.',
      });
    } catch (err) {
      setTicketFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to submit support ticket.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
          Traveler support &amp; FAQs
        </h1>
        <p className="mt-2 text-base text-slate-600">
          24/7 assistance for itinerary adjustments, rail or flight disruptions, and refund
          inquiries.
        </p>
      </div>

      {/* Direct Support Channels */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Phone className="w-5 h-5 text-teal-700 mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">24/7 Transit Desk</h2>
          <p className="mt-1 text-sm text-slate-600">Immediate help during active travel days.</p>
          <a
            href="tel:+14155550194"
            className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800 tabular-nums"
          >
            +1 (415) 555-0194
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Mail className="w-5 h-5 text-teal-700 mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">Email Desk</h2>
          <p className="mt-1 text-sm text-slate-600">Replies within 4 hours for itinerary changes.</p>
          <a
            href="mailto:desk@wayfare.example"
            className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            desk@wayfare.example
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <MessageSquare className="w-5 h-5 text-teal-700 mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">Manage Existing Bookings</h2>
          <p className="mt-1 text-sm text-slate-600">
            View receipts or submit a cancellation request directly.
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'account', tab: 'bookings' })}
            className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Open My Trips
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* FAQs Column */}
        <section className="lg:col-span-6 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Frequently asked questions
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              'All',
              'Booking & Payments',
              'Changes & Cancellations',
              'Flights & Baggage',
              'Rail, Buses & Cars',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFaqFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  faqFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {visibleFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <span className="block text-[11px] text-slate-500">{faq.category}</span>
                      <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Form Column */}
        <section className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Send a support request
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tickets link directly to your Wayfare account so our desk can inspect your itinerary.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sup-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Topic
                </label>
                <select
                  id="sup-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportCategory)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sup-ref" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Booking Reference (Optional)
                </label>
                {bookings.length > 0 ? (
                  <select
                    id="sup-ref"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  >
                    <option value="">None / General question</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.bookingRef}>
                        {b.bookingRef} — {b.destinationName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="sup-ref"
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    placeholder="e.g., WF-2026-4102"
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="sup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reply Email
              </label>
              <input
                id="sup-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label htmlFor="sup-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <input
                id="sup-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Date adjustment or baggage inquiry"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label htmlFor="sup-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                id="sup-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your preferred dates or question..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {ticketFeedback && (
              <div
                role="status"
                className={`rounded-lg border px-4 py-3 text-sm ${
                  ticketFeedback.type === 'success'
                    ? 'border-teal-200 bg-teal-50 text-teal-900'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {ticketFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || authBusy}
              className="w-full py-3 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {!user
                ? authBusy
                  ? 'Signing in...'
                  : 'Sign in with Google & Submit'
                : submitting
                ? 'Submitting...'
                : 'Submit support ticket'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
