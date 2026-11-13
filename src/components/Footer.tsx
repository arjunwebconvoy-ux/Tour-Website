import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { AppView, CurrencyCode } from '../types/travel';
import { useFirebase } from '../context/FirebaseContext';
import { downloadWebsiteBundle } from '../utils/exportSite';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { currency, setCurrency, reviews, savedTrips, bookings } = useFirebase();
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const handleDownloadBundle = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      await downloadWebsiteBundle({
        currency,
        reviews,
        savedTrips,
        bookings,
      });
      setExportNote('Downloaded wayfare-website-bundle.zip');
    } catch {
      setExportNote('Unable to build archive. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <span className="font-display text-xl font-semibold text-white">Wayfare</span>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Multi-modal travel discovery and transparent tour booking across rail, coastal sea
              routes, regional flights, and boutique stays.
            </p>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void handleDownloadBundle()}
              className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-white transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
              <span>{exporting ? 'Preparing archive...' : 'Download site & content (.zip)'}</span>
            </button>
            {exportNote && (
              <p className="mt-2 text-xs text-teal-300" role="status">
                {exportNote}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Destinations</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { id: 'kyoto', label: 'Kyoto, Japan' },
                { id: 'swiss-alps', label: 'Swiss Alps' },
                { id: 'patagonia', label: 'Patagonia, Chile' },
                { id: 'marrakech', label: 'Marrakech & Atlas' },
                { id: 'lofoten', label: 'Lofoten Islands' },
              ].map((dest) => (
                <li key={dest.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: 'destination', destinationId: dest.id })}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {dest.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Traveler Tools</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'search' })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Search Flights, Stays &amp; Rail
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'account', tab: 'bookings' })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  My Bookings &amp; Cancellations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'account', tab: 'saved' })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Saved Trips
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'support' })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Help Center &amp; FAQs
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Currency &amp; Support</h3>
            <label htmlFor="footer-currency" className="block text-xs text-slate-400 mb-2">
              Display Currency
            </label>
            <select
              id="footer-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="JPY">JPY (¥) — Japanese Yen</option>
            </select>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              24/7 Traveler Support Desk: +1 (415) 555-0194 · desk@wayfare.example
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Wayfare Journeys. Transparent pricing with zero hidden booking fees.</p>
          <p>ATOL &amp; Global Transit Partner Network</p>
        </div>
      </div>
    </footer>
  );
};
