var i = n=>n();function t(n){
  try{let e = n();return e instanceof Promise ? e.then(r=>[r, void 0]).catch(r=>[void 0, r]) : [e, void 0];}
  catch(e){return [void 0, e];}
}function d(n){
  try{let e = n();return e instanceof Promise ? e.catch(()=>{}) : e;}
  catch{return;}
}export{ t as either, i as iife, d as unwrap };