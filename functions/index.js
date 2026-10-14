import { randomBytes } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const db = getFirestore();
const auth = getAuth();
const region = 'asia-northeast3';
const settings = { region, timeoutSeconds: 120, maxInstances: 3 };
const roles = new Set(['member', 'part_leader', 'staff', 'president']);
const sessions = new Set(['보컬', '기타', '베이스', '드럼', '키보드']);
const studentIdPattern = /^\d{10}$/;
const memberEmail = studentId => `${studentId}@members.skku-myrock.firebaseapp.com`;

const invalid = message => new HttpsError('invalid-argument', message);
const toText = (value, label, max = 80) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw invalid(`${label} 형식을 확인해 주세요.`);
  }
  return value.trim();
};
const asPositions = input => {
  if (!Array.isArray(input) || input.length > 8 ||
      input.some(value => typeof value !== 'string' || !value.trim() || value.trim().length > 40)) {
    throw invalid('직책은 길이 40자 이하의 문자열 8개까지 입력할 수 있습니다.');
  }
  return input.map(value => value.trim());
};
const asSessions = input => {
  if (!Array.isArray(input) || input.length < 1 || input.length > 5 ||
      input.some(value => !sessions.has(value)) || new Set(input).size !== input.length) {
    throw invalid('세션은 보컬, 기타, 베이스, 드럼, 키보드 중 하나 이상 선택해 주세요.');
  }
  return input;
};
const assertAdmin = async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', '로그인 후 이용해 주세요.');
  const snapshot = await db.collection('users').doc(request.auth.uid).get();
  if (!snapshot.exists) throw new HttpsError('permission-denied', '회원 프로필이 없습니다.');
  const caller = snapshot.data();
  // The existing bootstrap account has BOTH a custom claim and a Firestore flag.
  // Never grant or modify the superadmin claim from website functions.
  const superadmin = request.auth.token.superadmin === true && caller.superadmin === true;
  if (!superadmin && caller.role !== 'president') {
    throw new HttpsError('permission-denied', '회장단 또는 시스템 관리자만 회원을 관리할 수 있습니다.');
  }
  return { uid: request.auth.uid, superadmin };
};
const publicMember = snapshot => {
  const data = snapshot.data();
  return {
    uid: snapshot.id,
    studentId: String(data.studentId ?? ''),
    name: String(data.name ?? ''),
    generation: String(data.generation ?? ''),
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    positions: Array.isArray(data.positions) ? data.positions : [],
    role: roles.has(data.role) ? data.role : 'member',
    handoverAccess: data.handoverAccess === true,
    protected: data.superadmin === true,
  };
};

export const listMembers = onCall(settings, async request => {
  await assertAdmin(request);
  const cursor = request.data?.cursor ?? null;
  if (cursor !== null && (typeof cursor !== 'string' || !studentIdPattern.test(cursor))) {
    throw invalid('목록 조회 기준이 잘못되었습니다.');
  }
  let query = db.collection('users').orderBy('studentId').limit(101);
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.get();
  const page = snapshot.docs.slice(0, 100);
  return {
    members: page.map(publicMember),
    nextCursor: snapshot.docs.length > 100 ? String(page.at(-1)?.data()?.studentId ?? '') : null,
  };
});

export const registerMembers = onCall(settings, async request => {
  await assertAdmin(request);
  const incoming = request.data?.members;
  if (!Array.isArray(incoming) || incoming.length < 1 || incoming.length > 60) {
    throw invalid('한 번에 1~60명을 등록할 수 있습니다.');
  }
  if (JSON.stringify(incoming).length > 80000) throw invalid('업로드 데이터가 너무 큽니다.');
  const seen = new Set();
  // Validate ALL rows before creating even one account.
  const members = incoming.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw invalid(`${index + 1}행의 회원 정보가 올바르지 않습니다.`);
    if (typeof row.studentId !== 'string' || !studentIdPattern.test(row.studentId)) throw invalid(`${index + 1}행: 학번 10자리를 확인해 주세요.`);
    if (seen.has(row.studentId)) throw invalid(`${index + 1}행: 학번이 파일 안에서 중복되었습니다.`);
    seen.add(row.studentId);
    return {
      studentId: row.studentId,
      name: toText(row.name, `${index + 1}행 이름`, 60),
      generation: toText(row.generation, `${index + 1}행 기수`, 20),
      sessions: asSessions(row.sessions),
      positions: asPositions(row.positions ?? []),
    };
  });

  const results = [];
  for (const member of members) {
    const email = memberEmail(member.studentId);
    let created = null;
    try {
      // Never reset the password or overwrite a profile that already exists.
      try {
        const existing = await auth.getUserByEmail(email);
        const doc = await db.collection('users').doc(existing.uid).get();
        results.push({
          studentId: member.studentId, name: member.name,
          status: doc.exists ? 'existing' : 'error',
          message: doc.exists ? '이미 등록된 학번입니다.' : '인증 계정만 존재합니다. 개발 관리자에게 문의해 주세요.',
        });
        continue;
      } catch (error) {
        if (error?.code !== 'auth/user-not-found') throw error;
      }
      const password = randomBytes(24).toString('base64url');
      created = await auth.createUser({ email, password, displayName: member.name, emailVerified: false });
      try {
        await db.collection('users').doc(created.uid).create({
          ...member,
          role: 'member',
          handoverAccess: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        // Auth and Firestore are different services; roll back an incomplete new account.
        await auth.deleteUser(created.uid).catch(rollbackError => {
          console.error('회원 생성 롤백 실패', created.uid, rollbackError);
        });
        throw error;
      }
      results.push({ studentId: member.studentId, name: member.name, status: 'created', initialPassword: password });
    } catch (error) {
      console.error('회원 등록 실패', member.studentId, error);
      results.push({
        studentId: member.studentId, name: member.name,
        status: 'error', message: '등록하지 못했습니다. 계정 상태를 확인하고 다시 시도해 주세요.',
      });
    }
  }
  return { results };
});

export const updateMemberPermissions = onCall(settings, async request => {
  const caller = await assertAdmin(request);
  const { uid, role, handoverAccess, positions } = request.data ?? {};
  if (typeof uid !== 'string' || uid.length < 10 || uid.length > 128) throw invalid('회원 식별자가 올바르지 않습니다.');
  if (!roles.has(role)) throw invalid('올바른 회원 권한을 선택해 주세요.');
  if (typeof handoverAccess !== 'boolean') throw invalid('인수인계 접근 권한을 확인해 주세요.');
  const cleanedPositions = asPositions(positions);
  if (uid === caller.uid) throw new HttpsError('failed-precondition', '본인 권한은 웹에서 변경할 수 없습니다.');
  const target = db.collection('users').doc(uid);
  await db.runTransaction(async transaction => {
    const [callerSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(db.collection('users').doc(caller.uid)),
      transaction.get(target),
    ]);
    const currentCaller = callerSnapshot.data();
    const stillSuperadmin = caller.superadmin && currentCaller?.superadmin === true;
    if (!stillSuperadmin && currentCaller?.role !== 'president') {
      throw new HttpsError('permission-denied', '권한이 변경되었습니다. 다시 로그인해 주세요.');
    }
    if (!targetSnapshot.exists) throw new HttpsError('not-found', '회원을 찾을 수 없습니다.');
    if (targetSnapshot.data().superadmin === true) {
      throw new HttpsError('permission-denied', '최고관리자 계정은 웹에서 변경할 수 없습니다.');
    }
    transaction.update(target, {
      role, handoverAccess, positions: cleanedPositions,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { success: true };
});
