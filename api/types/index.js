import {upstream,send,handlerError} from '../../server/pokeapi.js';
export default async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{error:{message:'Método não permitido'}});
  try { send(res,200,await upstream('type')); }
  catch(e) { handlerError(res,e); }
}
