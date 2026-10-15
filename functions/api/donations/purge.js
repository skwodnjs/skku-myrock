import { FIRESTORE_ROOT, docFields, failure, parseBody, reject, secureOrigin, success } from '../../_lib/shared.js';
import { assertAccess, googleRequest } from '../../_lib/google.js';
import { ANONYMOUS_DOC, LEDGER } from '../../_lib/donationStore.js';

export const DONATIONS_RESET_CONFIRMATION = '후원회계 초기화';
export async function onRequestPost({request,env}) {
  try {
    secureOrigin(request);
    const caller=await assertAccess(request,env,'president');
    if (!caller.superadmin) reject('검증된 최고관리자만 초기화할 수 있습니다.',403);
    const input=await parseBody(request);
    if (input?.confirmation!==DONATIONS_RESET_CONFIRMATION) reject('초기화 확인 문구를 정확히 입력해 주세요.');
    // Always query the collection anew instead of using a cursor while deleting.
    const url=new URL(LEDGER);
    url.searchParams.set('pageSize','21');
    const list=await googleRequest(env,url.toString());
    if (!list.ok) throw Error('후원 데이터 초기화 조회 실패: ' + list.status);
    const docs=list.data.documents ?? [];
    let deleted=0;
    for (const doc of docs.slice(0,20)) {
      const uri=new URL(doc.name.replace(/^projects\//,'https://firestore.googleapis.com/v1/projects/'));
      if (doc.updateTime) uri.searchParams.set('currentDocument.updateTime',doc.updateTime);
      const remove=await googleRequest(env,uri.toString(),{method:'DELETE'});
      if (!remove.ok) reject('일부 후원 기록을 삭제하지 못했습니다. 상태 확인 후 다시 시도하세요.',503);
      deleted++;
    }
    if (docs.length > 20) return success({deleted,done:false});
    // Fetch once more to cover concurrent writes before removing the anonymous list.
    const check=await googleRequest(env,url.toString());
    if (!check.ok) throw Error('후원 초기화 완료 확인 실패');
    if ((check.data.documents ?? []).length) return success({deleted,done:false});
    const config=await googleRequest(env,ANONYMOUS_DOC);
    if (config.ok) {
      const remove=await googleRequest(env,ANONYMOUS_DOC,{method:'DELETE'});
      if (!remove.ok) throw Error('익명자 명단 초기화 실패');
    } else if (config.status!==404) throw Error('익명자 명단 조회 실패');
    return success({deleted,done:true});
  } catch(error) { return failure(error); }
}
