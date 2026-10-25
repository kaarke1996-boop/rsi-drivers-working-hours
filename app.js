'use strict';
const $=id=>document.getElementById(id),C=window.DRIVER_HOURS_CONFIG,H=window.DriverHours;
let records=[],ready=false,loading=0;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
$('work-date').max=today;$('work-date').value=today;$('month').max=today.slice(0,7);
function message(text,error=false){$('message').textContent=text;$('message').className=error?'error':'';$('message').hidden=false;}
function connectivity(ok){ready=ok;$('dot').className=ok?'online':'offline';$('connection').textContent=ok?'Connected · Shared across devices':'Connection unavailable · Retry with Refresh';$('save').disabled=!ok;}
async function request(method,query='',body){
  const response=await fetch(C.supabaseUrl+'/rest/v1/driver_hours'+query,{method,headers:{apikey:C.supabasePublishableKey,'Content-Type':'application/json',Prefer:'return=minimal'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  if(!response.ok){let error={};try{error=await response.json();}catch{}if(response.status===409||error.code==='23505')throw Error('A shift already exists for this driver and date. Contact your supervisor to correct it.');if(error.code==='23514'||error.code==='42501')throw Error('Entry rejected. Use an allowed driver, a date from October 2026 through today, and a shift of 1 minute to 18 hours.');throw Error('Shared database is unavailable ('+response.status+'). Please try again.');}
  return response.status===204||method==='POST'?null:response.json();
}
function filtered(){return records.filter(r=>!$('filter').value||r.driver===$('filter').value);}
function render(){
 const sums=H.totals(records);for(const [driver,prefix]of [['Alinur','alinur'],['Noshad','noshad']]){$(prefix+'-total').textContent=H.duration(sums[driver]);const n=records.filter(r=>r.driver===driver).length;$(prefix+'-days').textContent=n+' shift'+(n===1?'':'s')+' recorded';}
 $('combined-total').textContent=H.duration(sums.Alinur+sums.Noshad);
 const rows=filtered();$('record-count').textContent=rows.length;$('rows').replaceChildren();
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.className='empty';td.textContent='No shifts recorded for this selection.';tr.append(td);$('rows').append(tr);}
 for(const row of rows){const tr=document.createElement('tr');for(const value of [row.work_date,row.driver,row.start_time.slice(0,5),row.end_time.slice(0,5)+(row.end_time<row.start_time?' (+1 day)':''),H.duration(row.minutes)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('rows').append(tr);}
 $('export').disabled=!ready||!rows.length;
}
async function load(){
 const token=++loading,month=$('month').value;
 if(!/^\d{4}-\d{2}$/.test(month)||month<'2026-10'||month>today.slice(0,7)){message('Choose a reporting month from October 2026 through the current month.',true);return false;}
 const [y,m]=month.split('-').map(Number),next=m===12?`${y+1}-01-01`:`${y}-${String(m+1).padStart(2,'0')}-01`;
 $('refresh').disabled=true;
 try{const data=await request('GET',`?select=id,driver,work_date,start_time,end_time,minutes&work_date=gte.${month}-01&work_date=lt.${next}&order=work_date.desc,driver.asc`);if(token!==loading)return false;records=data;connectivity(true);render();$('month-title').textContent=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T00:00:00Z'));$('updated').textContent='Last synced '+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())+' · Saudi Arabia time (UTC+3)';return true;}
 catch(e){if(token===loading){connectivity(false);$('export').disabled=true;message(e.name==='TimeoutError'?'Connection timed out. Your form has been kept. Please refresh.':e.message,true);$('updated').textContent='Not synced · Displayed records may be outdated';}return false;}
 finally{if(token===loading)$('refresh').disabled=false;}
}
function preview(){const n=H.minutes($('start-time').value,$('end-time').value);$('preview').textContent=Number.isFinite(n)&&n>0?H.duration(n):'—';$('overnight').textContent=Number.isFinite(n)&&n>0&&$('end-time').value<$('start-time').value?'Overnight shift · End time is on the following day.':'Use the date the shift started. Earlier end times mean the following day.';}
for(const id of ['start-time','end-time'])$(id).addEventListener('input',preview);
$('shift-form').addEventListener('submit',async event=>{
 event.preventDefault();const row={driver:$('driver').value,work_date:$('work-date').value,start_time:$('start-time').value,end_time:$('end-time').value},n=H.minutes(row.start_time,row.end_time);
 if(!H.drivers.includes(row.driver)||row.work_date<'2026-10-01'||row.work_date>today||!Number.isFinite(n)||n<1||n>1080){message('Enter a valid driver and date, and a shift between 1 minute and 18 hours.',true);return;}
 $('save').disabled=true;$('save').textContent='Saving…';
 try{await request('POST','',row);$('month').value=row.work_date.slice(0,7);$('start-time').value='';$('end-time').value='';preview();const synced=await load();message(synced?`${row.driver} · ${row.work_date} · ${H.duration(n)} saved to the shared database.`:'Entry saved, but the summary could not refresh. Click Refresh; do not submit again.',!synced);}
 catch(e){message(e.name==='TimeoutError'?'The save result is uncertain. Refresh to check for the entry before trying again.':e.message,true);}
 finally{$('save').disabled=!ready;$('save').textContent='Save working hours ↗';}
});
$('refresh').addEventListener('click',async()=>{if(await load())$('message').hidden=true;});$('month').addEventListener('change',()=>{$('message').hidden=true;load();});$('filter').addEventListener('change',render);
$('export').addEventListener('click',()=>{const rows=filtered();if(!rows.length)return;const url=URL.createObjectURL(new Blob([H.csv(rows)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`RSI_Driver_Hours_${$('month').value}_${$('filter').value||'All'}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});setInterval(()=>{if(!document.hidden&&$('save').textContent!=='Saving…')load();},30000);load();
