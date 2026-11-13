import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import {
  BookingDraft,
  BookingRecord,
  CurrencyCode,
  SavedTrip,
  SupportCategory,
  SupportTicketRecord,
  TravelReview,
  TravelStyle,
  UserPrivateInfo,
  UserProfile,
} from '../types/travel';
import { INITIAL_REVIEWS } from '../data/catalog';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  profile: UserProfile | null;
  privateInfo: UserPrivateInfo | null;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  savedTrips: SavedTrip[];
  bookings: BookingRecord[];
  supportTickets: SupportTicketRecord[];
  reviews: TravelReview[];
  dataLoading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  updateProfileData: (updates: {
    displayName: string;
    preferredCurrency: CurrencyCode;
    travelStyle: TravelStyle;
    phone: string;
    homeAirport: string;
    passportNationality: string;
  }) => Promise<void>;
  isItemSaved: (itemId: string) => boolean;
  toggleSaveTrip: (item: {
    itemId: string;
    itemType: SavedTrip['itemType'];
    title: string;
    subtitle: string;
    priceUsd: number;
    imageUrl: string;
  }) => Promise<boolean>;
  createBooking: (params: {
    draft: BookingDraft;
    travelerName: string;
    travelerEmail: string;
    travelerPhone: string;
    specialRequests: string;
  }) => Promise<BookingRecord>;
  requestBookingCancellation: (bookingId: string, reason: string) => Promise<void>;
  createSupportTicket: (params: {
    subject: string;
    category: SupportCategory;
    bookingRef?: string;
    message: string;
    contactEmail: string;
  }) => Promise<void>;
  submitReview: (params: {
    itemId: string;
    itemTitle: string;
    rating: number;
    title: string;
    comment: string;
    travelDate: string;
  }) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

function toMillis(val: unknown): number {
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');

  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicketRecord[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<TravelReview[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Ensure parent /users/{uid} and /users/{uid}/private/info exist upon sign-in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfileReady(false);
      if (!firebaseUser) {
        setProfile(null);
        setPrivateInfo(null);
        setSavedTrips([]);
        setBookings([]);
        setSupportTickets([]);
        setAuthReady(true);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (!userSnap.exists()) {
          const newProfile = {
            uid: firebaseUser.uid,
            displayName: (firebaseUser.displayName || 'Traveler').slice(0, 120),
            ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL.slice(0, 500) } : {}),
            preferredCurrency: 'USD' as CurrencyCode,
            travelStyle: 'Cultural' as TravelStyle,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
        }

        const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
        let privSnap;
        try {
          privSnap = await getDoc(privateRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}/private/info`);
        }

        if (!privSnap.exists()) {
          const newPrivate = {
            uid: firebaseUser.uid,
            email: (firebaseUser.email || 'traveler@wayfare.app').slice(0, 180),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(privateRef, newPrivate);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/private/info`);
          }
        }

        setProfileReady(true);
      } catch (err) {
        console.error('Error initializing user profile:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Public reviews listener
  useEffect(() => {
    const reviewsRef = collection(db, 'reviews');
    const unsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const items: TravelReview[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId || ''),
            itemId: String(data.itemId || ''),
            itemTitle: String(data.itemTitle || ''),
            authorName: String(data.authorName || 'Traveler'),
            rating: Number(data.rating || 5),
            title: String(data.title || ''),
            comment: String(data.comment || ''),
            travelDate: String(data.travelDate || ''),
            createdAt: data.createdAt,
          };
        });
        items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setFirestoreReviews(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );

    return () => unsubscribe();
  }, []);

  // User-scoped Firestore listeners (guarded strictly by authReady && user && profileReady)
  useEffect(() => {
    if (!authReady || !user || !profileReady) {
      return;
    }

    setDataLoading(true);

    const userPath = `users/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          if (data.preferredCurrency) {
            setCurrencyState(data.preferredCurrency);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, userPath);
      }
    );

    const privatePath = `users/${user.uid}/private/info`;
    const unsubPrivate = onSnapshot(
      doc(db, 'users', user.uid, 'private', 'info'),
      (snap) => {
        if (snap.exists()) {
          setPrivateInfo(snap.data() as UserPrivateInfo);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, privatePath);
      }
    );

    const savedPath = `users/${user.uid}/savedTrips`;
    const savedQuery = query(
      collection(db, 'users', user.uid, 'savedTrips'),
      where('userId', '==', user.uid)
    );
    const unsubSaved = onSnapshot(
      savedQuery,
      (snap) => {
        const list: SavedTrip[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedTrip, 'id'>),
        }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setSavedTrips(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, savedPath);
      }
    );

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid)
    );
    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snap) => {
        const list: BookingRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookingRecord, 'id'>),
        }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setBookings(list);
        setDataLoading(false);
      },
      (error) => {
        setDataLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    );

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid)
    );
    const unsubTickets = onSnapshot(
      ticketsQuery,
      (snap) => {
        const list: SupportTicketRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SupportTicketRecord, 'id'>),
        }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setSupportTickets(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'supportTickets');
      }
    );

    return () => {
      unsubProfile();
      unsubPrivate();
      unsubSaved();
      unsubBookings();
      unsubTickets();
    };
  }, [authReady, user, profileReady]);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setAuthError(message);
      return null;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async () => {
    setAuthBusy(true);
    try {
      await signOut(auth);
    } finally {
      setAuthBusy(false);
    }
  };

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
    if (user && profile) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, {
        preferredCurrency: next,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
    }
  };

  const updateProfileData = async (updates: {
    displayName: string;
    preferredCurrency: CurrencyCode;
    travelStyle: TravelStyle;
    phone: string;
    homeAirport: string;
    passportNationality: string;
  }) => {
    if (!user) throw new Error('Sign in required.');

    const cleanName = updates.displayName.trim().slice(0, 120) || 'Traveler';
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        displayName: cleanName,
        preferredCurrency: updates.preferredCurrency,
        travelStyle: updates.travelStyle,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }

    const privateRef = doc(db, 'users', user.uid, 'private', 'info');
    const cleanPhone = updates.phone.trim().slice(0, 40);
    const cleanAirport = updates.homeAirport.trim().slice(0, 64);
    const cleanNationality = updates.passportNationality.trim().slice(0, 80);

    try {
      await updateDoc(privateRef, {
        email: (user.email || privateInfo?.email || 'traveler@wayfare.app').slice(0, 180),
        phone: cleanPhone,
        homeAirport: cleanAirport,
        passportNationality: cleanNationality,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/private/info`);
    }

    setCurrencyState(updates.preferredCurrency);
  };

  const isItemSaved = (itemId: string) => savedTrips.some((t) => t.itemId === itemId);

  const toggleSaveTrip = async (item: {
    itemId: string;
    itemType: SavedTrip['itemType'];
    title: string;
    subtitle: string;
    priceUsd: number;
    imageUrl: string;
  }): Promise<boolean> => {
    if (!user) return false;

    const existing = savedTrips.find((t) => t.itemId === item.itemId);
    const docId = item.itemId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const path = `users/${user.uid}/savedTrips/${docId}`;

    if (existing) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'savedTrips', existing.id));
        return false;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savedTrips/${existing.id}`);
      }
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'savedTrips', docId), {
        userId: user.uid,
        itemId: item.itemId.slice(0, 128),
        itemType: item.itemType,
        title: item.title.slice(0, 160),
        subtitle: item.subtitle.slice(0, 200),
        priceUsd: Math.max(0, Math.min(250000, Number(item.priceUsd) || 0)),
        imageUrl: item.imageUrl.slice(0, 400),
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const createBooking = async (params: {
    draft: BookingDraft;
    travelerName: string;
    travelerEmail: string;
    travelerPhone: string;
    specialRequests: string;
  }): Promise<BookingRecord> => {
    if (!user) throw new Error('Please sign in with Google to confirm your booking.');

    const { draft, travelerName, travelerEmail, travelerPhone, specialRequests } = params;
    const totalTravelers = draft.adults + draft.children;
    const basePriceUsd = Math.round(draft.unitPriceUsd * (draft.adults + draft.children * 0.75));
    const taxesAndFeesUsd = Math.round(draft.taxesPerTravelerUsd * totalTravelers);
    const totalPriceUsd = basePriceUsd + taxesAndFeesUsd;

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `WF-2026-${randomCode}`;

    const payload: Record<string, unknown> = {
      bookingRef,
      userId: user.uid,
      travelerName: travelerName.trim().slice(0, 120),
      travelerEmail: travelerEmail.trim().slice(0, 180),
      travelerPhone: travelerPhone.trim().slice(0, 40),
      itemId: draft.itemId.slice(0, 128),
      itemType: draft.itemType,
      itemTitle: draft.itemTitle.slice(0, 180),
      destinationName: draft.destinationName.slice(0, 120),
      departureDate: draft.departureDate.slice(0, 32),
      returnDate: draft.returnDate.slice(0, 32),
      adults: Math.max(1, Math.min(16, Math.round(draft.adults))),
      children: Math.max(0, Math.min(12, Math.round(draft.children))),
      cabinOrRoom: draft.selectedCabinOrRoom.slice(0, 80),
      basePriceUsd,
      taxesAndFeesUsd,
      totalPriceUsd,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cleanNotes = specialRequests.trim().slice(0, 500);
    if (cleanNotes.length > 0) {
      payload.specialRequests = cleanNotes;
    }

    try {
      const ref = await addDoc(collection(db, 'bookings'), payload);
      return {
        id: ref.id,
        bookingRef,
        userId: user.uid,
        travelerName: String(payload.travelerName),
        travelerEmail: String(payload.travelerEmail),
        travelerPhone: String(payload.travelerPhone),
        itemId: String(payload.itemId),
        itemType: draft.itemType,
        itemTitle: String(payload.itemTitle),
        destinationName: String(payload.destinationName),
        departureDate: String(payload.departureDate),
        returnDate: String(payload.returnDate),
        adults: Number(payload.adults),
        children: Number(payload.children),
        cabinOrRoom: String(payload.cabinOrRoom),
        basePriceUsd,
        taxesAndFeesUsd,
        totalPriceUsd,
        status: 'confirmed',
        specialRequests: cleanNotes || undefined,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    }
  };

  const requestBookingCancellation = async (bookingId: string, reason: string) => {
    if (!user) throw new Error('Sign in required.');
    const cleanReason = reason.trim().slice(0, 400);
    if (cleanReason.length < 5) {
      throw new Error('Please provide at least 5 characters explaining your cancellation request.');
    }

    const bookingDoc = doc(db, 'bookings', bookingId);
    try {
      await updateDoc(bookingDoc, {
        status: 'cancellation_requested',
        cancellationReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const createSupportTicket = async (params: {
    subject: string;
    category: SupportCategory;
    bookingRef?: string;
    message: string;
    contactEmail: string;
  }) => {
    if (!user) throw new Error('Please sign in with Google to submit a support ticket.');

    const payload: Record<string, unknown> = {
      userId: user.uid,
      subject: params.subject.trim().slice(0, 160),
      category: params.category,
      message: params.message.trim().slice(0, 2000),
      contactEmail: params.contactEmail.trim().slice(0, 180),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cleanRef = (params.bookingRef || '').trim().slice(0, 32);
    if (cleanRef.length > 0) {
      payload.bookingRef = cleanRef;
    }

    try {
      await addDoc(collection(db, 'supportTickets'), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'supportTickets');
    }
  };

  const submitReview = async (params: {
    itemId: string;
    itemTitle: string;
    rating: number;
    title: string;
    comment: string;
    travelDate: string;
  }) => {
    if (!user) throw new Error('Please sign in with Google to post a review.');

    const authorName = (profile?.displayName || user.displayName || 'Verified Traveler').trim().slice(0, 80);

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        itemId: params.itemId.slice(0, 128),
        itemTitle: params.itemTitle.slice(0, 180),
        authorName,
        rating: Math.max(1, Math.min(5, Math.round(params.rating))),
        title: params.title.trim().slice(0, 120),
        comment: params.comment.trim().slice(0, 1200),
        travelDate: params.travelDate.trim().slice(0, 32),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    }
  };

  const reviews = useMemo(() => [...firestoreReviews, ...INITIAL_REVIEWS], [firestoreReviews]);

  const value: FirebaseContextValue = {
    user,
    authReady,
    authBusy,
    authError,
    profile,
    privateInfo,
    currency,
    setCurrency,
    savedTrips,
    bookings,
    supportTickets,
    reviews,
    dataLoading,
    signInWithGoogle,
    signOutUser,
    updateProfileData,
    isItemSaved,
    toggleSaveTrip,
    createBooking,
    requestBookingCancellation,
    createSupportTicket,
    submitReview,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
