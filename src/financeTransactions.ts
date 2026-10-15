import { auth } from './firebase';

export type DonationAccount={bank:string;number:string;holder:string};
export type AccountVersion=DonationAccount&{updateTime:string|null};
export type FinanceTransactionInput={dateTime:string;type:'입금'|'출금';amount:string;balance:string;description:string};
export type FinanceTransaction=FinanceTransactionInput&{id:string;updateTime:string};
export const DEFAULT_ACCOUNT:DonationAccount={bank:'농협',number:'302-0000-0000-31',holder:'나재원'};
export const EMPTY_TRANSACTION:FinanceTransactionInput={dateTime:'',type:'출금',amount:'',balance:'',description:''};
export const TRANSACTION_COLUMNS=['거래일시','거래구분','거래금액','거래 후 잔액','거래내용'] as const;

async function request<T>(path:string,body?:unknown,protectedCall=false):Promise<T>{
  const token=protectedCall?await auth.currentUser?.getIdToken():null;
  if(protectedCall&&!token)throw Error('로그인이 필요합니다.');
  const res=await fetch('/api/finance/'+path,{
    method:body===undefined?'GET':'POST',
    headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(token?{authorization:'Bearer '+token}:{})},
    body:body===undefined?undefined:JSON.stringify(body),
  });
  const data=await res.json();
  if(!res.ok)throw Error(typeof data.error==='string'?data.error:'회비 거래 정보를 처리하지 못했습니다.');
  return data as T;
}
export const readDonationAccount=()=>request<{account:DonationAccount}>('account');
export const readAccountForManagement=()=>request<{account:AccountVersion}>('account-manage',undefined,true);
export const saveDonationAccount=(account:DonationAccount,expectedUpdateTime:string|null)=>
  request<{account:AccountVersion}>('account',{account,expectedUpdateTime},true);
export const readExpenses=()=>request<{records:FinanceTransactionInput[] & {id:string}[]}>('expenses');
export const readExpensesForManagement=()=>request<{records:FinanceTransaction[]}>('expenses-manage',undefined,true);
export const saveExpense=(record:FinanceTransactionInput,id?:string,expectedUpdateTime?:string)=>
  request<{record:FinanceTransaction}>('expenses-manage',{action:'save',record,id,expectedUpdateTime},true);

export function validateTransaction(input:FinanceTransactionInput):FinanceTransactionInput{
  const dateTime=input.dateTime.trim(),type=input.type;
  const amount=input.amount.replaceAll(',','').trim(),balance=input.balance.replaceAll(',','').trim();
  const description=input.description.trim();
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)||
    Number.isNaN(Date.parse(dateTime+':00Z'))||
    new Date(dateTime+':00Z').toISOString().slice(0,16)!==dateTime)throw Error('거래일시를 확인해 주세요.');
  if(type!=='입금'&&type!=='출금')throw Error('거래구분을 선택해 주세요.');
  if(!/^\d{1,13}$/.test(amount)||BigInt(amount)<1n||BigInt(amount)>10000000000000n)throw Error('거래금액은 양의 정수여야 합니다.');
  if(!/^\d{1,13}$/.test(balance)||BigInt(balance)>10000000000000n)throw Error('거래 후 잔액은 0원 이상의 정수여야 합니다.');
  if(!description||description.length>240)throw Error('거래내용은 1~240자여야 합니다.');
  return {dateTime,type,amount:String(BigInt(amount)),balance:String(BigInt(balance)),description};
}
export function downloadTransactions(rows:readonly FinanceTransactionInput[]):string{
  const cells=[TRANSACTION_COLUMNS,...rows.map(row=>[row.dateTime.replace('T',' '),row.type,row.amount,row.balance,row.description])];
  const escape=(value:string)=>'"'+(/^[=+\-@\t\r]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';
  return '\uFEFF'+cells.map(row=>row.map(escape).join(',')).join('\r\n');
}
export const formatTransactionDate=(value:string)=>value.replace('T',' ');
export const formatWon=(amount:string)=>BigInt(amount).toLocaleString('ko-KR')+'원';
