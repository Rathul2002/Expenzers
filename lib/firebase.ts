import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA04kTdxcU1539ctIpFoOZCgNJmSyKuDg0",
    authDomain: "expense-tracker-4f4e7.firebaseapp.com",
    projectId: "expense-tracker-4f4e7",
    storageBucket: "expense-tracker-4f4e7.firebasestorage.app",
    messagingSenderId: "598067969026",
    appId: "1:598067969026:web:4a35b9685c9394b93b3b1b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
