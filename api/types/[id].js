import {upstream,send,handlerError,getId} from '../../server/pokeapi.js';
export default async function handler(req,res){const id=getId(req);if(!id)return send(res,400,{error:{message:'Tipo inválido.'}});try{send(res,200,await upstream(`type/${id}`))}catch(e){handlerError(res,e)}}
