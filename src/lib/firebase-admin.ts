import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // For local development with emulator
      if (process.env.NODE_ENV === "development") {
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

        // Set emulator host for admin SDK
        process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

        console.log("🔥 Firebase Admin initialized for development");
      } else {
        // For production
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

        if (!privateKey || !clientEmail) {
          console.warn(
            "⚠️ Firebase Admin credentials not found, some features may not work"
          );
          // Initialize without credentials for development
          adminApp = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          });
          return adminApp;
        }

        // Clean up the private key
        const cleanPrivateKey = privateKey.replace(/\\n/g, "\n");

        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
            clientEmail: clientEmail,
            privateKey: cleanPrivateKey,
          }),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

        console.log("🚀 Firebase Admin initialized for production");
      }
    } catch (error) {
      console.error("❌ Error initializing Firebase Admin:", error);
      // Fallback initialization without credentials
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

// Get Firebase Admin services
export function getFirebaseAdmin() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }

  return {
    app: adminApp,
    auth: getAuth(adminApp),
    firestore: getFirestore(adminApp),
  };
}

// Helper function to verify Firebase ID token
export async function verifyIdToken(idToken: string) {
  try {
    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw new Error("Invalid ID token");
  }
}
