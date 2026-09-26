(() => {
const $=s=>document.querySelector(s),app=$("#app"),root=document.documentElement;
if(!root.lang)root.lang="en";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* feed lines are escaped HTML whose only tag is <em>: any other tag, from an imported file or a stored chat, is shown as text */
const feedH=s=>String(s??"").replace(/<(?!\/?em>)/g,"&lt;");
/* storage adapter (plan §3.4). Every unit reads and writes through KV; none touches localStorage or db.
   localStorage is always the write-through cache under the v6 key names, so the console works offline and a
   rollback still reads it. When this viewer has a private db subtree (the page declares `user` beside `db`),
   each key and each chat is mirrored to data/users/<id>/ and read back on load; otherwise the browser is the store. */
const KV=(()=>{const P="expira.",AL={chats:"v6"},KEYS=["chats","prefs","opt","folders","theme","runview","mapView","noExample"],subs=new Set(),seen=new Map(),q=new Map(),TE=new TextEncoder();
 let R=null,run=false,full=false,back=4000;
 const lk=k=>P+(AL[k]||k);
 const get=(k,d)=>{let v=null;try{v=localStorage.getItem(lk(k));if(v==null&&k==="chats")v=localStorage.getItem(P+"v5")}catch(e){}if(v==null)return d;try{return JSON.parse(v)}catch(e){return v}};
 const local=(k,v)=>{try{if(v==null)localStorage.removeItem(lk(k));else localStorage.setItem(lk(k),typeof v==="string"?v:JSON.stringify(v));full=false;return true}catch(e){if(!full){full=true;subs.forEach(f=>f("!full"))}return false}};
 /* the newer of two copies of one chat: the later last turn, then the longer thread */
 const stamp=c=>Math.max(c.ts||0,...(c.turns||[]).map(t=>t&&t.ts||0));
 const pick=(a,b)=>!a?b:!b?a:stamp(b)!==stamp(a)?(stamp(b)>stamp(a)?b:a):((b.turns||[]).length>(a.turns||[]).length?b:a);
 /* chats deleted while the durable copy is on, so another device's copy does not bring them back */
 const gone=new Set(get("gone",[])||[]);const saveGone=()=>{const g=[...gone].slice(-500);local("gone",g);if(R)send("k:gone",{v:g})};
 /* one db document per key, and one per chat, so a write sends only what changed */
 const docs=(k,v)=>k==="chats"?(v||[]).filter(c=>c&&!c.example).map(c=>["c:"+c.id,{v:c}]):[["k:"+k,{v:v??null}]];
 const flush=async()=>{if(run||!R)return;run=true;try{while(q.size){const [id,b]=q.entries().next().value;q.delete(id);try{b?await R.doc(id).set(b):await R.doc(id).delete();back=4000}catch(e){if(e&&e.code==="invalid_argument")continue;if(!q.has(id))q.set(id,b);setTimeout(flush,back);back=Math.min(60000,back*2);break}}}finally{run=false}};
 const send=(id,b)=>{const j=b?JSON.stringify(b):null;if(j&&TE.encode(j).length>250000){if(seen.has(id)){seen.delete(id);q.set(id,null)}return false}if(seen.get(id)===j)return true;if(j)seen.set(id,j);else seen.delete(id);q.set(id,b);clearTimeout(send.t);send.t=setTimeout(flush,400);return true};
 const mirror=(k,v)=>{if(!R)return;const cur=new Set();for(const [id,b] of docs(k,v)){cur.add(id);send(id,b)}
  if(k==="chats"){let ch=false;for(const id of [...seen.keys()])if(id.startsWith("c:")&&!cur.has(id)){send(id,null);gone.add(id.slice(2));ch=true}for(const id of cur)if(gone.delete(id.slice(2)))ch=true;if(ch)saveGone()}};
 const put=(k,v)=>{const ok=local(k,v);mirror(k,v);return ok};
 /* hydrate: for each chat the newer copy wins; deletions on either side hold; what only this browser holds is sent up */
 const ready=(async()=>{try{const C=window.claude;const u=await C?.use?.("user"),id=u&&typeof u.id==="function"?await u.id():null;if(!id)return"local";const d=await C.use("db");if(!d)return"local";
  const col=d.collection("data/users/"+id),s=await col.get();R=col;const got={},dc=new Map();
  for(const x of s.docs){const b=x.data();if(!b||x.id.startsWith("r:"))continue;seen.set(x.id,JSON.stringify(b));if(x.id.startsWith("c:")){if(b.v&&typeof b.v.id==="string"&&Array.isArray(b.v.turns))dc.set(b.v.id,cleanChat(b.v))}else got[x.id.slice(2)]=b.v}
  (got.gone||[]).forEach(g=>gone.add(g));
  for(const k of KEYS){if(k==="chats")continue;if(k in got){const j=JSON.stringify(got[k]);if(j!==JSON.stringify(get(k,null))){local(k,got[k]);subs.forEach(f=>f(k,got[k]))}}else{const v=get(k,null);if(v!=null)mirror(k,v)}}
  const lc=get("chats",[])||[],m=new Map();for(const c of lc)if(c&&!gone.has(c.id))m.set(c.id,c);for(const [cid,c] of dc)if(c){if(gone.has(cid))send("c:"+cid,null);else m.set(cid,c.example?c:pick(m.get(cid),c))}
  const merged=[...m.values()],was=JSON.stringify(lc);local("chats",merged);mirror("chats",merged);saveGone();if(JSON.stringify(merged)!==was)subs.forEach(f=>f("chats",merged));return"db"}catch(e){R=null;return"local"}})();
 /* a chat from outside (an imported file) is normalised before it is kept: counts become numbers, verdict words stay
    short words, and images must be inline data URLs; everything else is rendered escaped */
 const NUMK=new Set(["no","ts","ms","tok","atok","searches","pages","flags","conf","w","h"]),IMG=/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=]+$/;
 const clean=(x,k)=>{if(Array.isArray(x))return x.map(y=>clean(y,k));if(x&&typeof x==="object"){const o={};for(const [kk,v] of Object.entries(x)){
    if(kk==="__proto__"||kk==="constructor")continue;if(NUMK.has(kk)&&v!=null&&typeof v!=="object"){const n=+v;o[kk]=isFinite(n)?n:0;continue}
    if(kk==="v"&&typeof v==="string"){o[kk]=/^[a-z_-]{1,24}$/.test(v)?v:"";continue}
    if((kk==="thumb"||kk==="url")&&k==="imgs"){if(typeof v==="string"&&IMG.test(v))o[kk]=v;continue}
    if(kk==="id"&&k==="claims"){const n=+v;o[kk]=isFinite(n)?n:0;continue}
    o[kk]=clean(v,kk)}if(k==="imgs"&&!o.thumb&&!o.url)return null;return o}return x};
 const cleanChat=c=>{const o=clean(c,"chat");o.title=typeof o.title==="string"?o.title:"Imported chat";o.turns=(o.turns||[]).filter(t=>t&&typeof t==="object").map(t=>{if(t.role!=="user")t.role="assistant";if(typeof t.content!=="string")t.content="";if(Array.isArray(t.imgs))t.imgs=t.imgs.filter(Boolean);return t});return o};
 /* the whole library as one file, for moving devices or owners */
 const exportAll=()=>{const o={format:"expira.library",version:1,exported:new Date().toISOString()};for(const k of KEYS)if(k!=="noExample"){let v=get(k,null);if(k==="chats")v=(v||[]).filter(c=>!c.example);if(v!=null)o[k]=v}return o};
 const importAll=o=>{if(!o||typeof o!=="object"||(o.format&&o.format!=="expira.library"))throw new Error("Not an EXPIRA library file");
  const ch=Array.isArray(o.chats)?o.chats.filter(c=>c&&typeof c.id==="string"&&!c.example&&Array.isArray(c.turns)):[],fo=Array.isArray(o.folders)?o.folders.filter(f=>f&&typeof f.id==="string"&&typeof f.name==="string"):[];
  if(!ch.length&&!fo.length&&!o.prefs&&!o.opt)throw new Error("Nothing to import");
  const mc=new Map((get("chats",[])||[]).map(c=>[c.id,c]));ch.map(cleanChat).forEach(c=>mc.set(c.id,pick(mc.get(c.id),c)));
  const mf=new Map((get("folders",[])||[]).map(f=>[f.id,f]));fo.forEach(f=>mf.set(f.id,f));
  const n={chats:[...mc.values()],folders:[...mf.values()]};
  if(o.prefs&&typeof o.prefs==="object")n.prefs=Object.assign({},get("prefs",{}),o.prefs);if(o.opt&&typeof o.opt==="object")n.opt=Object.assign({},get("opt",{}),o.opt);
  for(const k in n){put(k,n[k]);subs.forEach(f=>f(k,n[k]))}return{chats:ch.length,folders:fo.length}};
 return{get,put,remove:k=>put(k,null),list:()=>KEYS.filter(k=>get(k,null)!=null),subscribe:f=>(subs.add(f),()=>subs.delete(f)),ready,where:()=>R?"db":"local",exportAll,importAll,
 /* a run's shape (desks, verdicts), kept in the private subtree only; with no private subtree it is not kept at all */
 log:b=>{ready.then(()=>{if(R)R.doc("r:"+Date.now()).set(b).catch(()=>{})})}}})();
window.__KV=KV;
const PREF=Object.assign({name:"",full:"",org:"",text:"m",density:"comfortable",motion:"full",grain:true},KV.get("prefs",{}));
const FORCES=Object.assign({center:1,repel:1,link:1,dist:1},PREF.forces||{});
const savePref=()=>KV.put("prefs",Object.assign({},PREF,{forces:FORCES}));
const MQR=matchMedia("(prefers-reduced-motion: reduce)");let reduce=MQR.matches||PREF.motion==="calm";let QUOTE="";
root.dataset.text=PREF.text;root.dataset.density=PREF.density;root.classList.toggle("calm",PREF.motion==="calm");

const pad=(n,w=2)=>String(n).padStart(w,"0");
const ROMAN=["I","II","III","IV","V","VI","VII","VIII"];

