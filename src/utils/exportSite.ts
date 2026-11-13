import JSZip from 'jszip';
import {
  CATALOG_IMAGE_ASSETS,
  DESTINATIONS,
  HERO_IMAGE,
  SUPPORT_FAQS,
  TOUR_PACKAGES,
  TRAVEL_LISTINGS,
  formatMoney,
} from '../data/catalog';
import { BookingRecord, CurrencyCode, SavedTrip, TravelReview } from '../types/travel';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function mapAssetPath(url: string): string {
  const match = CATALOG_IMAGE_ASSETS.find((a) => a.url === url);
  return match ? `./assets/${match.filename}` : './assets/hero_amalfi_coast.jpg';
}

function buildStandaloneHtml(params: {
  currency: CurrencyCode;
  reviews: TravelReview[];
}): string {
  const { currency, reviews } = params;

  const destinationsHtml = DESTINATIONS.map(
    (d) => `
      <article class="card">
        <div class="card-media">
          <img src="${mapAssetPath(d.imageUrl)}" alt="${escapeHtml(d.name)}, ${escapeHtml(d.country)}" />
        </div>
        <div class="card-body">
          <div class="meta">${escapeHtml(d.region)} · Best ${escapeHtml(d.bestTimeToVisit)} · ★ ${d.rating.toFixed(1)}</div>
          <h3>${escapeHtml(d.name)}, ${escapeHtml(d.country)}</h3>
          <p class="muted">${escapeHtml(d.overview)}</p>
          <div class="sublist">
            <strong>Seasons:</strong>
            ${d.seasons.map((s) => `${escapeHtml(s.season)} (${escapeHtml(s.months)})`).join(' · ')}
          </div>
          <div class="card-foot">
            <span>From <strong>${escapeHtml(formatMoney(d.startingPriceUsd, currency))}</strong></span>
            <span>${escapeHtml(d.currency)}</span>
          </div>
        </div>
      </article>`
  ).join('\n');

  const packagesHtml = TOUR_PACKAGES.map(
    (p) => `
      <article class="package-block">
        <div class="package-head">
          <img src="${mapAssetPath(p.imageUrl)}" alt="${escapeHtml(p.title)}" class="package-img" />
          <div>
            <div class="meta">${escapeHtml(p.destinationName)} · ${p.durationDays} days · ${escapeHtml(p.seasonalLabel)} · ★ ${p.rating.toFixed(1)}</div>
            <h3>${escapeHtml(p.title)}</h3>
            <p class="muted">${escapeHtml(p.subtitle)}</p>
            <p class="meta-line"><strong>Accommodation:</strong> ${escapeHtml(p.accommodationSummary)}</p>
            <p class="meta-line"><strong>Transport:</strong> ${escapeHtml(p.transportSummary)}</p>
            <p class="meta-line"><strong>Group size:</strong> ${p.groupSizeMin}–${p.groupSizeMax} guests · <strong>Fare:</strong> ${escapeHtml(formatMoney(p.priceUsd, currency))} + ${escapeHtml(formatMoney(p.taxesAndFeesUsd, currency))} taxes</p>
            <p class="meta-line"><strong>Cancellation:</strong> ${escapeHtml(p.cancellationPolicy)}</p>
          </div>
        </div>
        <div class="itinerary-grid">
          <div>
            <h4>Day-by-Day Itinerary</h4>
            <ol class="days">
              ${p.itinerary
                .map(
                  (day) => `
                <li>
                  <strong>Day ${day.day}: ${escapeHtml(day.title)}</strong> (${escapeHtml(day.location)}) — ${escapeHtml(day.description)}
                  <span class="meta">Meals: ${escapeHtml(day.meals)} · Overnight: ${escapeHtml(day.overnight)}</span>
                </li>`
                )
                .join('')}
            </ol>
          </div>
          <div>
            <h4>Included</h4>
            <ul>${p.inclusions.map((inc) => `<li>${escapeHtml(inc)}</li>`).join('')}</ul>
            <h4>Not Included</h4>
            <ul>${p.exclusions.map((exc) => `<li>${escapeHtml(exc)}</li>`).join('')}</ul>
          </div>
        </div>
      </article>`
  ).join('\n');

  const listingsHtml = TRAVEL_LISTINGS.map(
    (item) => `
      <tr data-mode="${escapeHtml(item.itemType)}">
        <td><strong>${escapeHtml(item.title)}</strong><br /><span class="meta">${escapeHtml(item.subtitle)}</span></td>
        <td class="cap">${escapeHtml(item.itemType)}</td>
        <td>${escapeHtml(item.destinationName)}</td>
        <td>${escapeHtml(item.durationLabel)}</td>
        <td class="num">${escapeHtml(formatMoney(item.priceUsd, currency))} <span class="meta">(+${escapeHtml(formatMoney(item.taxesAndFeesUsd, currency))} tax)</span></td>
        <td>${escapeHtml(item.availabilityLabel)}</td>
      </tr>`
  ).join('\n');

  const reviewsHtml = reviews
    .slice(0, 6)
    .map(
      (r) => `
      <article class="review-card">
        <div class="meta">${escapeHtml(r.travelDate)} · ★ ${r.rating}.0 / 5</div>
        <h3>${escapeHtml(r.title)}</h3>
        <p class="muted">${escapeHtml(r.comment)}</p>
        <div class="review-author"><strong>${escapeHtml(r.authorName)}</strong> · ${escapeHtml(r.itemTitle)}</div>
      </article>`
    )
    .join('\n');

  const faqsHtml = SUPPORT_FAQS.map(
    (f) => `
      <details class="faq-item">
        <summary><span>${escapeHtml(f.category)}</span> — ${escapeHtml(f.question)}</summary>
        <p>${escapeHtml(f.answer)}</p>
      </details>`
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wayfare — Offline Travel Catalog &amp; Itineraries</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --ink: #0f172a;
      --muted: #475569;
      --border: #e2e8f0;
      --accent: #0f766e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.55;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .nav-wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .brand {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--ink);
      text-decoration: none;
    }
    nav { display: flex; flex-wrap: wrap; gap: 18px; font-size: 14px; }
    nav a { color: var(--muted); text-decoration: none; font-weight: 500; }
    nav a:hover { color: var(--ink); }
    .hero {
      position: relative;
      background: #0f172a;
      color: #ffffff;
      overflow: hidden;
    }
    .hero img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.42;
    }
    .hero-inner {
      position: relative;
      max-width: 1180px;
      margin: 0 auto;
      padding: 72px 20px;
    }
    .hero h1 {
      font-family: Georgia, serif;
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.1;
      margin: 0 0 14px;
      max-width: 720px;
    }
    .hero p { max-width: 620px; color: #e2e8f0; margin: 0; }
    main { max-width: 1180px; margin: 0 auto; padding: 48px 20px; }
    section { margin-bottom: 56px; }
    h2 {
      font-family: Georgia, serif;
      font-size: 28px;
      margin: 0 0 8px;
    }
    .section-lead { color: var(--muted); margin: 0 0 24px; font-size: 15px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .card, .review-card, .package-block {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .card-media { aspect-ratio: 4/3; background: #e2e8f0; }
    .card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .card-body { padding: 18px; }
    .card-body h3, .review-card h3 { margin: 6px 0 8px; font-size: 18px; }
    .meta { font-size: 12px; color: #64748b; display: block; }
    .muted { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
    .sublist { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
    .card-foot {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }
    .package-block { padding: 24px; margin-bottom: 24px; }
    .package-head {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      align-items: start;
    }
    .package-img {
      width: 100%;
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: 8px;
    }
    .meta-line { font-size: 13px; color: var(--muted); margin: 6px 0; }
    .itinerary-grid {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
      font-size: 14px;
    }
    .days { padding-left: 18px; margin: 8px 0 0; }
    .days li { margin-bottom: 10px; }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .filter-btn {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th, td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
    th { background: #f1f5f9; font-size: 12px; color: #475569; }
    .cap { text-transform: capitalize; }
    .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .review-card { padding: 20px; }
    .review-author { font-size: 13px; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px; }
    .faq-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 10px;
    }
    .faq-item summary { cursor: pointer; font-weight: 600; font-size: 15px; }
    .faq-item summary span { color: var(--accent); font-size: 12px; }
    footer {
      background: #0f172a;
      color: #cbd5e1;
      padding: 32px 20px;
      font-size: 13px;
      text-align: center;
    }
    @media (max-width: 780px) {
      .package-head, .itinerary-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-wrap">
      <a href="#top" class="brand">Wayfare</a>
      <nav>
        <a href="#destinations">Destinations</a>
        <a href="#packages">Tour Packages</a>
        <a href="#directory">Flights, Stays &amp; Transit</a>
        <a href="#reviews">Reviews</a>
        <a href="#support">FAQs</a>
      </nav>
    </div>
  </header>

  <section id="top" class="hero">
    <img src="${mapAssetPath(HERO_IMAGE)}" alt="Mediterranean coastline" />
    <div class="hero-inner">
      <h1>Thoughtful journeys across rail, sea, and sky.</h1>
      <p>Complete offline edition of Wayfare destinations, seasonal itineraries, flights, boutique stays, coaches, rental cars, and traveler FAQs.</p>
    </div>
  </section>

  <main>
    <section id="destinations">
      <h2>Popular Destinations</h2>
      <p class="section-lead">Seasonal windows, local currencies, and starting fares across our six flagship regions.</p>
      <div class="grid">${destinationsHtml}</div>
    </section>

    <section id="packages">
      <h2>Curated Tour Packages &amp; Itineraries</h2>
      <p class="section-lead">Complete day-by-day schedules, inclusions, exclusions, and cancellation policies.</p>
      ${packagesHtml}
    </section>

    <section id="directory">
      <h2>Flights, Stays, Buses &amp; Car Rentals</h2>
      <p class="section-lead">Filter available multi-modal travel options offline.</p>
      <div class="filter-bar">
        <button class="filter-btn active" onclick="filterMode('all', this)">All Options</button>
        <button class="filter-btn" onclick="filterMode('package', this)">Packages</button>
        <button class="filter-btn" onclick="filterMode('flight', this)">Flights</button>
        <button class="filter-btn" onclick="filterMode('hotel', this)">Hotels</button>
        <button class="filter-btn" onclick="filterMode('bus', this)">Buses</button>
        <button class="filter-btn" onclick="filterMode('car', this)">Car Rentals</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Destination</th>
              <th>Duration</th>
              <th>Price (${escapeHtml(currency)})</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody id="listings-body">${listingsHtml}</tbody>
        </table>
      </div>
    </section>

    <section id="reviews">
      <h2>Verified Traveler Reviews</h2>
      <div class="grid">${reviewsHtml}</div>
    </section>

    <section id="support">
      <h2>Frequently Asked Questions &amp; Support</h2>
      ${faqsHtml}
    </section>
  </main>

  <footer>
    Wayfare Offline Travel Bundle · 24/7 Traveler Desk: +1 (415) 555-0194 · desk@wayfare.example
  </footer>

  <script>
    function filterMode(mode, btn) {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('#listings-body tr').forEach(function (row) {
        row.style.display = (mode === 'all' || row.getAttribute('data-mode') === mode) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

export async function downloadWebsiteBundle(params: {
  currency: CurrencyCode;
  reviews: TravelReview[];
  savedTrips: SavedTrip[];
  bookings: BookingRecord[];
}): Promise<void> {
  const zip = new JSZip();

  const html = buildStandaloneHtml({
    currency: params.currency,
    reviews: params.reviews,
  });
  zip.file('index.html', html);

  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    await Promise.all(
      CATALOG_IMAGE_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(asset.url);
          if (response.ok) {
            const blob = await response.blob();
            assetsFolder.file(asset.filename, blob);
          }
        } catch {
          // Skip unavailable asset silently so archive still completes
        }
      })
    );
  }

  const catalogPayload = {
    exportedAt: new Date().toISOString(),
    brand: 'Wayfare',
    currency: params.currency,
    destinations: DESTINATIONS.map((d) => ({ ...d, imageUrl: mapAssetPath(d.imageUrl) })),
    tourPackages: TOUR_PACKAGES.map((p) => ({ ...p, imageUrl: mapAssetPath(p.imageUrl) })),
    travelListings: TRAVEL_LISTINGS.map((l) => ({ ...l, imageUrl: mapAssetPath(l.imageUrl) })),
    reviews: params.reviews,
    faqs: SUPPORT_FAQS,
    accountSnapshot: {
      savedTripsCount: params.savedTrips.length,
      savedTrips: params.savedTrips,
      bookingsCount: params.bookings.length,
      bookings: params.bookings,
    },
  };

  zip.file('data/catalog.json', JSON.stringify(catalogPayload, null, 2));
  zip.file(
    'README.txt',
    [
      'Wayfare — Offline Website & Content Bundle',
      '==========================================',
      '',
      'Contents:',
      '- index.html       Complete standalone offline website with destinations, packages, itineraries, transit table, reviews, and FAQs.',
      '- assets/          Editorial travel photographs referenced by index.html.',
      '- data/catalog.json Structured JSON export of all catalog content and your signed-in bookings/saved trips.',
      '',
      'Usage:',
      'Unzip this archive and open index.html in any modern web browser.',
    ].join('\n')
  );

  const archiveBlob = await zip.generateAsync({ type: 'blob' });
  const objectUrl = URL.createObjectURL(archiveBlob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'wayfare-website-bundle.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
