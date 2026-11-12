import {upstream,send,handlerError,getId} from '../../server/pokeapi.js';
export default async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{error:{message:'Método não permitido'}});
  const id=getId(req);
  if(!id) return send(res,400,{error:{message:'Identificador inválido.'}});
  try { send(res,200,await upstream(`pokemon-species/${id}`)); }
  catch(e) { handlerError(res,e); }
}
