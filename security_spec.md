# Wayfare Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Owner Isolation & PII Partitioning**: `/users/{userId}/private/{docId}` stores all PII (`email`, `phone`, `homeAirport`, `passportNationality`) and is readable/writable strictly by `request.auth.uid == userId` or verified admin. No blanket `isSignedIn()` reads exist anywhere.
2. **Parent Existence for Saved Trips**: `/users/{userId}/savedTrips/{tripId}` cannot exist without `/users/{userId}` existing and `userId == request.auth.uid`.
3. **Immutable Booking Ownership & Terminal Locking**: Bookings in `/bookings/{bookingId}` bind `userId == request.auth.uid` on creation. Users cannot alter prices, `bookingRef`, `userId`, or `createdAt` after booking, and cannot mutate a booking once `status == 'cancelled'`.
4. **Server-Enforced Timestamps**: Every `createdAt` and `updatedAt` field must equal `request.time`.
5. **Verified Email Requirement**: All standard write mutations require `request.auth.token.email_verified == true`.
6. **Admin Spoof Guard**: Admin checks require `request.auth.token.email_verified == true` alongside explicit admin identity or `/admins/{uid}` existence.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Booking**: Creating `/bookings/b1` with `userId: "other-uid"` while signed in as `uid-A` -> MUST DENY.
2. **Shadow Field Injection on Profile**: Creating `/users/uid-A` with an extra `"isAdmin": true` ghost field -> MUST DENY.
3. **Client Timestamp Forgery**: Creating `/bookings/b1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `serverTimestamp()` -> MUST DENY.
4. **Price Tampering on Booking Update**: Updating `/bookings/b1` to change `totalPriceUsd` from `2400` to `1` -> MUST DENY.
5. **Terminal State Resurrection**: Updating `/bookings/b1` when `existing.status == 'cancelled'` back to `'confirmed'` -> MUST DENY.
6. **Cross-User PII Read**: Reading `/users/uid-B/private/info` while authenticated as `uid-A` -> MUST DENY.
7. **Unverified Email Write**: Creating `/supportTickets/t1` with `email_verified: false` -> MUST DENY.
8. **ID Poisoning Attack**: Writing to `/bookings/bad$id..123` or a 500-char document ID -> MUST DENY.
9. **Resource Exhaustion String**: Submitting a 10,000-character `cancellationReason` on `/bookings/b1` -> MUST DENY.
10. **Blanket List Scraping**: Listing `/bookings` without filtering by `userId == request.auth.uid` -> MUST DENY.
11. **Orphaned Saved Trip**: Writing `/users/uid-A/savedTrips/s1` when parent `/users/uid-A` does not exist -> MUST DENY.
12. **Review Rating Out-of-Bounds / Type Poisoning**: Creating `/reviews/r1` with `rating: 99` or `rating: "five"` -> MUST DENY.
