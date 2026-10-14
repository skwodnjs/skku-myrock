import { FIRESTORE_ROOT, failure, parseBody, reject, secureOrigin, success, toFields, validatePermissions, docFields } from '../../_lib/shared.js';
import { assertAdmin, getFirestoreDocument, googleRequest } from '../../_lib/google.js';

export async function onRequestPost({ request, env }) {
  try {
    secureOrigin(request);
    const caller = await assertAdmin(request, env);
    const { uid, role, positions, handoverAccess } = validatePermissions(await parseBody(request));
    if (caller.uid === uid) reject('본인 계정의 권한은 웹에서 변경할 수 없습니다.', 403);
    const target = await getFirestoreDocument(env, uid);
    if (!target) reject('회원을 찾지 못했습니다.', 404);
    if (docFields(target).superadmin === true) reject('기존 최고관리자 계정은 웹에서 변경할 수 없습니다.', 403);
    if (!target.updateTime) throw new Error('Firestore precondition time unavailable');
    const uri = new URL(FIRESTORE_ROOT + '/users/' + encodeURIComponent(uid));
    for (const name of ['role', 'positions', 'handoverAccess', 'updatedAt']) {
      uri.searchParams.append('updateMask.fieldPaths', name);
    }
    uri.searchParams.set('currentDocument.updateTime', target.updateTime);
    const fields = toFields({ role, positions, handoverAccess });
    fields.updatedAt = { timestampValue: new Date().toISOString() };
    const result = await googleRequest(env, uri.toString(), { method: 'PATCH', body: { fields } });
    if (result.status === 409 || result.status === 412) reject('다른 관리자가 정보를 수정했습니다. 새로고침 후 다시 시도해 주세요.', 409);
    if (!result.ok) throw new Error('Firestore role update failed ' + result.status);
    return success({ success: true });
  } catch (error) { return failure(error); }
}
