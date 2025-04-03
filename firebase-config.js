// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXP5JyU7H_gqzG9yTAIdFTEn8JiVrIH8o",
  authDomain: "canvas-drawing-board-866dd.firebaseapp.com",
  projectId: "canvas-drawing-board-866dd",
  storageBucket: "canvas-drawing-board-866dd.firebasestorage.app",
  messagingSenderId: "364595482454",
  appId: "1:364595482454:web:0bea2d4f2f6e381a5290f7",
  measurementId: "G-5TRBM0QG7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);