/**
 * Firestore Security Rules Test Suite (Dirty Dozen Adversarial Verification)
 * Run with @firebase/rules-unit-testing against Firestore Emulator.
 */
import assert from 'node:assert/strict';

export const DIRTY_DOZEN_PAYLOADS = [
  {
    name: '01. Identity Spoofing on Booking',
    operation: 'create',
    path: 'bookings/booking_spoof_1',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { userId: 'uid-B', status: 'confirmed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '02. Shadow Field Injection on Profile',
    operation: 'create',
    path: 'users/uid-A',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { uid: 'uid-A', displayName: 'Alex', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '03. Client Timestamp Forgery',
    operation: 'create',
    path: 'bookings/booking_time_1',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { userId: 'uid-A', createdAt: new Date('2020-01-01T00:00:00Z') },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '04. Price Tampering on Booking Update',
    operation: 'update',
    path: 'bookings/booking_existing',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { totalPriceUsd: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '05. Terminal State Resurrection',
    operation: 'update',
    path: 'bookings/booking_cancelled',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { status: 'confirmed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '06. Cross-User PII Read',
    operation: 'get',
    path: 'users/uid-B/private/info',
    auth: { uid: 'uid-A', email_verified: true },
    payload: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '07. Unverified Email Write',
    operation: 'create',
    path: 'supportTickets/ticket_unverified',
    auth: { uid: 'uid-A', email_verified: false },
    payload: { userId: 'uid-A', subject: 'Help', status: 'open' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '08. ID Poisoning Attack',
    operation: 'create',
    path: 'bookings/bad$id..123',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { userId: 'uid-A' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '09. Resource Exhaustion String',
    operation: 'update',
    path: 'bookings/booking_existing',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { status: 'cancellation_requested', cancellationReason: 'x'.repeat(10000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Blanket List Scraping',
    operation: 'list',
    path: 'bookings',
    auth: { uid: 'uid-A', email_verified: true },
    payload: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Orphaned Saved Trip',
    operation: 'create',
    path: 'users/uid-no-profile/savedTrips/trip_1',
    auth: { uid: 'uid-no-profile', email_verified: true },
    payload: { userId: 'uid-no-profile', itemId: 'kyoto' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Review Rating Out-of-Bounds',
    operation: 'create',
    path: 'reviews/rev_bad',
    auth: { uid: 'uid-A', email_verified: true },
    payload: { userId: 'uid-A', rating: 99 },
    expected: 'PERMISSION_DENIED',
  },
];

assert.equal(DIRTY_DOZEN_PAYLOADS.length, 12);
