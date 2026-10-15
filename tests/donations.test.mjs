import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { toFields, docFields } from '../functions/_lib/shared.js';
import { normalizeDonation, normalizeAnonymousPeople, publicDonation } from '../functions/_lib/donations.js';
import { onRequestGet as publicGet } from '../functions/api/donations/public.js';
import { onRequestGet as mineGet } from '../functions/api/donations/mine.js';
import { onRequestGet as manageGet,onRequestPost as managePost } from '../functions/api/donations/manage.js';
import { onRequestPost as purgePost, DONATIONS_RESET_CONFIRMATION } from '../functions/api/donations/purge.js';

test('CSV semantics: only o is anonymous; unrecognized identifiers and same-name people are handled safely', () => {
  const sample={date:'2026-10-04',donorName:'홍길동',studentId:'2026300001',amount:'10000',anonymous:'o'};
  assert.equal(normalizeDonation({...sample,anonymous:'o'}).anonymous,'o');
  for(const flag of ['','x','NO','1','false','O'])assert.equal(normalizeDonation({...sample,anonymous:flag}).anonymous,'x');
  assert.equal(publicDonation({...sample,id:'donation1'},[]).donorName,'익명');
  assert.equal(publicDonation({...sample,id:'donation1',anonymous:'x'},[]).donorName,'홍길동');
  assert.equal(publicDonation({...sample,id:'donation1',anonymous:'x',studentId:''},[]).donorName,'익명');
  assert.equal(publicDonation({...sample,id:'donation1',anonymous:'x',donorName:''},[]).donorName,'익명');
  const people=normalizeAnonymousPeople([{donorName:'홍길동',studentId:'2026300001'}]);
  assert.equal(publicDonation({...sample,id:'donation1',anonymous:'x'},people).donorName,'익명');
  assert.equal(publicDonation({...sample,id:'donation1',studentId:'2026300002',anonymous:'x'},people).donorName,'홍길동');
  assert.throws(()=>normalizeDonation({...sample,studentId:'not-an-id'}),/학번/);
  assert.throws(()=>normalizeDonation({...sample,amount:'-10'}),/후원금액/);
});
test('CSV file parsing supports optional names and student IDs and safe re-export',async()=>{
  const ts=await readFile(new URL('../src/donationData.ts',import.meta.url),'utf8');
  const typescript=await import('typescript');
  const js=typescript.default.transpileModule(ts,{compilerOptions:{module:typescript.default.ModuleKind.ESNext,target:typescript.default.ScriptTarget.ES2022}}).outputText;
  const {parseDonationCsv,serializeDonationCsv}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
  const input='\uFEFF후원일,후원자명,학번,후원금액,익명여부\r\n2026-01-01,홍길동,2026300001,10000,o\r\n2026-02-02,,,5000,\r\n2026-02-03,"홍,길동",,7000,X\r\n';
  const rows=parseDonationCsv(input);
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(r=>r.anonymous),['o','x','x']);
  assert.equal(rows[1].studentId,'');
  assert.equal(rows[2].donorName,'홍,길동');
  assert.equal(parseDonationCsv(serializeDonationCsv(rows)).length,3);
  assert.throws(()=>parseDonationCsv('후원일,이름\n2026-01-01,홍길동'),/헤더/);
  assert.throws(()=>parseDonationCsv('후원일,후원자명,학번,후원금액,익명여부\n2026-01-01,홍길동,2,1000,x'),/학번/);
});
test('private profile checks, role matrix, database writes and superadmin finance reset are enforced by real handlers',async()=>{
  if(!globalThis.crypto)globalThis.crypto=webcrypto;
  const keys=await globalThis.crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const jwk={...await globalThis.crypto.subtle.exportKey('jwk',keys.publicKey),kid:'donation-key',alg:'RS256'};
  const pem=Buffer.from(await globalThis.crypto.subtle.exportKey('pkcs8',keys.privateKey)).toString('base64');
  const env={FIREBASE_SERVICE_ACCOUNT:JSON.stringify({project_id:'skku-myrock',
    client_email:'tests@skku-myrock.iam.gserviceaccount.com',
    private_key:'-----BEGIN PRIVATE KEY-----\n'+pem+'\n-----END PRIVATE KEY-----\n'})};
  const actors={member:{uid:'donationMember123',role:'member',studentId:'2026300001'},
    staff:{uid:'donationStaff1234',role:'staff',studentId:'2026300002'},
    super:{uid:'donationSuper1234',role:'member',studentId:'2026300003',superadmin:true}};
  const token={};
  for(const [key,actor] of Object.entries(actors)){
    const now=Math.floor(Date.now()/1000);
    const first=Buffer.from(JSON.stringify({alg:'RS256',kid:'donation-key'})).toString('base64url');
    const second=Buffer.from(JSON.stringify({aud:'skku-myrock',
      iss:'https://securetoken.google.com/skku-myrock',sub:actor.uid,iat:now,exp:now+1800,auth_time:now-60,
      ...(actor.superadmin?{superadmin:true}:{})})).toString('base64url');
    const payload=first+'.'+second;
    const signature=await globalThis.crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(payload));
    token[key]=payload+'.'+Buffer.from(signature).toString('base64url');
  }
  const root='projects/skku-myrock/databases/(default)/documents';
  const docs=new Map();
  let version=0;
  const now=()=>'2026-10-15T12:00:'+String(++version).padStart(2,'0')+'Z';
  const put=(path,values)=>docs.set(root+path,{name:root+path,fields:toFields(values),updateTime:now()});
  for(const actor of Object.values(actors))put('/users/'+actor.uid,{studentId:actor.studentId,role:actor.role,
    superadmin:actor.superadmin===true,name:'테스터'});
  put('/donations/11111111-1111-4111-8111-111111111111',{date:'2026-10-04',donorName:'홍길동',
    studentId:'2026300001',amount:'10000',anonymous:'x'});
  put('/donations/22222222-2222-4222-8222-222222222222',{date:'2026-10-03',donorName:'홍길동',
    studentId:'2026300002',amount:'20000',anonymous:'x'});
  put('/donations/33333333-3333-4333-8333-333333333333',{date:'2026-10-02',donorName:'',
    studentId:'',amount:'500',anonymous:'x'});
  put('/financeSettings/anonymousDonors',{people:[{donorName:'홍길동',studentId:'2026300001'}]});
  const previousFetch=globalThis.fetch;
  globalThis.fetch=async(raw,options={})=>{
    const uri=new URL(String(raw)),data=typeof options.body==='string'&&options.body.startsWith('{')?JSON.parse(options.body):null;
    const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
    if(uri.pathname.includes('/service_accounts/v1/jwk/'))return response({keys:[jwk]});
    if(uri.hostname==='oauth2.googleapis.com')return response({access_token:'test-access',expires_in:3600});
    if(uri.hostname==='firestore.googleapis.com'){
      let docPath=decodeURIComponent(uri.pathname.slice(uri.pathname.indexOf('/documents')+'/documents'.length));
      if(docPath===':commit'){
        for(const write of data.writes){docs.set(write.update.name,{name:write.update.name,fields:write.update.fields,updateTime:now()});}
        return response({writeResults:[]});
      }
      const key=root+docPath;
      if(options.method==='PATCH'){
        const old=docs.get(key);
        if(uri.searchParams.get('currentDocument.exists')==='false'&&old)return response({error:{}},412);
        if(uri.searchParams.has('currentDocument.updateTime')&&uri.searchParams.get('currentDocument.updateTime')!==old?.updateTime)return response({error:{}},412);
        docs.set(key,{name:key,fields:data.fields,updateTime:now()});return response(docs.get(key));
      }
      if(options.method==='DELETE'){docs.delete(key);return response({});}
      if(docPath==='/donations'){
        const found=[...docs.values()].filter(doc=>doc.name.startsWith(root+'/donations/'));
        return response({documents:found});
      }
      return docs.has(key)?response(docs.get(key)):response({error:{}},404);
    }
    throw Error('unexpected external call '+uri.href);
  };
  const request=(as,path,body)=>new Request('https://skku-myrock.pages.dev/api/donations/'+path,{
    method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),
      ...(as?{authorization:'Bearer '+token[as]}:{})},body:body?JSON.stringify(body):undefined});
  try{
    const pub=await publicGet({request:request(null,'public'),env});
    assert.equal(pub.status,200);
    const publicBody=await pub.json();
    assert.deepEqual(publicBody.records.map(x=>x.donorName).sort(),['익명','익명','홍길동']);
    assert.ok(!JSON.stringify(publicBody).includes('2026300001'));
    assert.equal((await mineGet({request:request(null,'mine'),env})).status,401);
    const own=await mineGet({request:request('member','mine'),env});
    assert.equal(own.status,200);
    assert.deepEqual((await own.json()).records.map(x=>x.amount),['10000']);
    assert.equal((await manageGet({request:request('member','manage'),env})).status,403);
    assert.equal((await manageGet({request:request('staff','manage'),env})).status,200);
    const unauthorized=await managePost({request:request('member','manage',{action:'save',record:{date:'2026-10-05',
      donorName:'',studentId:'',amount:'5000',anonymous:''}}),env});
    assert.equal(unauthorized.status,403);
    const added=await managePost({request:request('staff','manage',{action:'save',record:{date:'2026-10-05',
      donorName:'',studentId:'',amount:'5000',anonymous:''}}),env});
    assert.equal(added.status,200);
    assert.equal((await added.json()).record.anonymous,'x');
    const recordsBefore=[...docs.values()].filter(doc=>doc.name.startsWith(root+'/donations/')).length;
    const imported=await managePost({request:request('staff','manage',{action:'import',rows:[{
      date:'2026-10-06',donorName:'',studentId:'',amount:'200',anonymous:'n',
    }]}),env});
    assert.equal(imported.status,200);
    assert.equal([...docs.values()].filter(doc=>doc.name.startsWith(root+'/donations/')).length,recordsBefore+1);
    assert.equal((await purgePost({request:request('staff','purge',{confirmation:DONATIONS_RESET_CONFIRMATION}),env})).status,403);
    assert.equal((await purgePost({request:request('super','purge',{confirmation:'잘못된 확인'}),env})).status,400);
    const reset=await purgePost({request:request('super','purge',{confirmation:DONATIONS_RESET_CONFIRMATION}),env});
    assert.equal(reset.status,200);assert.equal((await reset.json()).done,true);
    assert.equal([...docs.keys()].filter(key=>key.startsWith(root+'/donations/')).length,0);
    assert.equal(docs.has(root+'/financeSettings/anonymousDonors'),false);
    assert.equal(docs.has(root+'/users/'+actors.member.uid),true);
  }finally{globalThis.fetch=previousFetch;}
});
