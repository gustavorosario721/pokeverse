import {upstream,send,handlerError,getId} from '../../server/pokeapi.js';

export default async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{error:{message:'Método não permitido'}});
  const id=getId(req);
  if(!id) return send(res,400,{error:{message:'Identificador inválido.'}});
  try {
    const species=await upstream(`pokemon-species/${id}`);
    const chainUrl=species.evolution_chain?.url;
    if(!chainUrl || !chainUrl.startsWith('https://pokeapi.co/api/v2/evolution-chain/')) {
      return send(res,502,{error:{message:'A PokéAPI retornou uma cadeia evolutiva inválida.'}});
    }
    const chainId=chainUrl.match(/evolution-chain\/(\d+)\/?$/)?.[1];
    if(!chainId) return send(res,502,{error:{message:'Não foi possível identificar a cadeia evolutiva.'}});
    send(res,200,await upstream(`evolution-chain/${chainId}`));
  } catch(e) { handlerError(res,e); }
}
