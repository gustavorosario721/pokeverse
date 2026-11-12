import {upstream,send,handlerError} from '../../server/pokeapi.js';
export default async function handler(req,res){try{send(res,200,await upstream('type'))}catch(e){handlerError(res,e)}}
