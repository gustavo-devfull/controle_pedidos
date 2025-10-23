// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do banco de dados externo (cadastro-angular)
const externalFirebaseConfig = {
  apiKey: "AIzaSyDclJ7QOuwfRl0NtkHWZgeVl3Y4ApEVM58",
  authDomain: "cadastro-angular.firebaseapp.com",
  projectId: "cadastro-angular",
  storageBucket: "cadastro-angular.firebasestorage.app",
  messagingSenderId: "400971764329",
  appId: "1:400971764329:web:b5473968f480c8cb6e48f8"
};

// Initialize external Firebase
const externalApp = initializeApp(externalFirebaseConfig, 'external');

// Initialize external Firebase services
export const externalDb = getFirestore(externalApp);

export default externalApp;
