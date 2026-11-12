const BASE='https://pokeapi.co/api/v2';
const cache=new Map();
export async function upstream(path){
  const key=path; const hit=cache.get(key);
  if(hit&&hit.expires>Date.now()) return hit.data;
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8500);
  try{const response=await fetch(`${BASE}/${path.replace(/^\//,'')}`,{signal:controller.signal,headers:{accept:'application/json'}});if(!response.ok){const error=new Error(response.status===404?'Recurso não encontrado na PokéAPI':'Falha ao consultar a PokéAPI');error.status=response.status;throw error;}const data=await response.json();cache.set(key,{data,expires:Date.now()+5*60*1000});return data;}finally{clearTimeout(timer);}
}
export function send(res,status,data){res.status(status);res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');res.json(data)}
export function handlerError(res,error){const status=error.status|| (error.name==='AbortError'?504:502);send(res,status,{error:{message:error.name==='AbortError'?'A consulta demorou mais que o esperado. Tente novamente.':error.message||'Não foi possível consultar os dados.',status}})}
export function getId(req){const raw=req.query?.id||req.query?.name||req.query?.q;const value=String(raw||'').trim().toLowerCase();if(!value||value.length>80||!/^[a-z0-9-]+$/.test(value))return null;return value}
