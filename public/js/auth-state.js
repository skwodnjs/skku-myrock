import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC-2H282ITWdqBTYVJBsoC0gnA9Y-xl4LM",
    authDomain: "skku-myrock.firebaseapp.com",
    projectId: "skku-myrock",
    storageBucket: "skku-myrock.firebasestorage.app",
    messagingSenderId: "42597556706",
    appId: "1:42597556706:web:6f6cde9d80c43cf94a59bb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const loginLink = document.getElementById("log-in");

onAuthStateChanged(auth, (user) => {
  if (!loginLink) return;

  if (user) {
    loginLink.textContent = "개인정보";
    loginLink.href = "/personal";
  } else {
    loginLink.textContent = "로그인";
    loginLink.href = "/sign-in";
  }
});
