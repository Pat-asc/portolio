// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = globalThis.__EMBEDDED_FIREBASE_CONFIG__;
if (!firebaseConfig) {
  throw new Error("Firebase config is missing. Build the site with the Firebase environment variables.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);