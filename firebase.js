// ── Firebase config ──────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJN2Boz6DWzTEjOaiWVoF7B__40sMdxrM",
  authDomain: "easy-notes-omega.firebaseapp.com",
  projectId: "easy-notes-omega",
  storageBucket: "easy-notes-omega.firebasestorage.app",
  messagingSenderId: "1024415247310",
  appId: "1:1024415247310:web:87aab4b359867b253b599f"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
         collection, doc, setDoc, deleteDoc, getDocs, query, where };
