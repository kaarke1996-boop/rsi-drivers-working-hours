(function(root){
  'use strict';
  const drivers=['Alinur','Noshad'];
  function minutes(start,end){
    if(!/^\d{2}:\d{2}(:00)?$/.test(start)||!/^\d{2}:\d{2}(:00)?$/.test(end)) return NaN;
    const parse=t=>{const [h,m]=t.split(':').map(Number);return h<24&&m<60?h*60+m:NaN;};
    const a=parse(start),b=parse(end); return b-a+(b<a?1440:0);
  }
  function duration(n){return `${Math.floor(n/60)}h ${String(n%60).padStart(2,'0')}m`;}
  function totals(rows){const result={Alinur:0,Noshad:0};for(const r of rows)if(drivers.includes(r.driver))result[r.driver]+=Number(r.minutes);return result;}
  function csv(rows){return '\ufeff'+[['Working date','Driver','Start time','End time','End day','Minutes','Decimal hours'],...rows.map(r=>[r.work_date,r.driver,r.start_time.slice(0,5),r.end_time.slice(0,5),r.end_time<r.start_time?'Following day':'Same day',r.minutes,(r.minutes/60).toFixed(4)])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');}
  const api={drivers,minutes,duration,totals,csv};
  if(typeof module!=='undefined')module.exports=api;else root.DriverHours=api;
})(typeof window!=='undefined'?window:this);
