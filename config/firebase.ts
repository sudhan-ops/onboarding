import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// --- IMPORTANT ---
// This configuration has been updated with your Firebase project details.
// To use a different project:
// 1. Go to https://console.firebase.google.com/ and select your project.
// 2. In your project, go to Project Settings (gear icon).
// 3. Under the "General" tab, scroll to "Your apps" and find your web app's config.
// 4. Copy the `firebaseConfig` object and paste it here.
// 5. In the Firebase console, go to Authentication -> Sign-in method and enable desired providers (e.g., Google, Email/Password).
const firebaseConfig = {
  apiKey: "AIzaSyCB1l1bj4-Ki9oQ69J6p73cKS6xBwec324",
  authDomain: "onboarding-a5970.firebaseapp.com",
  projectId: "onboarding-a5970",
  storageBucket: "onboarding-a5970.firebasestorage.app",
  messagingSenderId: "177298550259",
  appId: "1:177298550259:web:20ffe97ac3a6a5f380b686",
  measurementId: "G-F80MEQ06FB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the analytics service
export const analytics = getAnalytics(app);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the Firestore database service
export const db = getFirestore(app);
