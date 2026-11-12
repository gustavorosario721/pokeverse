import {upstream,send,handlerError} from '../../server/pokeapi.js';
export default async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{error:{message:'Método não permitido'}});
  const rawLimit=Number(req.query.limit ?? 24);
  const rawOffset=Number(req.query.offset ?? 0);
  if(!Number.isInteger(rawLimit)||!Number.isInteger(rawOffset)||rawOffset<0||rawLimit<1) {
    return send(res,400,{error:{message:'Parâmetros de paginação inválidos.'}});
  }
  const limit=Math.min(rawLimit,100);
  try { send(res,200,await upstream(`pokemon?limit=${limit}&offset=${rawOffset}`)); }
  catch(e) { handlerError(res,e); }
}
