const H={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
exports.handler=async event=>{
 const symbol=String(event.queryStringParameters?.symbol||'').trim().toUpperCase();
 if(!/^[A-Z]{1,5}(?:[.-][A-Z]{1,2})?$/.test(symbol))return {statusCode:400,headers:H,body:JSON.stringify({error:'올바른 티커를 입력하세요.'})};
 const key=process.env.MASSIVE_API_KEY;if(!key)return {statusCode:503,headers:H,body:JSON.stringify({error:'MASSIVE_API_KEY 환경변수가 없습니다.'})};
 const end=new Date(),start=new Date(end.getTime()-8*86400000);const day=d=>d.toISOString().slice(0,10);
 const url=`https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/minute/${day(start)}/${day(end)}?adjusted=true&sort=desc&limit=5000`;
 try{const r=await fetch(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(12000)});const p=await r.json();if(!r.ok||p.status==='ERROR')return {statusCode:r.status===429?429:502,headers:H,body:JSON.stringify({error:p.error||p.message||`API 오류 ${r.status} — 플랜의 분봉 접근 권한을 확인하세요.`})};const bars=(p.results||[]).sort((a,b)=>a.t-b.t).slice(-400).map(x=>({t:x.t,o:x.o,h:x.h,l:x.l,c:x.c,v:x.v,vw:x.vw??null}));return {statusCode:200,headers:H,body:JSON.stringify({symbol,bars,source:'Massive 분봉 — 플랜별 지연·범위 제한 적용',note:'전체 시장 스캔이 아닌 입력 종목 조회입니다.'})}}catch(e){return {statusCode:502,headers:H,body:JSON.stringify({error:'분봉 조회 실패: 서버 또는 데이터 권한을 확인하세요.'})}}
};
