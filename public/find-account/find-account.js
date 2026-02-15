import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

const emailInput = document.getElementById("email");
const btn = document.getElementById("login-btn");

function cleanEmail(raw) {
  return String(raw || "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

btn.addEventListener("click", async () => {
  const email = cleanEmail(emailInput.value);

  if (!email) {
    alert("아이디(이메일)를 입력하세요.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("올바른 이메일 형식이 아닙니다.");
    return;
  }

  btn.disabled = true;

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e) {
    console.error(e);
  } finally {
    btn.disabled = false;
  }

  alert(
    "입력하신 이메일로 재설정 메일을 보냈습니다.\n\n" +
    "※ 가입된 계정이 없는 경우 메일이 발송되지 않을 수 있습니다.\n" +
    "※ 메일이 보이지 않으면 스팸함도 확인해 주세요."
  );
});
