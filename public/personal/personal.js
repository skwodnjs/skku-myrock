import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-2H282ITWdqBTYVJBsoC0gnA9Y-xl4LM",
  authDomain: "skku-myrock.firebaseapp.com",
  projectId: "skku-myrock",
  storageBucket: "skku-myrock.firebasestorage.app",
  messagingSenderId: "42597556706",
  appId: "1:42597556706:web:6f6cde9d80c43cf94a59bb"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const nameEl = document.getElementById("name");
const generationEl = document.getElementById("generation");
const sessionEl = document.getElementById("session");
const emailEl = document.getElementById("email");
const emailVerifiedEl = document.getElementById("email-verified");
const logoutBtn = document.getElementById("logout-btn");
const adminSection = document.getElementById("admin-section");

let isSigningOut = false;

logoutBtn?.addEventListener("click", async () => {
  try {
    isSigningOut = true;
    await signOut(auth);
    location.replace("/sign-in");
  } catch (err) {
    isSigningOut = false;
    console.error(err);
    alert("로그아웃 중 오류가 발생했습니다.");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (!isSigningOut) alert("로그인이 필요합니다.");
    location.replace("/");
    return;
  }
  emailVerifiedEl.textContent = user.emailVerified ? "인증됨" : "미인증";

  try {
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("개인정보 데이터가 존재하지 않습니다.");
      return;
    }

    const docData = querySnapshot.docs[0].data();

    nameEl.textContent = docData.name || "-";
    generationEl.textContent = docData.generation || "-";
    sessionEl.textContent = docData.session || "-";
    emailEl.textContent = docData.email || "-";
  } catch (err) {
    console.error(err);
    alert("데이터를 불러오는 중 오류가 발생했습니다.");
  }
});
