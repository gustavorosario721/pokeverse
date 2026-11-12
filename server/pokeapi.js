const BASE='https://pokeapi.co/api/v2';
const cache=new Map();
const TTL=5*60*1000;
const MAX_CACHE_ENTRIES=250;

export async function upstream(path){
  const normalized=String(path).replace(/^\/+/, '');
  if(!/^[a-z0-9/?=&-]+$/i.test(normalized)) {
    const error=new Error('Caminho de consulta inválido.');
    error.status=400;
    throw error;
  }
  const hit=cache.get(normalized);
  if(hit&&hit.expires>Date.now()) return hit.data;

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8500);
  try {
    const response=await fetch(`${BASE}/${normalized}`,{
      signal:controller.signal,
      headers:{accept:'application/json'}
    });
    if(!response.ok){
      const error=new Error(response.status===404?'Recurso não encontrado na PokéAPI':'Falha ao consultar a PokéAPI');
      error.status=response.status===404?404:502;
      throw error;
    }
    const data=await response.json();
    if(cache.size>=MAX_CACHE_ENTRIES) {
      const oldest=cache.keys().next().value;
      if(oldest) cache.delete(oldest);
    }
    cache.set(normalized,{data,expires:Date.now()+TTL});
    return data;
  } catch(error) {
    if(error.name==='AbortError') {
      const timeout=new Error('Tempo limite excedido ao consultar a PokéAPI.');
      timeout.status=504;
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function send(res,status,data){
  res.status(status);
  res.setHeader('Cache-Control',status===200?'public, s-maxage=300, stale-while-revalidate=600':'no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.json(data);
}

export function handlerError(res,error){
  const status=Number.isInteger(error.status)?error.status:502;
  const safeMessage=status===504
    ?'A consulta demorou mais que o esperado. Tente novamente.'
    :status===404
      ?'Recurso não encontrado.'
      :'Não foi possível consultar os dados no momento.';
  send(res,status,{error:{message:safeMessage,status}});
}

export function getId(req){
  const raw=req.query?.id||req.query?.name||req.query?.q;
  const value=String(raw||'').trim().toLowerCase();
  if(!value||value.length>80||!/^[a-z0-9-]+$/.test(value)) return null;
  return value;
}
