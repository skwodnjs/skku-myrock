// ===== 1. Firebase SDK 불러오기 =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ===== 2. firebaseConfig =====
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

const emailEl = document.getElementById("email");
const pwEl = document.getElementById("password");
const btn = document.getElementById("login-btn");

const go = (url) => (window.location.href = url);

async function login() {
    btn.disabled = true;

    const email = emailEl.value.trim();
    const password = pwEl.value;

    try {
        if (!email) throw new Error("아이디(이메일)를 입력하세요.");
        if (!password) throw new Error("비밀번호를 입력하세요.");

        await setPersistence(auth, browserLocalPersistence);

        await signInWithEmailAndPassword(auth, email, password);

        go("/");
    } catch (err) {
        const code = err?.code || "";
        const msg =
            code === "auth/invalid-email" ? "이메일 형식이 올바르지 않습니다." :
            code === "auth/user-not-found" ? "해당 계정을 찾을 수 없습니다." :
            code === "auth/wrong-password" ? "비밀번호가 올바르지 않습니다." :
            code === "auth/too-many-requests" ? "시도가 너무 많습니다. 잠시 후 다시 시도하세요." :
            code === "auth/invalid-credential" ? "유효한 계정이 아닙니다" :
            err?.message || "로그인에 실패했습니다.";

        alert(msg);
        } finally {
        btn.disabled = false;
    }
}

btn.addEventListener("click", login);
document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    login();
});