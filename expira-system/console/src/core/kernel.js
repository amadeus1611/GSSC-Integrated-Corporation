/* ---------- the kernel builder: runtime/build_derivative.py (Mode B), ported line for line ----------
   A derivative is the quotation master's <head> carried verbatim, at most one appended derivative style,
   and a new <body> written in the master's component vocabulary; brand assets hydrate from the package,
   hash-verified, byte-identical to the master's. Any failed check is a hard stop: nothing is delivered. */
const K_STYLE_RE=/<style\b[^>]*>[\s\S]*?<\/style>/g;
const K_PRIMARY="duke_y_demayo";
function kB64(b64){if(typeof atob==="function"){const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}return new Uint8Array(Buffer.from(b64,"base64"))}
async function kSha(u){if(typeof crypto!=="undefined"&&crypto.subtle){const h=await crypto.subtle.digest("SHA-256",u);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("")}return require("crypto").createHash("sha256").update(u).digest("hex")}
async function kAssemble(K,src,opt={}){
 const checks=[],fail=m=>({ok:false,error:m,checks});
 const master=K.template,ver=K.assembly.verification;
 const title=src.match(/<title>([\s\S]*?)<\/title>/),bodyM=src.match(/<body\b[\s\S]*?<\/body>/);
 if(!title||!bodyM)return fail("The source needs a <title> and a <body>.");
 let body=bodyM[0];const pre=src.slice(0,bodyM.index);
 const dstyles=pre.match(K_STYLE_RE)||[];
 const link=pre.match(/<link rel="gssc-derivative-style" href="([^"]+)"\s*\/?>/);
 if(link){const stem=link[1].split("/").pop().replace(/\.css$/,"");const css=K.derivative_css[stem];if(css==null)return fail(`Unknown derivative style layer: ${stem}.`);dstyles.push(`<style id="gssc-derivative-${stem}">\n${css}</style>`)}
 if(dstyles.length>1)return fail("A derivative may append ONE style element (Module 10 additive rule).");
 if(dstyles.length&&dstyles[0].includes(":root"))return fail("Derivative tokens belong on a scoped class, not :root (Module 10 additive rule).");
 checks.push(["One derivative style at most",true]);
 const officers=K.kernel["02_governance"].active_officers;
 if(src.includes("{{GSSC_SIGNATORY_2:")){const key=opt.second;
  if(!officers[key])return fail(`This document needs a second signatory: one of ${Object.keys(officers).filter(k=>k!==K_PRIMARY).join(", ")}.`);
  if(key===K_PRIMARY)return fail("The second signatory must be someone other than the President.");
  body=body.split("{{GSSC_SIGNATORY_2:name}}").join(officers[key].name).split("{{GSSC_SIGNATORY_2:titles}}").join(officers[key].titles.join(" · "));
  checks.push([`Second signatory from 02_governance: ${officers[key].name}`,true])}
 const head0=master.slice(0,master.indexOf("</head>"));let masterStyles=head0.match(K_STYLE_RE)||[];
 if(dstyles.length){const css=dstyles[0].replace(/\/\*[\s\S]*?\*\//g,"");const sel=[...css.replace(/<[^>]+>/g,"").matchAll(/([^{}]+)\{/g)].map(m=>m[1]).join(" ");
  const cls=t=>new Set([...t.matchAll(/\.([A-Za-z][\w-]*)/g)].map(m=>m[1]));const mine=cls(sel),theirs=cls(masterStyles.join(" "));const clash=[...mine].filter(x=>theirs.has(x)).sort();
  if(clash.length)return fail(`The derivative style reuses master class names (${clash.join(", ")}); choose new names.`)}
 checks.push(["No master class names redefined",true]);
 const head=head0.replace(/<title>[\s\S]*?<\/title>/,`<title>${title[1].trim()}</title>`);
 const kv=K.kernel["00_meta"].kernel_identity.kernel_version,name=opt.name||"GSSC-DERIVATIVE.html";
 const prov="\n<!--GSSC DERIVATIVE PROVENANCE (Module 10 provenance_rule)\n"+`  document: ${name}\n`+`  master: GSSC Universal Quotation Master (package quotation_template_payload_base64), kernel ${kv}\n`+`  master tokenized sha256: ${ver.tokenized_template_sha256}\n`+`  verified against hydrated digest: ${ver.hydrated_template_sha256}\n`+`  carried verbatim: ${masterStyles.length} master style elements, masthead/margin-rail/watermark/stripe/colophon, A4 geometry, print rules\n`+`  substitutions: <title>; <body> element (data-* attributes and content, written in master component vocabulary)${dstyles.length?"; one appended derivative style element":""}\n`+"  assets: hydrated from package brand_assets, byte-identical to the master\n"+(opt.builder||"  builder: gssc-system/runtime/build_derivative.py -->\n");
 let out=head+prov+(dstyles.length?dstyles[0]+"\n":"")+"</head>\n"+body+"\n</html>\n";
 const payloads=new Set();
 for(const [n,a] of Object.entries(K.brand_assets)){const raw=kB64(a.base64);if(await kSha(raw)!==a.sha256_of_decoded_image)return fail(`Asset hash mismatch for ${n}.`);payloads.add(a.base64);const v=`data:${a.mime_type};base64,${a.base64}`;out=out.split(a.token).join(v);masterStyles=masterStyles.map(s=>s.split(a.token).join(v))}
 checks.push(["Brand assets hash-verified and hydrated",true]);
 if(out.includes("{{GSSC_ASSET:"))return fail("An asset token was left unresolved.");
 if(out.includes("{{GSSC_SIGNATORY_2:"))return fail("A signatory token was left unresolved.");
 checks.push(["Zero unresolved tokens",true]);
 const missing=masterStyles.filter(s=>!out.includes(s));if(missing.length)return fail("Master style elements were not carried verbatim.");
 checks.push([`${masterStyles.length} master style elements carried verbatim`,true]);
 const foreign=[...out.matchAll(/data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)/g)].map(m=>m[1]).filter(x=>!payloads.has(x));if(foreign.length)return fail("A foreign image payload was introduced.");
 checks.push(["No foreign images",true]);
 const pages=(out.match(/<section class="page\b/g)||[]).length;
 return {ok:true,html:out,pages,checks,kernel:kv}}


/* the kernel library ships beside the page (lib/gssc-kernel.json): kernel modules, the tokenized master, brand assets, derivative sources */
const KLIB={p:null,v:null,err:"",load(){return this.p||(this.p=(async()=>{let last="";for(const u of ["lib/gssc-kernel.json","./lib/gssc-kernel.json",new URL("lib/gssc-kernel.json",location.href).href]){try{const r=await fetch(u,{cache:"force-cache"});if(r.ok)return await r.json();last="HTTP "+r.status}catch(e){last=e.message||String(e)}}this.err=last;throw new Error("The kernel library could not be loaded ("+last+").")})().then(k=>(this.v=k)).catch(e=>{this.p=null;throw e}))}};
const DOCT={quotation:"Quotation",company_profile:"Company profile",contract:"Contract (CMSA)",secretary_certificate:"Secretary's certificate",board_resolution:"Board resolution",notarial_acknowledgment:"Notarial acknowledgment"};
const kJ=(o,n)=>{const t=JSON.stringify(o);return t.length>n?t.slice(0,n)+"…":t};
/* what each desk reads from the kernel before it works */
function kDigest(K,role){if(!K)return "";const k=K.kernel,m=[];
 if(role==="finance")m.push(["06_quotation_doctrine",6000],["14_accounting_compliance",3500]);
 if(role==="legal")m.push(["09_legal_doctrine",6500],["02_governance",2500]);
 if(role==="builder"||role==="decision")m.push(["01_identity",3000]);
 return m.length?`\nKernel ${K.kernel_version} (binding company doctrine; follow it over general practice):\n`+m.map(([id,n])=>`[${id}] ${kJ(k[id],n)}`).join("\n")+"\n":""}
async function kBuild(type,src,second){const K=await KLIB.load();const ref=K.derivatives.find(d=>d.type===type);const stamp=new Date();const file=`GSSC-${(type||"DOC").toUpperCase().replace(/_/g,"-")}-${stamp.getFullYear()}${pad(stamp.getMonth()+1)}${pad(stamp.getDate())}.html`;
 return Object.assign(await kAssemble(K,src,{second:second||(ref&&ref.second_signatory)||undefined,name:file,builder:"  builder: EXPIRA Console kernel builder (port of gssc-system/runtime/build_derivative.py) -->\n"}),{file})}
/* a brief that names a document gets one; the words are matched here, not left to the planner */
function docIntent(q){const t=String(q||"").replace(/^(?:> ?.*\n)+\n*/,"");if(!/\b(prepare|draft|make|create|write|generate|produce|build|issue|send|need|want|give)\b/i.test(t))return null;
 if(/secretary'?s?\s+cert/i.test(t))return "secretary_certificate";if(/board\s+resolution/i.test(t))return "board_resolution";if(/notari[sz]?(al|ed|e)|acknowledg(e)?ment/i.test(t))return "notarial_acknowledgment";
 if(/company\s+profile|corporate\s+profile/i.test(t))return "company_profile";if(/\bcontract\b|\bCMSA\b|services?\s+agreement/i.test(t))return "contract";if(/\bquotation\b|\bquote\b|price\s+proposal/i.test(t))return "quotation";return null}
let DOCSEL=null;
function setDoc(t){DOCSEL=t||null;$("#dbar").hidden=!DOCSEL;$("#dbT").textContent=DOCSEL?`${DOCT[DOCSEL]}, from the kernel`:"";$("#docSum").textContent=DOCSEL?DOCT[DOCSEL]:"Document";$("#docBtn").dataset.on=DOCSEL?"1":"";$("#docMenu").querySelectorAll("[data-dt]").forEach(b=>b.setAttribute("aria-checked",String((b.dataset.dt||null)===DOCSEL)))}
$("#dbX").onclick=()=>setDoc(null);
function docMenu(o){const m=$("#docMenu"),b=$("#docBtn");o=o??!m.classList.contains("open");if(o){closeCtx();menu(false);setMenu(false);acctMenu(false);closeSheet();const r=b.getBoundingClientRect(),w=212;m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px";m.style.top="0px";m.classList.add("open");const hh=m.offsetHeight;let y=r.top-hh-8;if(y<8)y=Math.min(innerHeight-hh-8,r.bottom+8);m.style.top=y+"px";setTimeout(()=>m.querySelector('[aria-checked="true"]')?.focus(),60)}else m.classList.remove("open");b.setAttribute("aria-expanded",String(!!o))}
$("#docBtn").onclick=e=>{e.stopPropagation();docMenu()};
$("#docMenu").addEventListener("click",e=>{const b=e.target.closest("[data-dt]");if(!b)return;setDoc(b.dataset.dt||null);setTimeout(()=>{docMenu(false);promptEl.focus()},200)});
document.addEventListener("pointerdown",e=>{if($("#docMenu").classList.contains("open")&&!e.target.closest("#docMenu,#docBtn"))docMenu(false)});
