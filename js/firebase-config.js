import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpn_n6yQwrXVJrYwd9w8O9cgoHWmWnLTU",
    authDomain: "codecrest-dashboard.firebaseapp.com",
    projectId: "codecrest-dashboard",
    storageBucket: "codecrest-dashboard.firebasestorage.app",
    messagingSenderId: "151685231532",
    appId: "1:151685231532:web:27dcc963ab2ea5b34e4009",
    measurementId: "G-9N1Z125YC7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
