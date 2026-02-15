import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const db = getFirestore(app);

const form = document.getElementById("edit-form");
const boardEl = document.getElementById("board"); // schedule | news
const titleEl = document.getElementById("title");

let currentUser = null;
let isAdmin = false;

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  isAdmin = false;

  if (!user) return;

  try {
    const token = await user.getIdTokenResult(true);
    isAdmin = token?.claims?.admin === true;
  } catch (err) {
    console.error(err);
    isAdmin = false;
  }
});

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ===== plain -> html =====
function plainToHtml(raw) {
  const text = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  const paras = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);

  return paras
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join(" ");
}

// ===== markdown -> html =====
function markdownToHtml(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (typeof window.marked?.parse !== "function") return plainToHtml(s);
  return window.marked.parse(s);
}

// ===== format에 따라 contents를 HTML로 만들기 =====
function convertContents(raw, format) {
  const f = String(format ?? "plain").toLowerCase().trim();
  const s = String(raw ?? "").trim();
  if (!s) return "";

  if (f === "html") return s;
  if (f === "markdown") return markdownToHtml(s);
  return plainToHtml(s);
}

function readDynamicInputs(board) {
  if (board === "schedule") {
    const line = document.getElementById("content-line");
    return {
      rawContent: String(line?.value ?? "").trim(),
      format: "plain"
    };
  }

  const area = document.getElementById("content-area");
  const formatEl = document.getElementById("content-format");
  return {
    rawContent: String(area?.value ?? "").trim(),
    format: String(formatEl?.value ?? "plain").trim()
  };
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("로그인 후 이용할 수 있습니다.");
    return;
  }

  // ✅ 관리자 권한 체크 (claims.admin)
  // onAuthStateChanged가 아직 끝나기 전에 submit될 수 있으니 여기서도 한 번 더 확인
  try {
    const token = await currentUser.getIdTokenResult(true);
    isAdmin = token?.claims?.admin === true;
  } catch (err) {
    console.error(err);
    isAdmin = false;
  }

  if (!isAdmin) {
    alert("글쓰기 권한이 없습니다.");
    return;
  }

  const board = String(boardEl?.value ?? "").trim(); // schedule | news
  const title = String(titleEl?.value ?? "").trim();

  if (!board) return alert("게시판을 선택하세요.");
  if (!title) return alert("제목을 입력하세요.");

  const { rawContent, format } = readDynamicInputs(board);

  if (board === "schedule" && !rawContent) return alert("공연 일정 링크(URL)를 입력하세요.");
  if (board === "news" && !rawContent) return alert("내용을 입력하세요.");

  try {
    if (board === "schedule") {
      await addDoc(collection(db, "schedules"), {
        title,
        link: rawContent,
        date: serverTimestamp()
      });

      alert("공연 일정이 저장되었습니다.");
      window.location.href = "/"
      return;
    }

    if (board === "news") {
      const contentsHtml = convertContents(rawContent, format);

      const newsRef = doc(collection(db, "news"));
      const newsId = newsRef.id;

      await setDoc(newsRef, {
        title,
        date: serverTimestamp()
      });

      await setDoc(doc(db, "news-contents", newsId), {
        contents: contentsHtml
      });

      alert("공지사항이 저장되었습니다.");
      window.location.href = "/"
      return;
    }

    alert("알 수 없는 게시판입니다.");
  } catch (err) {
    console.error(err);
    alert("저장에 실패했습니다.");
  }
});
