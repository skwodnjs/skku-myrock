import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-2H282ITWdqBTYVJBsoC0gnA9Y-xl4LM",
  authDomain: "skku-myrock.firebaseapp.com",
  projectId: "skku-myrock",
  storageBucket: "skku-myrock.firebasestorage.app",
  messagingSenderId: "42597556706",
  appId: "1:42597556706:web:6f6cde9d80c43cf94a59bb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const editBtn = document.getElementById("edit");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    editBtn.style.display = "none";
    return;
  }

  try {
    const token = await user.getIdTokenResult(true);

    const isAdmin = token.claims.admin === true;

    if (isAdmin) {
      editBtn.style.display = "inline-block";
    } else {
      editBtn.style.display = "none";
    }

  } catch (err) {
    console.error(err);
    editBtn.style.display = "none";
  }
});
