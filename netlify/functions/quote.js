exports.handler = async (event) => {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  const symbol = String(event.queryStringParameters?.symbol || '').trim().toUpperCase();
  if (!/^[A-Z]{1,5}(?:[.-][A-Z]{1,2})?$/.test(symbol)) return {statusCode:400,headers,body:JSON.stringify({error:'유효한 미국 주식 티커를 입력해 주세요.'})};
  const key = process.env.MASSIVE_API_KEY;
  if (!key) return {statusCode:503,headers,body:JSON.stringify({error:'Netlify 환경변수 MASSIVE_API_KEY가 설정되지 않았습니다.'})};
  try {
    const url = `https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true`;
    const response = await fetch(url, {headers:{'Authorization':`Bearer ${key}`,'Accept':'application/json'}, signal:AbortSignal.timeout(9000)});
    const payload = await response.json();
    if (!response.ok || payload.status === 'ERROR') return {statusCode:response.status===429?429:502,headers,body:JSON.stringify({error:response.status===429?'API 호출 제한에 도달했어요. 잠시 후 다시 시도해 주세요.':`시세 조회 실패 (${response.status}): ${payload.error || payload.message || '플랜 또는 티커를 확인해 주세요.'}`})};
    const bar = Array.isArray(payload.results) ? payload.results[0] : null;
    if (!bar) return {statusCode:404,headers,body:JSON.stringify({error:'해당 티커의 전 거래일 데이터가 없습니다.'})};
    return {statusCode:200,headers,body:JSON.stringify({symbol,date:new Date(bar.t).toISOString().slice(0,10),open:bar.o,high:bar.h,low:bar.l,close:bar.c,volume:bar.v,vwap:bar.vw ?? null,transactions:bar.n ?? null,source:'Massive 전 거래일 일봉 (실시간 아님)'})};
  } catch (err) {return {statusCode:502,headers,body:JSON.stringify({error:'데이터 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'})};}
};
