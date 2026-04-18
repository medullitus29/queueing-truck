// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD31nGVIUJ03wZYl6FTX0KYPNhguOOHrg8",
  authDomain: "queueing-truck-916d0.firebaseapp.com",
  databaseURL: "https://queueing-truck-916d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "queueing-truck-916d0",
  storageBucket: "queueing-truck-916d0.firebasestorage.app",
  messagingSenderId: "343232301586",
  appId: "1:343232301586:web:118790dca72f18c6e3e6cb"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);