import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Employee, Driver, Passenger, ScheduledTrip, PooledRide, IntraCityRide, PasswordPolicy, TwoFactorPolicy, FailedLoginAttempt, RideRequest } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test connection on startup
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    console.log("Firestore connection verified successfully");
  } catch (error) {
    console.log("Firestore connection initialized.");
  }
}

// Firebase CRUD functions for Employees
export async function syncEmployeeToFirebase(employee: Employee): Promise<boolean> {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), {
      ...employee,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteEmployeeFromFirebase(employeeId: string): Promise<boolean> {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function fetchEmployeesFromFirebase(): Promise<Employee[]> {
  const path = 'employees';
  try {
    const snapshot = await getDocs(collection(db, 'employees'));
    const list: Employee[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Employee);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export function subscribeEmployeesFromFirebase(onUpdate: (employees: Employee[]) => void) {
  const path = 'employees';
  try {
    return onSnapshot(collection(db, 'employees'), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Employee);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase employees:", err);
    return () => {};
  }
}

export async function syncDriverToFirebase(driver: Driver): Promise<boolean> {
  const path = `drivers/${driver.id}`;
  try {
    // Sanitize sensitive plain-text passwords before storing to Firestore
    const sanitizedDriver = { ...driver };
    delete sanitizedDriver.password;
    
    await setDoc(doc(db, 'drivers', driver.id), {
      ...sanitizedDriver,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeDriversFromFirebase(onUpdate: (drivers: Driver[]) => void) {
  const path = 'drivers';
  try {
    return onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const list: Driver[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Driver);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase drivers:", err);
    return () => {};
  }
}

export async function syncPassengerToFirebase(passenger: Passenger): Promise<boolean> {
  const path = `passengers/${passenger.id}`;
  try {
    // Sanitize sensitive plain-text passwords before storing to Firestore
    const sanitizedPassenger = { ...passenger };
    delete sanitizedPassenger.password;

    await setDoc(doc(db, 'passengers', passenger.id), {
      ...sanitizedPassenger,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribePassengersFromFirebase(onUpdate: (passengers: Passenger[]) => void) {
  const path = 'passengers';
  try {
    return onSnapshot(collection(db, 'passengers'), (snapshot) => {
      const list: Passenger[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Passenger);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase passengers:", err);
    return () => {};
  }
}

export async function syncScheduledTripToFirebase(trip: ScheduledTrip): Promise<boolean> {
  const path = `scheduledTrips/${trip.id}`;
  try {
    await setDoc(doc(db, 'scheduledTrips', trip.id), {
      ...trip,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteScheduledTripFromFirebase(tripId: string): Promise<boolean> {
  const path = `scheduledTrips/${tripId}`;
  try {
    await deleteDoc(doc(db, 'scheduledTrips', tripId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function subscribeScheduledTripsFromFirebase(onUpdate: (trips: ScheduledTrip[]) => void) {
  const path = 'scheduledTrips';
  try {
    return onSnapshot(collection(db, 'scheduledTrips'), (snapshot) => {
      const list: ScheduledTrip[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ScheduledTrip);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase scheduled trips:", err);
    return () => {};
  }
}

export async function syncRideToFirebase(ride: PooledRide): Promise<boolean> {
  const path = `pooledRides/${ride.id}`;
  try {
    await setDoc(doc(db, 'pooledRides', ride.id), {
      ...ride,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeRidesFromFirebase(onUpdate: (rides: PooledRide[]) => void) {
  const path = 'pooledRides';
  try {
    return onSnapshot(collection(db, 'pooledRides'), (snapshot) => {
      const list: PooledRide[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PooledRide);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase pooled rides:", err);
    return () => {};
  }
}

export async function syncSecuritySettingsToFirebase(passwordPolicy: PasswordPolicy, twoFactorPolicy: TwoFactorPolicy): Promise<boolean> {
  const path = 'system_security_settings/config';
  try {
    await setDoc(doc(db, 'system_security_settings', 'config'), {
      passwordPolicy,
      twoFactorPolicy,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchSecuritySettingsFromFirebase(): Promise<{ passwordPolicy?: PasswordPolicy; twoFactorPolicy?: TwoFactorPolicy } | null> {
  const path = 'system_security_settings/config';
  try {
    const docSnap = await getDoc(doc(db, 'system_security_settings', 'config'));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function addFailedLoginAttemptToFirebase(attempt: FailedLoginAttempt): Promise<boolean> {
  const path = `auth_failed_attempts/${attempt.id}`;
  try {
    await setDoc(doc(db, 'auth_failed_attempts', attempt.id), {
      ...attempt,
      recordedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeFailedLoginAttemptsFromFirebase(onUpdate: (attempts: FailedLoginAttempt[]) => void) {
  const path = 'auth_failed_attempts';
  try {
    return onSnapshot(collection(db, 'auth_failed_attempts'), (snapshot) => {
      const list: FailedLoginAttempt[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FailedLoginAttempt);
      });
      if (list.length > 0) {
        // Sort newest first
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onUpdate(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase failed login attempts:", err);
    return () => {};
  }
}

// Firebase CRUD and Realtime Subscriptions for Ride Requests
export async function syncRequestToFirebase(request: RideRequest): Promise<boolean> {
  const path = `requests/${request.id}`;
  try {
    await setDoc(doc(db, 'requests', request.id), {
      ...request,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteRequestFromFirebase(requestId: string): Promise<boolean> {
  const path = `requests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'requests', requestId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function subscribeRequestsFromFirebase(onUpdate: (requests: RideRequest[]) => void) {
  const path = 'requests';
  try {
    return onSnapshot(collection(db, 'requests'), (snapshot) => {
      const list: RideRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as RideRequest);
      });
      onUpdate(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase requests:", err);
    return () => {};
  }
}

// Firebase CRUD and Realtime Subscriptions for IntraCity Rides
export async function syncIntraCityRideToFirebase(ride: IntraCityRide): Promise<boolean> {
  const path = `intraCityRides/${ride.id}`;
  try {
    await setDoc(doc(db, 'intraCityRides', ride.id), {
      ...ride,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeIntraCityRidesFromFirebase(onUpdate: (rides: IntraCityRide[]) => void) {
  const path = 'intraCityRides';
  try {
    return onSnapshot(collection(db, 'intraCityRides'), (snapshot) => {
      const list: IntraCityRide[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as IntraCityRide);
      });
      onUpdate(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase intracity rides:", err);
    return () => {};
  }
}

// Firebase CRUD and Realtime Subscriptions for Global Admin Settings & Dynamic UI Controls
export async function syncSettingsToFirebase(settings: any): Promise<boolean> {
  const path = 'admin_settings/global_config';
  try {
    await setDoc(doc(db, 'admin_settings', 'global_config'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeSettingsFromFirebase(onUpdate: (settings: any) => void) {
  const path = 'admin_settings/global_config';
  try {
    return onSnapshot(doc(db, 'admin_settings', 'global_config'), (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase settings:", err);
    return () => {};
  }
}

// Firebase CRUD and Realtime Subscriptions for Last Ended Ride / Passenger Rating Modal
export async function syncLastEndedRideToFirebase(endedRide: any | null, targetUserId?: string): Promise<boolean> {
  try {
    const userId = targetUserId || endedRide?.forUserId || endedRide?.passengerId || endedRide?.driverId;
    if (!endedRide) {
      if (userId) {
        await setDoc(doc(db, 'app_state', `last_ended_ride_${userId}`), {
          data: null,
          updatedAt: new Date().toISOString()
        });
      }
      return true;
    }
    
    // Save to user specific doc if userId is present
    if (userId) {
      await setDoc(doc(db, 'app_state', `last_ended_ride_${userId}`), {
        ...endedRide,
        data: endedRide,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    // Also save to generic doc for general listeners
    await setDoc(doc(db, 'app_state', 'last_ended_ride'), {
      ...endedRide,
      data: endedRide,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'app_state/last_ended_ride');
    return false;
  }
}

export async function clearLastEndedRideInFirebase(userId?: string): Promise<boolean> {
  try {
    if (userId) {
      await setDoc(doc(db, 'app_state', `last_ended_ride_${userId}`), {
        data: null,
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function subscribeLastEndedRideFromFirebase(onUpdate: (endedRide: any | null) => void, userId?: string) {
  const docId = userId ? `last_ended_ride_${userId}` : 'last_ended_ride';
  const path = `app_state/${docId}`;
  try {
    return onSnapshot(doc(db, 'app_state', docId), (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        const info = d?.data !== undefined ? d.data : (d?.id ? d : null);
        onUpdate(info);
      } else {
        onUpdate(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (err) {
    console.error("Error subscribing to Firebase last ended ride:", err);
    return () => {};
  }
}


