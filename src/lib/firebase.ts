import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

// const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
// if (missingEnvVars.length > 0) {
//   throw new Error(
//     `Missing required Firebase environment variables: ${missingEnvVars.join(
//       ", "
//     )}`
//   );
// }

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Track emulator connection status
let emulatorsConnected = false;

// Connect to emulators in development
// if (process.env.NODE_ENV === "development") {
//   try {
//     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
//     console.log("🔥 Connected to Firebase Auth Emulator");

//     connectFirestoreEmulator(db, "localhost", 8080);
//     console.log("🔥 Connected to Firestore Emulator");

//     connectStorageEmulator(storage, "localhost", 9199);
//     console.log("🔥 Connected to Storage Emulator");
//   } catch (error) {
//     console.warn("⚠️ Failed to connect to Firebase emulators:", error);
//     console.log("💡 Make sure to run: firebase emulators:start");
//   }
// } else if (process.env.NODE_ENV === "production") {
//   console.log("🚀 Connected to Firebase Production");
// }

// Export Firebase app instance
export { app };

// Export project configuration
export const firebaseProjectConfig = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
};

// Collection names - centralized for consistency
export const COLLECTIONS = {
  USERS: "users",
  PRODUCT_VARIANTS: "productVariants",
  PRODUCTS: "products",
  SALES: "sales",
  RETURNS: "returns",
  PURCHASE_ORDERS: "purchaseOrders",
  SUPPLIERS: "suppliers",
} as const;
