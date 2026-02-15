// ===== 1. Firebase SDK 불러오기 =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ===== 2. firebaseConfig =====
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

import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function qs(id) {
  return document.getElementById(id);
}

function normalizeGeneration(raw) {
  return String(raw ?? "").trim();
}

function isValidGeneration(gen) {
  return /^[0-9]+(\.5)?$/.test(gen);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    const name = qs("name").value.trim();
    const generation = normalizeGeneration(qs("generation").value);
    const session = qs("session").value;
    const email = qs("email").value.trim();
    const password = qs("password").value;

    try {
      if (!name) throw new Error("이름을 입력하세요.");
      if (!generation) throw new Error("기수를 입력하세요.");
      if (!isValidGeneration(generation)) throw new Error("기수 형식이 올바르지 않습니다. 예: 29 또는 29.5");
      if (!session) throw new Error("세션을 선택하세요.");
      if (!email) throw new Error("이메일을 입력하세요.");
      if (!password || password.length < 6) throw new Error("비밀번호는 6자 이상이어야 합니다.");

      // 1) Auth 계정 생성
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 2) Firestore에 프로필 저장 (users 컬렉션, uid 문서)
      const profile = {
        name,
        generation,
        session,
        email,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), profile);

      // 3) 개인정보 페이지에서 email로 조회하는 personal 컬렉션에도 저장
      //    (요청사항: personal 컬렉션에 email 필드로 확인/조회)
      await setDoc(doc(db, "personal", user.uid), {
        ...profile,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      });

      // 4) 이메일 인증 발송
      await sendEmailVerification(user);

      alert("회원가입 완료! 이메일 인증을 진행해주세요.");
      form.reset();
      location.href = "/";

    } catch (err) {
      const code = err?.code || "";
      const msg =
        code === "auth/email-already-in-use" ? "이미 가입된 이메일입니다." :
        code === "auth/invalid-email" ? "이메일 형식이 올바르지 않습니다." :
        code === "auth/weak-password" ? "비밀번호가 너무 약합니다. (6자 이상)" :
        err?.message || "회원가입에 실패했습니다.";
      alert(msg);

    } finally {
      submitBtn.disabled = false;
    }
  });
});
