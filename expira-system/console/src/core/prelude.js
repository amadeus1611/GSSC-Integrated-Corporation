(() => {
const $=s=>document.querySelector(s),app=$("#app"),root=document.documentElement;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* storage adapter (plan §3.4). Every unit reads and writes through KV; none touches localStorage or db.
   localStorage is always the write-through cache under the v6 key names, so the console works offline and a
   rollback still reads it. When this viewer has a private db subtree (the page declares `user` beside `db`),
   each key and each chat is mirrored to data/users/<id>/ and read back on load; otherwise the browser is the store. */
const KV=(()=>{const P="expira.",AL={chats:"v6"},KEYS=["chats","prefs","opt","folders","theme","runview","mapView","noExample"],subs=new Set(),seen=new Map(),q=new Map();
 let R=null,run=false,full=false;
 const lk=k=>P+(AL[k]||k);
 const get=(k,d)=>{let v=null;try{v=localStorage.getItem(lk(k));if(v==null&&k==="chats")v=localStorage.getItem(P+"v5")}catch(e){}if(v==null)return d;try{return JSON.parse(v)}catch(e){return v}};
 const local=(k,v)=>{try{if(v==null)localStorage.removeItem(lk(k));else localStorage.setItem(lk(k),typeof v==="string"?v:JSON.stringify(v));full=false;return true}catch(e){if(!full){full=true;subs.forEach(f=>f("!full"))}return false}};
 /* one db document per key, and one per chat, so a write sends only what changed */
 const docs=(k,v)=>k==="chats"?(v||[]).filter(c=>c&&!c.example).map(c=>["c:"+c.id,{v:c}]):[["k:"+k,{v:v??null}]];
 const flush=async()=>{if(run||!R)return;run=true;try{while(q.size){const [id,b]=q.entries().next().value;q.delete(id);try{b?await R.doc(id).set(b):await R.doc(id).delete()}catch(e){if(e&&e.code==="invalid_argument")continue;if(!q.has(id))q.set(id,b);setTimeout(flush,4000);break}}}finally{run=false}};
 const mirror=(k,v)=>{if(!R)return;const cur=new Set();for(const [id,b] of docs(k,v)){cur.add(id);const j=JSON.stringify(b);if(j.length>250000)continue;if(seen.get(id)!==j){seen.set(id,j);q.set(id,b)}}
  if(k==="chats")for(const id of [...seen.keys()])if(id.startsWith("c:")&&!cur.has(id)){seen.delete(id);q.set(id,null)}clearTimeout(mirror.t);mirror.t=setTimeout(flush,400)};
 const put=(k,v)=>{const ok=local(k,v);mirror(k,v);return ok};
 /* hydrate: the db copy wins for what it holds; what only this browser holds is sent up */
 const ready=(async()=>{try{const C=window.claude;const u=await C?.use?.("user"),id=u&&typeof u.id==="function"?await u.id():null;if(!id)return"local";const d=await C.use("db");if(!d)return"local";
  const col=d.collection("data/users/"+id),s=await col.get();R=col;const got={},dc=[];
  for(const x of s.docs){const b=x.data();if(!b)continue;seen.set(x.id,JSON.stringify(b));if(x.id.startsWith("c:"))dc.push(b.v);else got[x.id.slice(2)]=b.v}
  for(const k of KEYS){if(k==="chats")continue;if(k in got){const j=JSON.stringify(got[k]);if(j!==JSON.stringify(get(k,null))){local(k,got[k]);subs.forEach(f=>f(k,got[k]))}}else{const v=get(k,null);if(v!=null)mirror(k,v)}}
  const lc=get("chats",[])||[],ids=new Set(dc.map(c=>c.id)),merged=[...dc,...lc.filter(c=>!ids.has(c.id))];
  local("chats",merged);mirror("chats",merged);if(dc.length)subs.forEach(f=>f("chats",merged));return"db"}catch(e){R=null;return"local"}})();
 /* the whole library as one file, for moving devices or owners */
 const exportAll=()=>{const o={format:"expira.library",version:1,exported:new Date().toISOString()};for(const k of KEYS)if(k!=="noExample"){let v=get(k,null);if(k==="chats")v=(v||[]).filter(c=>!c.example);if(v!=null)o[k]=v}return o};
 const importAll=o=>{if(!o||typeof o!=="object"||(o.format&&o.format!=="expira.library"))throw new Error("Not an EXPIRA library file");
  const ch=Array.isArray(o.chats)?o.chats.filter(c=>c&&typeof c.id==="string"&&Array.isArray(c.turns)):[],fo=Array.isArray(o.folders)?o.folders.filter(f=>f&&typeof f.id==="string"):[];
  if(!ch.length&&!fo.length&&!o.prefs&&!o.opt)throw new Error("Nothing to import");
  const byId=(a,b)=>{const m=new Map(a.map(x=>[x.id,x]));b.forEach(x=>m.set(x.id,x));return[...m.values()]};
  const n={chats:byId(get("chats",[])||[],ch),folders:byId(get("folders",[])||[],fo)};
  if(o.prefs&&typeof o.prefs==="object")n.prefs=Object.assign({},get("prefs",{}),o.prefs);if(o.opt&&typeof o.opt==="object")n.opt=Object.assign({},get("opt",{}),o.opt);
  for(const k in n){put(k,n[k]);subs.forEach(f=>f(k,n[k]))}return{chats:ch.length,folders:fo.length}};
 return{get,put,remove:k=>put(k,null),list:()=>KEYS.filter(k=>get(k,null)!=null),subscribe:f=>(subs.add(f),()=>subs.delete(f)),ready,where:()=>R?"db":"local",exportAll,importAll}})();
window.__KV=KV;
const PREF=Object.assign({name:"",full:"",org:"",text:"m",density:"comfortable",motion:"full",grain:true},KV.get("prefs",{}));
const FORCES=Object.assign({center:1,repel:1,link:1,dist:1},PREF.forces||{});
const savePref=()=>KV.put("prefs",Object.assign({},PREF,{forces:FORCES}));
const MQR=matchMedia("(prefers-reduced-motion: reduce)");let reduce=MQR.matches||PREF.motion==="calm";let QUOTE="";
root.dataset.text=PREF.text;root.dataset.density=PREF.density;root.classList.toggle("calm",PREF.motion==="calm");

const pad=(n,w=2)=>String(n).padStart(w,"0");
const ROMAN=["I","II","III","IV","V","VI","VII","VIII"];

