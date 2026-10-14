import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMembers, validatePermissions, toFields, docFields,
  memberView, secureOrigin, ApiError,
} from '../functions/_lib/shared.js';
import { onRequestPost as registerHandler } from '../functions/api/members/register.js';
import { onRequestPost as permissionHandler } from '../functions/api/members/permissions.js';
import { onRequestGet as listHandler } from '../functions/api/members/list.js';

const alice = {
  studentId: '2026300001',
  name: '테스트 회원',
  generation: '27.5',
  sessions: ['보컬', '기타'],
  positions: ['보컬파트장'],
};

test('register validates allowed member payload', () => {
  assert.deepEqual(validateMembers([alice]), [alice]);
  assert.throws(() => validateMembers([]), /요청당/);
  assert.throws(() => validateMembers(Array.from({ length: 6 }, (_, i) => ({...alice,studentId:'202630000'+i}))), /5명/);
  assert.throws(() => validateMembers([alice, alice]), /중복 학번/);
  assert.throws(() => validateMembers([{...alice, sessions: ['바이올린']}]), /세션/);
  assert.throws(() => validateMembers([{...alice, studentId:'user@example.com'}]), /학번/);
  assert.throws(() => validateMembers([{...alice, name:''}]), /이름/);
});
test('role changes cannot add unknown privileges', () => {
  assert.deepEqual(validatePermissions({
    uid: 'abcdefghij_12',
    role: 'member',
    handoverAccess: true,
    positions: ['총무'],
  }), {uid:'abcdefghij_12',role:'member',handoverAccess:true,positions:['총무']});
  assert.throws(() => validatePermissions({uid:'abcdefghij_12',role:'superadmin',handoverAccess:true,positions:[]}), /회원 권한/);
  assert.throws(() => validatePermissions({uid:'abcdefghij_12',role:'president',handoverAccess:'true',positions:[]}), /인수인계/);
});
test('Firestore fields serialize sessions, booleans, and protected flag', () => {
  const fields = toFields({...alice, role:'president', handoverAccess:false, superadmin:true});
  const doc = {name:'projects/skku-myrock/databases/(default)/documents/users/uid-123',fields};
  assert.deepEqual(docFields(doc).sessions, alice.sessions);
  assert.equal(memberView(doc).protected,true);
  assert.equal(memberView(doc).handoverAccess,false);
  assert.equal(memberView(doc).role,'president');
});
test('cross-site Origin is blocked', () => {
  const ok = new Request('https://skku-myrock.pages.dev/api/members/register', {headers:{origin:'https://skku-myrock.pages.dev'}});
  assert.doesNotThrow(() => secureOrigin(ok));
  const bad = new Request('https://skku-myrock.pages.dev/api/members/register', {headers:{origin:'https://evil.example'}});
  assert.throws(() => secureOrigin(bad), error => error instanceof ApiError && error.status === 403);
});
test('all membership API routes reject requests without login', async () => {
  const get = new Request('https://skku-myrock.pages.dev/api/members/list');
  const post = new Request('https://skku-myrock.pages.dev/api/members/register', {
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({members:[alice]}),
  });
  const permissions = new Request('https://skku-myrock.pages.dev/api/members/permissions', {
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uid:'abcdefghij_12',role:'president',handoverAccess:false,positions:[]}),
  });
  for (const [handler, request] of [[listHandler,get],[registerHandler,post],[permissionHandler,permissions]]) {
    const response = await handler({request,env:{}});
    assert.equal(response.status,401);
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
});
