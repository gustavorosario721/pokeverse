import {store} from '../state/store.js';
/** Serviço independente para regras de favoritos e persistência local. */
export const favoritesService={list:()=>store.favorites(),has:(id)=>store.isFavorite(Number(id)),add:async(id)=>{const pokemon=await (await import('./api.js')).api.pokemon(id);if(!store.isFavorite(pokemon.id))store.toggleFavorite(pokemon);return pokemon},remove(id){const item=store.favorites().find(p=>p.id===Number(id));if(!item)return false;store.toggleFavorite({id:Number(id)});return true},toggle(pokemon){return store.toggleFavorite(pokemon)}};
