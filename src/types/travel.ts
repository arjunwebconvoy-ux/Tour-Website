export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY';

export type TravelStyle =
  | 'Cultural'
  | 'Alpine & Rail'
  | 'Coastal'
  | 'Slow Luxury'
  | 'Adventure';

export type TravelMode = 'all' | 'package' | 'flight' | 'hotel' | 'bus' | 'car';

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'duration_asc';

export interface SeasonGuide {
  season: string;
  months: string;
  climate: string;
  crowds: string;
  summary: string;
}

export interface DestinationActivity {
  id: string;
  title: string;
  duration: string;
  priceUsd: number;
  summary: string;
}

export interface DestinationStay {
  id: string;
  name: string;
  neighborhood: string;
  nightlyRateUsd: number;
  rating: number;
  highlights: string[];
}

export interface DestinationTransport {
  mode: 'Flight' | 'Rail' | 'Intercity Bus' | 'Car Rental';
  route: string;
  duration: string;
  frequency: string;
  startingPriceUsd: number;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  tagline: string;
  overview: string;
  bestTimeToVisit: string;
  currency: string;
  language: string;
  averageTempC: string;
  startingPriceUsd: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  seasons: SeasonGuide[];
  activities: DestinationActivity[];
  stays: DestinationStay[];
  transportOptions: DestinationTransport[];
  recommendedPackageIds: string[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  location: string;
  description: string;
  meals: string;
  overnight: string;
}

export interface TourPackage {
  id: string;
  destinationId: string;
  destinationName: string;
  title: string;
  subtitle: string;
  durationDays: number;
  groupSizeMax: number;
  groupSizeMin: number;
  priceUsd: number;
  taxesAndFeesUsd: number;
  rating: number;
  reviewCount: number;
  spotsAvailable: number;
  seasonalLabel: string;
  departureWindow: string;
  accommodationSummary: string;
  transportSummary: string;
  cancellationPolicy: string;
  imageUrl: string;
  amenities: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
}

export interface TravelListing {
  id: string;
  itemType: Exclude<TravelMode, 'all'>;
  destinationId: string;
  destinationName: string;
  originCity?: string;
  title: string;
  subtitle: string;
  provider: string;
  durationLabel: string;
  durationDays: number;
  priceUsd: number;
  taxesAndFeesUsd: number;
  rating: number;
  reviewCount: number;
  availabilityCount: number;
  availabilityLabel: string;
  nextAvailableDate: string;
  cabinOrRoomOptions: string[];
  amenities: string[];
  imageUrl: string;
  cancellationNote: string;
  packageId?: string;
}

export interface SearchQueryState {
  mode: TravelMode;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  maxPriceUsd: number;
  durationFilter: 'any' | '1-3' | '4-7' | '8-14';
  minRating: number;
  amenities: string[];
  sortBy: SortOption;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  preferredCurrency: CurrencyCode;
  travelStyle: TravelStyle;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone?: string;
  homeAirport?: string;
  passportNationality?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavedTrip {
  id: string;
  userId: string;
  itemId: string;
  itemType: Exclude<TravelMode, 'all'> | 'destination';
  title: string;
  subtitle: string;
  priceUsd: number;
  imageUrl: string;
  createdAt?: unknown;
}

export type BookingStatus = 'confirmed' | 'cancellation_requested' | 'cancelled';

export interface BookingRecord {
  id: string;
  bookingRef: string;
  userId: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  itemId: string;
  itemType: Exclude<TravelMode, 'all'>;
  itemTitle: string;
  destinationName: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  cabinOrRoom: string;
  basePriceUsd: number;
  taxesAndFeesUsd: number;
  totalPriceUsd: number;
  status: BookingStatus;
  cancellationReason?: string;
  specialRequests?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SupportCategory =
  | 'Booking Change'
  | 'Cancellation & Refund'
  | 'Baggage & Transit'
  | 'Billing'
  | 'General Inquiry';

export interface SupportTicketRecord {
  id: string;
  userId: string;
  subject: string;
  category: SupportCategory;
  bookingRef?: string;
  message: string;
  contactEmail: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TravelReview {
  id: string;
  userId?: string;
  itemId: string;
  itemTitle: string;
  authorName: string;
  authorLocation?: string;
  rating: number;
  title: string;
  comment: string;
  travelDate: string;
  createdAt?: unknown;
}

export interface BookingDraft {
  itemId: string;
  itemType: Exclude<TravelMode, 'all'>;
  itemTitle: string;
  destinationName: string;
  imageUrl: string;
  unitPriceUsd: number;
  taxesPerTravelerUsd: number;
  durationDays: number;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  cabinOrRoomOptions: string[];
  selectedCabinOrRoom: string;
  cancellationNote: string;
}

export type AppView =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'destination'; destinationId: string }
  | { name: 'package'; packageId: string }
  | { name: 'booking'; draft: BookingDraft }
  | { name: 'account'; tab?: 'profile' | 'saved' | 'bookings' | 'tickets' }
  | { name: 'support' };
