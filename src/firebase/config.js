// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase principal - usando o mesmo projeto do sistema de pedidos
const firebaseConfig = {
    apiKey: "AIzaSyDclJ7QOuwfRl0NtkHWZgeVl3Y4ApEVM58",
    authDomain: "cadastro-angular.firebaseapp.com",
    projectId: "cadastro-angular",
    storageBucket: "cadastro-angular.firebasestorage.app",
    messagingSenderId: "400971764329",
    appId: "1:400971764329:web:b5473968f480c8cb6e48f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
