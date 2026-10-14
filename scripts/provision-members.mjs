import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { mkdirSync, openSync, writeSync, closeSync, existsSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseMembersFile, validateMembers } from './parse-members-file.mjs';

const args = process.argv.slice(2);
const source = args.find(arg => !arg.startsWith('--')) ?? 'private/members.json';
const apply = args.includes('--apply');
const outputFlagIndex = args.indexOf('--output');
if (outputFlagIndex !== -1 && (!args[outputFlagIndex + 1] || args[outputFlagIndex + 1].startsWith('--'))) {
  throw new Error('사용법: --output private/파일명.csv');
}
const unknown = args.filter((arg, index) => {
  if (arg === source || arg === '--apply' || arg === '--output') return false;
  if (outputFlagIndex !== -1 && index === outputFlagIndex + 1) return false;
  return true;
});
if (unknown.length) throw new Error('알 수 없는 옵션: ' + unknown.join(' '));

const output = resolve(outputFlagIndex < 0 ? 'private/initial-credentials.csv' : args[outputFlagIndex + 1]);
const privateDir = resolve('private');
if (!output.startsWith(privateDir + sep) || !output.toLowerCase().endsWith('.csv')) {
  throw new Error('초기 비밀번호 출력 파일은 Git에서 제외된 private/ 폴더의 CSV여야 합니다.');
}
const members = validateMembers(parseMembersFile(source));
console.log(members.length + '명 유효성 검사 완료. ' + (apply ? '실제 등록 모드' : '검증 전용 모드'));
console.log('파일: ' + source);
if (!apply) {
  console.log('실제 등록: node scripts/provision-members.mjs ' + source + ' --apply');
  console.log('이미 initial-credentials.csv가 있다면 --output private/새파일명.csv 옵션을 사용하세요.');
  process.exit(0);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS가 지정되지 않았습니다. Application Default Credentials 환경이 준비되어 있어야 합니다.');
}
if (existsSync(output)) throw new Error(output + ' 파일이 이미 있습니다. 덮어쓰지 않습니다. --output private/새파일명.csv 옵션을 사용하세요.');

initializeApp({ credential: applicationDefault(), projectId: 'skku-myrock' });
const auth = getAuth();
const db = getFirestore();
mkdirSync(dirname(output), { recursive: true });

const csv = value => {
  const raw = String(value ?? '');
  // Spreadsheet formula injection guard. Password values are random, but names are user-provided.
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
};
const fd = openSync(output, 'wx', 0o600);
let createdCount = 0;
let existingCount = 0;
let errorCount = 0;
try {
  writeSync(fd, 'studentId,name,initialPassword,status\n');
  for (const member of members) {
    const email = member.studentId + '@members.skku-myrock.firebaseapp.com';
    let user = null;
    let password = '';
    let status = 'existing';
    try {
      try {
        user = await auth.getUserByEmail(email);
      } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
        password = randomBytes(24).toString('base64url');
        user = await auth.createUser({ email, password, displayName: member.name, emailVerified: false });
        status = 'created';
      }

      const ref = db.collection('users').doc(user.uid);
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        try {
          await ref.create({
            studentId: member.studentId,
            name: member.name,
            generation: member.generation,
            sessions: member.sessions,
            positions: member.positions,
            role: 'member',
            handoverAccess: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (error) {
          if (status === 'created') {
            await auth.deleteUser(user.uid).catch(rollbackError => {
              console.error('주의: 신규 계정 롤백 실패', member.studentId, rollbackError);
            });
          }
          throw error;
        }
      }
      // Keep all fields and passwords intact for existing accounts.
      writeSync(fd, [member.studentId, member.name, password, status].map(csv).join(',') + '\n');
      if (status === 'created') createdCount += 1;
      else existingCount += 1;
      console.log(member.studentId + ': ' + status);
    } catch (error) {
      errorCount += 1;
      writeSync(fd, [member.studentId, member.name, '', 'error'].map(csv).join(',') + '\n');
      console.error(member.studentId + ': 등록 실패 - ' + error.message);
    }
  }
} finally {
  closeSync(fd);
}
console.log('완료: 신규 ' + createdCount + '명, 기존 ' + existingCount + '명, 실패 ' + errorCount + '명');
console.log('임시 비밀번호 파일: ' + output);
console.log('초기 비밀번호는 새로 생성한 계정에만 기록합니다. GitHub에 업로드하지 마세요.');
if (errorCount) process.exitCode = 1;
