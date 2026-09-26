(() => {
const $=s=>document.querySelector(s),app=$("#app"),root=document.documentElement;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const PREF=Object.assign({name:"Duke",text:"m",density:"comfortable",motion:"full",grain:true},(()=>{try{return JSON.parse(localStorage.getItem("expira.prefs")||"{}")}catch(e){return {}}})());
const FORCES=Object.assign({center:1,repel:1,link:1,dist:1},PREF.forces||{});
const savePref=()=>{try{localStorage.setItem("expira.prefs",JSON.stringify(Object.assign({},PREF,{forces:FORCES})))}catch(e){}};
const MQR=matchMedia("(prefers-reduced-motion: reduce)");let reduce=MQR.matches||PREF.motion==="calm";let QUOTE="";
root.dataset.text=PREF.text;root.dataset.density=PREF.density;root.classList.toggle("calm",PREF.motion==="calm");

const pad=(n,w=2)=>String(n).padStart(w,"0");
const ROMAN=["I","II","III","IV","V","VI","VII","VIII"];

